"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uploadCompressedPhotos } from "@/lib/upload";
import { DateSpot, LatLng, DeletedDateSpot } from "@/types/spot";
import { Json } from "@/types/supabase";

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

// Helper to extract all storage file paths from a spot (checking both image_urls array & image_url string)
function extractAllStoragePaths(spot: DateSpot): string[] {
  const pathsSet = new Set<string>();

  if (spot.image_urls && Array.isArray(spot.image_urls)) {
    spot.image_urls.forEach((url) => {
      const path = extractStoragePath(url);
      if (path) pathsSet.add(path);
    });
  }

  if (spot.image_url) {
    const path = extractStoragePath(spot.image_url);
    if (path) pathsSet.add(path);
  }

  return Array.from(pathsSet);
}

export function useDateSpots(showToast: (message: string, type?: "success" | "error" | "info") => void) {
  const [spots, setSpots] = useState<DateSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Permanent Hard Delete Helper (removes DB row & Storage photos completely)
  const hardDeleteSpotInternal = useCallback(
    async (spot: DateSpot, toastMsg?: string) => {
      try {
        if (activeTimersRef.current.has(spot.id)) {
          clearTimeout(activeTimersRef.current.get(spot.id));
          activeTimersRef.current.delete(spot.id);
        }

        // 1. Delete all photo files from Supabase Storage date-photos bucket
        const filePaths = extractAllStoragePaths(spot);
        if (filePaths.length > 0) {
          try {
            await supabase.storage.from("date-photos").remove(filePaths);
          } catch (storageErr) {
            console.error("Failed to delete photos from Supabase Storage:", storageErr);
          }
        }

        // 2. Remove from deleted_date_spots trash table
        await supabase.from("deleted_date_spots").delete().eq("original_spot_id", spot.id);

        // 3. Hard delete row from Database
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
        .select("*, profiles(id, nickname, profile_image_url)")
        .not("deleted_at", "is", null);

      if (error || !data || data.length === 0) return;

      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      for (const spot of data) {
        if (spot.deleted_at) {
          const deletedTime = new Date(spot.deleted_at).getTime();
          if (now - deletedTime >= threeDaysMs) {
            await hardDeleteSpotInternal(spot as DateSpot);
          }
        }
      }
    } catch (err) {
      console.error("Failed during purge of expired deleted spots:", err);
    }
  }, [hardDeleteSpotInternal]);

  // Soft Delete Function (moves record to deleted_date_spots & sets deleted_at = NOW())
  const deleteDateSpot = useCallback(
    async (spot: DateSpot, reason?: string): Promise<boolean> => {
      try {
        if (activeTimersRef.current.has(spot.id)) {
          clearTimeout(activeTimersRef.current.get(spot.id));
          activeTimersRef.current.delete(spot.id);
        }

        let activeUserId: string | null = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) activeUserId = user.id;
        } catch (e) {
          console.warn("Could not retrieve active session user for deletion:", e);
        }

        const nowIso = new Date().toISOString();

        // 1. Insert into deleted_date_spots trash table
        const { error: trashError } = await supabase.from("deleted_date_spots").insert({
          original_spot_id: spot.id,
          spot_data: spot as unknown as Json,
          deleted_by: activeUserId || spot.created_by || spot.user_id || null,
          deleted_at: nowIso,
          reason: reason || "사용자 핀 삭제 요청",
        });

        if (trashError) {
          console.error("Failed to archive spot into deleted_date_spots:", trashError);
        }

        // 2. Mark spot as soft-deleted in date_spots
        const { error } = await supabase
          .from("date_spots")
          .update({ deleted_at: nowIso })
          .eq("id", spot.id);

        if (error) throw error;

        showToast("핀이 휴지통으로 이동되었습니다 (3일 후 영구 삭제).", "success");
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

  // Restore a soft-deleted spot back to active date_spots
  const restoreDateSpot = useCallback(
    async (originalSpotId: string): Promise<boolean> => {
      try {
        // 1. Reset deleted_at in date_spots
        const { error: updateError } = await supabase
          .from("date_spots")
          .update({ deleted_at: null })
          .eq("id", originalSpotId);

        if (updateError) throw updateError;

        // 2. Remove record from deleted_date_spots
        await supabase
          .from("deleted_date_spots")
          .delete()
          .eq("original_spot_id", originalSpotId);

        showToast("💖 핀이 성공적으로 복원되었습니다!", "success");
        return true;
      } catch (err: unknown) {
        let message = "핀 복원 중 오류가 발생했습니다.";
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "object" && err !== null && "message" in err) {
          message = String((err as { message: unknown }).message);
        }
        console.error("Failed to restore date spot:", err);
        showToast(message, "error");
        return false;
      }
    },
    [showToast]
  );

  // Fetch list of deleted spots from deleted_date_spots trash table
  const fetchDeletedSpots = useCallback(async (): Promise<DeletedDateSpot[]> => {
    try {
      const { data, error } = await supabase
        .from("deleted_date_spots")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as DeletedDateSpot[]) || [];
    } catch (err) {
      console.error("Failed to fetch deleted spots:", err);
      return [];
    }
  }, []);

  // Schedule auto-deletion for "Test" spots after 3 minutes (180,000 ms)
  const checkAndScheduleAutoDelete = useCallback(
    (spotList: DateSpot[]) => {
      spotList.forEach((spot) => {
        if (spot.title.trim().toLowerCase() === "test") {
          const createdAtTime = new Date(spot.created_at).getTime();
          const elapsed = Date.now() - createdAtTime;
          const threeMinutesMs = 3 * 60 * 1000;

          if (elapsed >= threeMinutesMs) {
            hardDeleteSpotInternal(spot, "⏱️ 'Test' 기록이 3분 경과하여 영구 삭제되었습니다.");
          } else if (!activeTimersRef.current.has(spot.id)) {
            const remainingMs = threeMinutesMs - elapsed;
            const timerId = setTimeout(() => {
              hardDeleteSpotInternal(spot, "⏱️ 'Test' 기록이 3분 경과하여 영구 삭제되었습니다.");
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
      purgeExpiredDeletedSpots();

      const { data, error } = await supabase
        .from("date_spots")
        .select("*, profiles(id, nickname, profile_image_url)")
        .is("deleted_at", null)
        .order("visited_at", { ascending: false });

      if (error) throw error;
      const loadedSpots: DateSpot[] = (data as unknown as DateSpot[]) || [];
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

  // Create a new Date Spot (with support for multiple image files up to 10 & relational created_by FK)
  const createDateSpot = useCallback(
    async (params: {
      title: string;
      description: string;
      latLng: LatLng;
      imageFiles?: File[];
      imageFile?: File | null;
      visitedAt: string;
      address?: string;
      userId?: string | null;
      createdBy?: string | null;
    }): Promise<boolean> => {
      const {
        title,
        description,
        latLng,
        imageFiles,
        imageFile,
        visitedAt,
        address,
        userId,
        createdBy,
      } = params;

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
        let uploadedUrls: string[] = [];

        let filesToUpload: File[] = [];
        if (imageFiles && imageFiles.length > 0) {
          filesToUpload = imageFiles.slice(0, 10);
        } else if (imageFile) {
          filesToUpload = [imageFile];
        }

        if (filesToUpload.length > 0) {
          uploadedUrls = await uploadCompressedPhotos(filesToUpload);
        }

        const primaryUrl = uploadedUrls.length > 0 ? uploadedUrls[0] : "";

        // Determine authenticated user_id from parameters or active Supabase session
        let activeUserId = userId || createdBy || null;
        if (!activeUserId) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) activeUserId = user.id;
          } catch (e) {
            console.warn("Could not retrieve active session user:", e);
          }
        }

        const { data, error } = await supabase
          .from("date_spots")
          .insert({
            title: title.trim(),
            description: description.trim(),
            latitude: latLng.lat,
            longitude: latLng.lng,
            image_url: primaryUrl,
            image_urls: uploadedUrls,
            address: address ? address.trim() : "",
            visited_at: new Date(visitedAt).toISOString(),
            user_id: activeUserId,
            created_by: activeUserId,
          })
          .select("*, profiles(id, nickname, profile_image_url)")
          .single();

        if (error) throw error;

        showToast("💖 소중한 추억이 기록되었습니다!", "success");
        const reloadedSpots = await loadDateSpots();
        if (data) {
          checkAndScheduleAutoDelete([data as unknown as DateSpot, ...reloadedSpots]);
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
    restoreDateSpot,
    fetchDeletedSpots,
  };
}
