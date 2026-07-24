"use client";

import { useState, useEffect, useCallback } from "react";
import { PlannedSpot, AppMode, DatePlan } from "@/types/planner";
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "our_date_map_planned_spots";

export function useFuturePlanner(
  showToast: (message: string, type?: "success" | "error" | "info") => void,
  userId?: string | null
) {
  const [appMode, setAppMode] = useState<AppMode>("memory");
  const [plannedSpots, setPlannedSpots] = useState<PlannedSpot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentTitle, setCurrentTitle] = useState<string>("");

  const [allDatePlans, setAllDatePlans] = useState<DatePlan[]>([]);
  const [savedPlans, setSavedPlans] = useState<DatePlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPlanSheetOpen, setIsPlanSheetOpen] = useState<boolean>(false);

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

  // Fetch ALL DB date plans
  const fetchAllDatePlans = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from("date_plans")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) {
        console.warn("[useFuturePlanner] Failed fetching all plans:", error.message);
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed: DatePlan[] = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          created_by: item.created_by,
          title: item.title || `${item.plan_date} 데이트 플랜`,
          plan_date: item.plan_date || item.start_date || new Date().toISOString().split("T")[0],
          start_date: item.start_date || item.plan_date,
          end_date: item.end_date || item.start_date || item.plan_date,
          spots: Array.isArray(item.spots) ? item.spots : [],
          route_summary: item.route_summary,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
        setAllDatePlans(parsed);
      }
    } catch (err) {
      console.error("[useFuturePlanner] Exception fetching all plans:", err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  // Fetch DB plans for selectedDate
  const fetchPlansForDate = useCallback(
    async (dateStr: string) => {
      setIsLoadingDb(true);
      try {
        const { data, error } = await supabase
          .from("date_plans")
          .select("*")
          .or(`plan_date.eq.${dateStr},start_date.lte.${dateStr}`)
          .order("updated_at", { ascending: false });

        if (error) {
          console.warn("[useFuturePlanner] Failed fetching plans from DB:", error.message);
        } else if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsedPlans: DatePlan[] = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            created_by: item.created_by,
            title: item.title || `${dateStr} 데이트 플랜`,
            plan_date: item.plan_date,
            start_date: item.start_date || item.plan_date,
            end_date: item.end_date || item.start_date || item.plan_date,
            spots: Array.isArray(item.spots) ? item.spots : [],
            route_summary: item.route_summary,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));
          setSavedPlans(parsedPlans);
        }
      } catch (err) {
        console.error("[useFuturePlanner] Exception fetching plans:", err);
      } finally {
        setIsLoadingDb(false);
      }
    },
    []
  );

  // Auto fetch DB plans on mount and date change
  useEffect(() => {
    fetchAllDatePlans();
    fetchPlansForDate(selectedDate);
  }, [selectedDate, fetchAllDatePlans, fetchPlansForDate]);

  // Save to localStorage when plannedSpots changes
  const saveSpots = useCallback((spots: PlannedSpot[]) => {
    setPlannedSpots(spots);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      console.error("Failed to save planned spots to localStorage:", e);
    }
  }, []);

  // Save active plan to Supabase DB
  const savePlanToDb = useCallback(
    async (
      customTitle?: string,
      routeSummary?: { distance?: number; duration?: number },
      customStartDate?: string,
      customEndDate?: string
    ) => {
      if (plannedSpots.length === 0) {
        showToast("저장할 장소가 없습니다. 지도에서 핀을 추가해 주세요.", "info");
        return;
      }

      setIsSavingDb(true);
      const start = customStartDate || startDate || selectedDate;
      const end = customEndDate || endDate || start;
      const title =
        customTitle?.trim() ||
        currentTitle.trim() ||
        (start === end ? `${start} 데이트 코스` : `${start} ~ ${end} 데이트 코스`);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          user_id: userId || null,
          created_by: userId || null,
          title,
          plan_date: start,
          start_date: start,
          end_date: end,
          spots: plannedSpots,
          route_summary: routeSummary || null,
          updated_at: new Date().toISOString(),
        };

        let resultData = null;

        if (activePlanId) {
          const { data, error } = await supabase
            .from("date_plans")
            .update(payload)
            .eq("id", activePlanId)
            .select()
            .single();

          if (error) throw error;
          resultData = data;
        } else {
          const { data, error } = await supabase
            .from("date_plans")
            .insert({
              ...payload,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          resultData = data;
        }

        if (resultData) {
          setActivePlanId(resultData.id);
          showToast(`📅 '${title}' 플랜이 DB에 성공적으로 저장되었습니다!`, "success");
          fetchAllDatePlans();
          fetchPlansForDate(selectedDate);
        }
      } catch (err: any) {
        console.error("[useFuturePlanner] Failed saving plan to DB:", err);
        showToast("DB 저장 실패: 네트워크 및 권한을 확인해 주세요.", "error");
      } finally {
        setIsSavingDb(false);
      }
    },
    [
      plannedSpots,
      selectedDate,
      startDate,
      endDate,
      currentTitle,
      activePlanId,
      userId,
      showToast,
      fetchAllDatePlans,
      fetchPlansForDate,
    ]
  );

  // Start new plan with Date Range selection
  const startNewDatePlan = useCallback(
    (start: string, end: string, title?: string) => {
      setStartDate(start);
      setEndDate(end);
      setSelectedDate(start);
      setCurrentTitle(title || `${start} ~ ${end} 데이트`);
      saveSpots([]);
      setActivePlanId(null);
      setAppMode("planning");
      setIsCreateModalOpen(false);
      setIsPlanSheetOpen(true);
      showToast(`'${title || start + " 데이트"}' 플래닝이 시작되었습니다. 지도를 터치해 장소를 추가하세요!`, "success");
    },
    [saveSpots, showToast]
  );

  // Load a saved plan from DB into current active canvas
  const loadPlanFromDb = useCallback(
    (plan: DatePlan) => {
      setActivePlanId(plan.id);
      const start = plan.start_date || plan.plan_date;
      const end = plan.end_date || start;
      setStartDate(start);
      setEndDate(end);
      setSelectedDate(start);
      setCurrentTitle(plan.title);
      saveSpots(plan.spots || []);
      setAppMode("planning");
      setIsScheduleModalOpen(false);
      setIsPlanSheetOpen(true);
      showToast(`'${plan.title}' 플랜을 불러왔습니다!`, "success");
    },
    [saveSpots, showToast]
  );

  // Delete plan from DB
  const deletePlanFromDb = useCallback(
    async (planId: string) => {
      try {
        const { error } = await supabase.from("date_plans").delete().eq("id", planId);
        if (error) throw error;

        showToast("플랜이 DB에서 삭제되었습니다.", "info");
        if (activePlanId === planId) {
          setActivePlanId(null);
        }
        fetchAllDatePlans();
        fetchPlansForDate(selectedDate);
      } catch (err) {
        console.error("[useFuturePlanner] Delete plan error:", err);
        showToast("플랜 삭제에 실패했습니다.", "error");
      }
    },
    [activePlanId, selectedDate, showToast, fetchAllDatePlans, fetchPlansForDate]
  );

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
    setActivePlanId(null);
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
    selectedDate,
    setSelectedDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    currentTitle,
    setCurrentTitle,
    allDatePlans,
    savedPlans,
    activePlanId,
    isSavingDb,
    isLoadingDb,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isPlanSheetOpen,
    setIsPlanSheetOpen,
    startNewDatePlan,
    savePlanToDb,
    loadPlanFromDb,
    deletePlanFromDb,
    fetchAllDatePlans,
    fetchPlansForDate,
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
