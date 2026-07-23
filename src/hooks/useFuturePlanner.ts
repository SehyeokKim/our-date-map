"use client";

import { useState, useEffect, useCallback } from "react";
import { PlannedSpot, AppMode } from "@/types/planner";

const STORAGE_KEY = "our_date_map_planned_spots";

export function useFuturePlanner(showToast: (message: string, type?: "success" | "error" | "info") => void) {
  const [appMode, setAppMode] = useState<AppMode>("memory");
  const [plannedSpots, setPlannedSpots] = useState<PlannedSpot[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string>("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPlannedSpots(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load planned spots from localStorage:", e);
    }
  }, []);

  // Save to localStorage when plannedSpots changes
  const saveSpots = useCallback((spots: PlannedSpot[]) => {
    setPlannedSpots(spots);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      console.error("Failed to save planned spots to localStorage:", e);
    }
  }, []);

  // Add spot
  const addSpot = useCallback(
    (title: string, memo: string | undefined, lat: number, lng: number, address?: string) => {
      const newSpot: PlannedSpot = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: title.trim() || "미래 데이트 장소",
        memo,
        latitude: lat,
        longitude: lng,
        address,
        order: plannedSpots.length + 1,
        createdAt: new Date().toISOString(),
      };

      const updated = [...plannedSpots, newSpot];
      saveSpots(updated);
      showToast(`'${newSpot.title}'이(가) 플래닝에 추가되었습니다!`, "success");
      setIsAddModalOpen(false);
      setPendingLatLng(null);
    },
    [plannedSpots, saveSpots, showToast]
  );

  // Remove spot
  const removeSpot = useCallback(
    (id: string) => {
      const filtered = plannedSpots.filter((s) => s.id !== id);
      const reordered = filtered.map((s, index) => ({
        ...s,
        order: index + 1,
      }));
      saveSpots(reordered);
      showToast("플랜 장소가 삭제되었습니다.", "info");
    },
    [plannedSpots, saveSpots, showToast]
  );

  // Move spot up
  const moveSpotUp = useCallback(
    (index: number) => {
      if (index <= 0 || index >= plannedSpots.length) return;
      const updated = [...plannedSpots];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;

      const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
      saveSpots(reordered);
    },
    [plannedSpots, saveSpots]
  );

  // Move spot down
  const moveSpotDown = useCallback(
    (index: number) => {
      if (index < 0 || index >= plannedSpots.length - 1) return;
      const updated = [...plannedSpots];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;

      const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
      saveSpots(reordered);
    },
    [plannedSpots, saveSpots]
  );

  // Clear all planned spots
  const clearAllPlans = useCallback(() => {
    saveSpots([]);
    showToast("미래 데이트 플랜이 모두 초기화되었습니다.", "info");
  }, [saveSpots, showToast]);

  // Handle map click in planning mode
  const handleMapClickForPlanning = useCallback((lat: number, lng: number, address: string) => {
    setPendingLatLng({ lat, lng });
    setPendingAddress(address);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setPendingLatLng(null);
  }, []);

  return {
    appMode,
    setAppMode,
    plannedSpots,
    addSpot,
    removeSpot,
    moveSpotUp,
    moveSpotDown,
    clearAllPlans,
    isAddModalOpen,
    pendingLatLng,
    pendingAddress,
    handleMapClickForPlanning,
    closeAddModal,
  };
}
