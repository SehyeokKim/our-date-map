"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { uploadCompressedPhoto } from "@/lib/upload";
import { DateSpot, LatLng } from "@/types/spot";

export function useDateSpots(showToast: (message: string, type?: "success" | "error" | "info") => void) {
  const [spots, setSpots] = useState<DateSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
      return loadedSpots;
    } catch (err: unknown) {
      console.error("Failed to load date spots:", err);
      showToast("데이트 기록을 불러오지 못했습니다.", "error");
      return [];
    } finally {
      setLoadingSpots(false);
    }
  }, [showToast]);

  // Create a new Date Spot
  const createDateSpot = useCallback(async (params: {
    title: string;
    description: string;
    latLng: LatLng;
    imageFile: File | null;
    visitedAt: string;
  }): Promise<boolean> => {
    const { title, description, latLng, imageFile, visitedAt } = params;

    if (!title.trim()) {
      showToast("제목을 입력해 주세요.", "error");
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

      const { error } = await supabase.from("date_spots").insert({
        title: title.trim(),
        description: description.trim(),
        latitude: latLng.lat,
        longitude: latLng.lng,
        image_url: imageUrl,
        visited_at: new Date(visitedAt).toISOString(),
      });

      if (error) throw error;

      showToast("💖 소중한 추억이 기록되었습니다!", "success");
      await loadDateSpots();
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
  }, [showToast, loadDateSpots]);

  return {
    spots,
    loadingSpots,
    isUploading,
    loadDateSpots,
    createDateSpot,
  };
}
