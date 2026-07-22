"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uploadCompressedPhoto } from "@/lib/upload";
import { DateSpot, LatLng } from "@/types/spot";

// Helper to extract relative storage file path from photo URL
function extractStoragePath(imageUrl: string | null): string | null {
  if (!imageUrl || !imageUrl.trim()) return null;
  try {
    const parts = imageUrl.split("/date-photos/");
    if (parts.length > 1) {
      return parts[1].split("?")[0];
    }
    const urlObj = new URL(imageUrl);
    const pathnameParts = urlObj.pathname.split("/date-photos/");
    if (pathnameParts.length > 1) {
      return pathnameParts[1].split("?")[0];
    }
    return imageUrl.split("/").pop()?.split("?")[0] || null;
  } catch {
    const parts = imageUrl.split("/date-photos/");
    if (parts.length > 1) {
      return parts[1].split("?")[0];
    }
    return imageUrl.split("/").pop()?.split("?")[0] || null;
  }
}

export function useDateSpots(showToast: (message: string, type?: "success" | "error" | "info") => void) {
  const [spots, setSpots] = useState<DateSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Permanent Hard Delete Helper (removes DB row & Storage photo completely)
  const hardDeleteSpotInternal = useCallback(
    async (spot: DateSpot, toastMsg?: string) => {
      try {
        if (activeTimersRef.current.has(spot.id)) {
          clearTimeout(activeTimersRef.current.get(spot.id));
          activeTimersRef.current.delete(spot.id);
        }

        // 1. Delete photo file from Supabase Storage date-photos bucket
        const filePath = extractStoragePath(spot.image_url);
        if (filePath) {
          try {
            await supabase.storage.from("date-photos").remove([filePath]);
          } catch (storageErr) {
            console.error("Failed to delete photo from Supabase Storage:", storageErr);
          }
        }

        // 2. Hard delete row from Database
        await supabase.from("date_spots").delete().eq("id", spot.id);
        setSpots((prev) => prev.filter((s) => s.id !== spot.id));

        if (toastMsg) {
          showToast(toastMsg, "info");
        }
      } catch (err) {
        console.error("Failed to hard delete spot:", err);
      }
    },
    [showToast]
  );

  // Purge soft-deleted spots older than 3 days (3 * 24 * 60 * 60 * 1000 = 259,200,000 ms)
  const purgeExpiredDeletedSpots = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("date_spots")
        .select("*")
        .not("deleted_at", "is", null);

      if (error || !data || data.length === 0) return;

      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const expiredSpots = data.filter((spot) => {
        if (!spot.deleted_at) return false;
        return now - new Date(spot.deleted_at).getTime() >= threeDaysMs;
      });

      if (expiredSpots.length === 0) return;

      // 1. Extract file paths and batch delete from Storage
      const filePaths = expiredSpots
        .map((s) => extractStoragePath(s.image_url))
        .filter((path): path is string => Boolean(path));

      if (filePaths.length > 0) {
        try {
          await supabase.storage.from("date-photos").remove(filePaths);
        } catch (storageErr) {
          console.error("Failed to batch delete photos from Supabase Storage:", storageErr);
        }
      }

      // 2. Hard delete DB rows
      const expiredIds = expiredSpots.map((s) => s.id);
      await supabase.from("date_spots").delete().in("id", expiredIds);
      setSpots((prev) => prev.filter((s) => !expiredIds.includes(s.id)));
    } catch (err) {
      console.error("Failed during purge of expired deleted spots:", err);
    }
  }, []);

  // Soft Delete Function (sets deleted_at = NOW())
  const deleteDateSpot = useCallback(
    async (spot: DateSpot): Promise<boolean> => {
      try {
        if (activeTimersRef.current.has(spot.id)) {
          clearTimeout(activeTimersRef.current.get(spot.id));
          activeTimersRef.current.delete(spot.id);
        }

        const nowIso = new Date().toISOString();
        const { error } = await supabase
          .from("date_spots")
          .update({ deleted_at: nowIso })
          .eq("id", spot.id);

        if (error) throw error;

        showToast("핀이 삭제 처리되었습니다 (3일 후 완전히 영구 삭제됩니다).", "success");
        setSpots((prev) => prev.filter((s) => s.id !== spot.id));
        return true;
      } catch (err: unknown) {
        let message = "핀 삭제 처리 중 오류가 발생했습니다.";
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "object" && err !== null && "message" in err) {
          message = String((err as { message: unknown }).message);
        }
        console.error("Failed to soft delete date spot:", err);
        showToast(message, "error");
        return false;
      }
    },
    [showToast]
  );

  // Schedule auto-deletion for "Test" spots after 10 minutes (600,000 ms)
  const checkAndScheduleAutoDelete = useCallback(
    (spotList: DateSpot[]) => {
      spotList.forEach((spot) => {
        if (spot.title.trim().toLowerCase() === "test") {
          const createdAtTime = new Date(spot.created_at).getTime();
          const elapsed = Date.now() - createdAtTime;
          const tenMinutesMs = 10 * 60 * 1000;

          if (elapsed >= tenMinutesMs) {
            // Already past 10 minutes -> hard delete immediately from DB and Storage
            hardDeleteSpotInternal(spot, "⏱️ 'Test' 기록이 10분 경과하여 영구 삭제되었습니다.");
          } else if (!activeTimersRef.current.has(spot.id)) {
            // Remaining time to 10 minutes
            const remainingMs = tenMinutesMs - elapsed;
            const timerId = setTimeout(() => {
              hardDeleteSpotInternal(spot, "⏱️ 'Test' 기록이 10분 경과하여 영구 삭제되었습니다.");
            }, remainingMs);
            activeTimersRef.current.set(spot.id, timerId);
          }
        }
      });
    },
    [hardDeleteSpotInternal]
  );

  // Load Active Date Spots from Supabase (deleted_at IS NULL)
  const loadDateSpots = useCallback(async () => {
    setLoadingSpots(true);
    try {
      // Trigger background purge of 3-day old soft-deleted spots
      purgeExpiredDeletedSpots();

      const { data, error } = await supabase
        .from("date_spots")
        .select("*")
        .is("deleted_at", null)
        .order("visited_at", { ascending: false });

      if (error) throw error;
      const loadedSpots: DateSpot[] = data || [];
      setSpots(loadedSpots);
      checkAndScheduleAutoDelete(loadedSpots);
      return loadedSpots;
    } catch (err: unknown) {
      let message = "데이트 기록을 불러오지 못했습니다.";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        message = String((err as { message: unknown }).message);
      }
      console.error("Failed to load date spots:", err);
      showToast(message, "error");
      return [];
    } finally {
      setLoadingSpots(false);
    }
  }, [showToast, checkAndScheduleAutoDelete, purgeExpiredDeletedSpots]);

  // Create a new Date Spot
  const createDateSpot = useCallback(
    async (params: {
      title: string;
      description: string;
      latLng: LatLng;
      imageFile: File | null;
      visitedAt: string;
      address?: string;
    }): Promise<boolean> => {
      const { title, description, latLng, imageFile, visitedAt, address } = params;

      if (!title.trim()) {
        showToast("장소를 입력해 주세요.", "error");
        return false;
      }
      if (!latLng) {
        showToast("위치 정보가 필요합니다.", "error");
        return false;
      }

      setIsUploading(true);
      showToast("데이트 기록을 등록하는 중...", "info");

      try {
        let imageUrl = "";

        if (imageFile) {
          const uploadedUrl = await uploadCompressedPhoto(imageFile);
          if (!uploadedUrl) {
            throw new Error("이미지 업로드에 실패했습니다.");
          }
          imageUrl = uploadedUrl;
        }

        const { data, error } = await supabase
          .from("date_spots")
          .insert({
            title: title.trim(),
            description: description.trim(),
            latitude: latLng.lat,
            longitude: latLng.lng,
            image_url: imageUrl,
            address: address ? address.trim() : "",
            visited_at: new Date(visitedAt).toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        showToast("💖 소중한 추억이 기록되었습니다!", "success");
        const reloadedSpots = await loadDateSpots();
        if (data) {
          checkAndScheduleAutoDelete([data, ...reloadedSpots]);
        }
        return true;
      } catch (err: unknown) {
        let message = "데이트 기록 등록 중 오류가 발생했습니다.";
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "object" && err !== null && "message" in err) {
          message = String((err as { message: unknown }).message);
        }
        console.error("Failed to create date spot:", err);
        showToast(message, "error");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [showToast, loadDateSpots, checkAndScheduleAutoDelete]
  );

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      activeTimersRef.current.clear();
    };
  }, []);

  return {
    spots,
    loadingSpots,
    isUploading,
    loadDateSpots,
    createDateSpot,
    deleteDateSpot,
  };
}
