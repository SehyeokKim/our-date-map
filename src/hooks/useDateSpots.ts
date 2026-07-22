"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uploadCompressedPhoto } from "@/lib/upload";
import { DateSpot, LatLng } from "@/types/spot";

export function useDateSpots(showToast: (message: string, type?: "success" | "error" | "info") => void) {
  const [spots, setSpots] = useState<DateSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Delete a date spot from DB and Storage
  const deleteDateSpot = useCallback(
    async (spot: DateSpot, silent: boolean = false): Promise<boolean> => {
      try {
        // Clear any active timer for this spot
        if (activeTimersRef.current.has(spot.id)) {
          clearTimeout(activeTimersRef.current.get(spot.id));
          activeTimersRef.current.delete(spot.id);
        }

        // 1. Delete image from Storage if exists
        if (spot.image_url) {
          try {
            const urlParts = spot.image_url.split("/date-photos/");
            const fileName = urlParts.length > 1 ? urlParts[1].split("?")[0] : spot.image_url.split("/").pop()?.split("?")[0];
            if (fileName) {
              await supabase.storage.from("date-photos").remove([fileName]);
            }
          } catch (storageErr) {
            console.error("Failed to delete photo from storage:", storageErr);
          }
        }

        // 2. Delete row from Database
        const { error } = await supabase.from("date_spots").delete().eq("id", spot.id);
        if (error) throw error;

        if (!silent) {
          showToast("데이트 기록이 삭제되었습니다.", "success");
        } else {
          showToast("⏱️ 'Test' 기록이 3분 경과로 자동 삭제되었습니다.", "info");
        }

        // 3. Update local spots state
        setSpots((prev) => prev.filter((s) => s.id !== spot.id));
        return true;
      } catch (err: unknown) {
        let message = "데이트 기록 삭제 중 오류가 발생했습니다.";
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "object" && err !== null && "message" in err) {
          message = String((err as { message: unknown }).message);
        }
        console.error("Failed to delete date spot:", err);
        if (!silent) showToast(message, "error");
        return false;
      }
    },
    [showToast]
  );

  // Schedule auto-deletion for "Test" spots after 3 minutes (180,000 ms)
  const checkAndScheduleAutoDelete = useCallback(
    (spotList: DateSpot[]) => {
      spotList.forEach((spot) => {
        if (spot.title.trim().toLowerCase() === "test") {
          const createdAtTime = new Date(spot.created_at).getTime();
          const elapsed = Date.now() - createdAtTime;
          const threeMinutesMs = 3 * 60 * 1000;

          if (elapsed >= threeMinutesMs) {
            // Already past 3 minutes -> delete immediately
            deleteDateSpot(spot, true);
          } else if (!activeTimersRef.current.has(spot.id)) {
            // Remaining time to 3 minutes
            const remainingMs = threeMinutesMs - elapsed;
            const timerId = setTimeout(() => {
              deleteDateSpot(spot, true);
            }, remainingMs);
            activeTimersRef.current.set(spot.id, timerId);
          }
        }
      });
    },
    [deleteDateSpot]
  );

  // Load Date Spots from Supabase
  const loadDateSpots = useCallback(async () => {
    setLoadingSpots(true);
    try {
      const { data, error } = await supabase
        .from("date_spots")
        .select("*")
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
  }, [showToast, checkAndScheduleAutoDelete]);

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
