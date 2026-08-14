"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
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

  // Purge soft-deleted spots older than 30 days
  const purgeExpiredDeletedSpots = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("date_spots")
        .select("*, profiles(id, nickname, profile_image_url)")
        .not("deleted_at", "is", null);

      if (error || !data || data.length === 0) return;

      const retentionMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      for (const spot of data) {
        if (spot.deleted_at) {
          const deletedTime = new Date(spot.deleted_at).getTime();
          if (now - deletedTime >= retentionMs) {
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

        showToast("핀이 휴지통으로 이동되었습니다 (30일 후 영구 삭제).", "success");
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
        // 1. Try resetting deleted_at on the original row (select confirms a row was actually restored)
        const { data: restoredRows, error: updateError } = await supabase
          .from("date_spots")
          .update({ deleted_at: null })
          .eq("id", originalSpotId)
          .select("id");

        if (updateError) throw updateError;

        // 2. Original row already purged — recreate it from the trash backup (spot_data JSONB).
        //    Without this, deleting the trash entry below would silently destroy the only backup.
        if (!restoredRows || restoredRows.length === 0) {
          const { data: trashEntry, error: trashError } = await supabase
            .from("deleted_date_spots")
            .select("spot_data")
            .eq("original_spot_id", originalSpotId)
            .single();

          if (trashError || !trashEntry?.spot_data) {
            throw new Error("복원할 백업 데이터를 찾을 수 없습니다.");
          }

          const backup = trashEntry.spot_data as unknown as DateSpot;
          const { error: insertError } = await supabase.from("date_spots").insert({
            id: backup.id,
            title: backup.title,
            description: backup.description ?? "",
            latitude: backup.latitude,
            longitude: backup.longitude,
            image_url: backup.image_url ?? "",
            image_urls: backup.image_urls ?? [],
            address: backup.address ?? "",
            visited_at: backup.visited_at,
            created_at: backup.created_at,
            user_id: backup.user_id ?? null,
            created_by: backup.created_by ?? null,
            deleted_at: null,
          });
          if (insertError) throw insertError;
        }

        // 3. Remove record from deleted_date_spots (only after the restore is confirmed)
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

  // Update an existing spot's record — title, date, story, and photos (user-triggered from detail sheet)
  const updateDateSpot = useCallback(
    async (
      spot: DateSpot,
      updates: {
        title: string;
        description: string;
        visitedAt: string;
        keptImageUrls: string[];
        newImageFiles: File[];
      }
    ): Promise<DateSpot | null> => {
      if (!updates.title.trim()) {
        showToast("장소 제목을 입력해 주세요.", "error");
        return null;
      }
      if (!updates.visitedAt) {
        showToast("데이트 날짜를 선택해 주세요.", "error");
        return null;
      }

      setIsUploading(true);
      try {
        let newUrls: string[] = [];
        if (updates.newImageFiles.length > 0) {
          const remaining = Math.max(0, 10 - updates.keptImageUrls.length);
          if (remaining > 0) {
            showToast("사진을 업로드하는 중...", "info");
            newUrls = await uploadCompressedPhotos(updates.newImageFiles.slice(0, remaining));
          }
        }
        const finalUrls = [...updates.keptImageUrls, ...newUrls].slice(0, 10);

        const { data, error } = await supabase
          .from("date_spots")
          .update({
            title: updates.title.trim(),
            description: updates.description.trim(),
            visited_at: new Date(updates.visitedAt).toISOString(),
            image_url: finalUrls[0] || "",
            image_urls: finalUrls,
          })
          .eq("id", spot.id)
          .select("*, profiles(id, nickname, profile_image_url)")
          .single();

        if (error) throw error;
        const updated = data as DateSpot;

        // Best-effort cleanup: remove storage files for photos the user detached
        const previousUrls =
          spot.image_urls && spot.image_urls.length > 0
            ? spot.image_urls
            : spot.image_url
            ? [spot.image_url]
            : [];
        const removedPaths = previousUrls
          .filter((url) => !finalUrls.includes(url))
          .map((url) => extractStoragePath(url))
          .filter((path): path is string => Boolean(path));
        if (removedPaths.length > 0) {
          supabase.storage
            .from("date-photos")
            .remove(removedPaths)
            .then(({ error: removeError }) => {
              if (removeError) console.warn("Failed to remove detached photos:", removeError);
            });
        }

        setSpots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast("데이트 기록을 수정했습니다 💕", "success");
        return updated;
      } catch (err) {
        console.error("Failed to update date spot:", err);
        showToast("기록 수정에 실패했습니다", "error");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [showToast]
  );

  return {
    spots,
    loadingSpots,
    isUploading,
    loadDateSpots,
    createDateSpot,
    deleteDateSpot,
    updateDateSpot,
    restoreDateSpot,
    fetchDeletedSpots,
  };
}
