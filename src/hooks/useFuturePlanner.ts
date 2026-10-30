"use client";

import { useState, useEffect, useCallback } from "react";
import { PlannedSpot, AppMode, DatePlan, RouteSummaryData } from "@/types/planner";
import { SavedSegmentRoute } from "@/types/transit";
import { supabase } from "@/lib/supabase/client";
import { dayEndIndex, listPlanDays, resolveSpotDates } from "@/lib/planDates";

const STORAGE_KEY = "our_date_map_planned_spots";
const STORAGE_ROUTE_KEY = "our_date_map_route_summary";

export function useFuturePlanner(
  showToast: (message: string, type?: "success" | "error" | "info") => void,
  userId?: string | null
) {
  const [appMode, setAppMode] = useState<AppMode>("memory");
  const [plannedSpots, setPlannedSpots] = useState<PlannedSpot[]>([]);
  const [currentRouteSummary, setCurrentRouteSummary] = useState<RouteSummaryData | null>(null);
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
      const savedRoute = localStorage.getItem(STORAGE_ROUTE_KEY);
      if (savedRoute) {
        const parsedRoute = JSON.parse(savedRoute);
        if (parsedRoute && typeof parsedRoute === "object") {
          setCurrentRouteSummary(parsedRoute);
        }
      }
    } catch (e) {
      console.error("Failed to load planned spots or route summary from localStorage:", e);
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

  const updateRouteSummary = useCallback((routeSummary: RouteSummaryData | null) => {
    setCurrentRouteSummary(routeSummary);
    try {
      if (routeSummary) {
        localStorage.setItem(STORAGE_ROUTE_KEY, JSON.stringify(routeSummary));
      } else {
        localStorage.removeItem(STORAGE_ROUTE_KEY);
      }
    } catch (e) {
      console.error("Failed to update route summary in localStorage:", e);
    }
  }, []);

  // 구간 경로 하나를 저장분에 넣는다. 자동으로 채워진 경로와 사용자가 고른 경로 모두 여기로 온다.
  // 같은 틱에 여러 구간이 들어와도 서로 덮어쓰지 않도록 최신 상태 위에 병합한다.
  const patchSegmentRoute = useCallback((pairKey: string, saved: SavedSegmentRoute) => {
    setCurrentRouteSummary((prev) => {
      const next = {
        ...(prev ?? {}),
        transitRoutes: { ...(prev?.transitRoutes ?? {}), [pairKey]: saved },
      };
      try {
        localStorage.setItem(STORAGE_ROUTE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to update route summary in localStorage:", e);
      }
      return next;
    });
  }, []);

  // Save active plan to Supabase DB
  const savePlanToDb = useCallback(
    async (
      customTitle?: string,
      routeSummary?: RouteSummaryData,
      customStartDate?: string,
      customEndDate?: string
    ) => {
      // 생성 시점에 이미 빈 플랜이 DB에 들어가므로, 갱신(activePlanId 존재)일 때는
      // 경유지가 없어도 저장을 허용한다. 신규 저장만 최소 1곳을 요구한다.
      if (!activePlanId && plannedSpots.length === 0) {
        showToast("저장할 장소가 없습니다. 경유지를 추가해 주세요.", "info");
        return;
      }

      setIsSavingDb(true);
      const start = customStartDate || startDate || selectedDate;
      const end = customEndDate || endDate || start;
      const title =
        customTitle?.trim() ||
        currentTitle.trim() ||
        (start === end ? `${start} 데이트 코스` : `${start} ~ ${end} 데이트 코스`);

      const finalRouteSummary = routeSummary || currentRouteSummary;

      try {
        // 작성자(user_id·created_by)는 새로 만들 때만 넣는다. 수정할 때 넣으면 커플 상대가 저장하는 순간
        // 작성자가 그 사람으로 바뀌어 버린다.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          title,
          plan_date: start,
          start_date: start,
          end_date: end,
          spots: plannedSpots,
          route_summary: finalRouteSummary || null,
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
              user_id: userId || null,
              created_by: userId || null,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          resultData = data;
        }

        if (resultData) {
          setActivePlanId(resultData.id);
          if (finalRouteSummary) {
            updateRouteSummary(finalRouteSummary);
          }
          showToast(`📅 '${title}' 플랜이 DB에 성공적으로 저장되었습니다!`, "success");
          fetchAllDatePlans();
          fetchPlansForDate(selectedDate);
        }
      } catch (err: unknown) {
        console.error("[useFuturePlanner] Failed saving plan to DB:", err);
        // 수정 권한이 없으면 RLS가 대상 행을 걸러 `.single()`이 "행 없음"(PGRST116)으로 실패한다
        const code = (err as { code?: string } | null)?.code;
        showToast(
          code === "PGRST116"
            ? "이 코스를 저장할 권한이 없어요. 커플 연결 상태를 확인해 주세요."
            : "DB 저장 실패: 네트워크 상태를 확인해 주세요.",
          "error"
        );
      } finally {
        setIsSavingDb(false);
      }
    },
    [
      plannedSpots,
      currentRouteSummary,
      selectedDate,
      startDate,
      endDate,
      currentTitle,
      activePlanId,
      userId,
      showToast,
      updateRouteSummary,
      fetchAllDatePlans,
      fetchPlansForDate,
    ]
  );

  // Start new plan with Date Range selection.
  // 시나리오상 이 시점에 일정 목록에 나타나야 하므로 빈 플랜을 곧바로 DB에 만든다.
  const startNewDatePlan = useCallback(
    async (start: string, end: string, title?: string) => {
      const finalTitle = title?.trim() || `${start} ~ ${end} 데이트`;

      setStartDate(start);
      setEndDate(end);
      setSelectedDate(start);
      setCurrentTitle(finalTitle);
      saveSpots([]);
      updateRouteSummary(null);
      setActivePlanId(null);
      setAppMode("planning");
      setIsCreateModalOpen(false);
      setIsPlanSheetOpen(true);

      setIsSavingDb(true);
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("date_plans")
          .insert({
            user_id: userId || null,
            created_by: userId || null,
            title: finalTitle,
            plan_date: start,
            start_date: start,
            end_date: end,
            spots: [],
            route_summary: null,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) throw error;

        setActivePlanId(data.id);
        await fetchAllDatePlans();
        showToast(`'${finalTitle}' 일정이 추가되었습니다. 경유지를 추가해 보세요!`, "success");
      } catch (err) {
        console.error("[useFuturePlanner] Failed creating plan:", err);
        showToast("일정 생성에 실패했습니다. 네트워크와 권한을 확인해 주세요.", "error");
      } finally {
        setIsSavingDb(false);
      }
    },
    [saveSpots, updateRouteSummary, showToast, userId, fetchAllDatePlans]
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
      updateRouteSummary(plan.route_summary || null);
      setAppMode("planning");
      setIsScheduleModalOpen(false);
      setIsPlanSheetOpen(true);
      showToast(`'${plan.title}' 플랜을 불러왔습니다!`, "success");
    },
    [saveSpots, updateRouteSummary, showToast]
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
    (
      title: string,
      memo: string | undefined,
      lat: number,
      lng: number,
      address?: string,
      date?: string
    ) => {
      const newSpot: PlannedSpot = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: title.trim() || "미래 데이트 장소",
        memo,
        latitude: lat,
        longitude: lng,
        address,
        order: plannedSpots.length + 1,
        createdAt: new Date().toISOString(),
        date,
      };

      // 날짜를 고르면 그 날의 마지막 경유지 뒤에 넣는다. 맨 끝에 붙이면 2일차 아래에 1일차가 다시 생긴다
      const insertAt = dayEndIndex(plannedSpots, date, listPlanDays(startDate, endDate));
      const updated = [
        ...plannedSpots.slice(0, insertAt),
        newSpot,
        ...plannedSpots.slice(insertAt),
      ].map((s, i) => ({ ...s, order: i + 1 }));
      saveSpots(updated);
      showToast(`'${newSpot.title}'이(가) 플래닝에 추가되었습니다!`, "success");
      setIsAddModalOpen(false);
      setPendingLatLng(null);
    },
    [plannedSpots, saveSpots, showToast, startDate, endDate]
  );

  // Update a spot's title/memo/date (편집 모드에서 경유지 내용 수정)
  const updateSpot = useCallback(
    (id: string, updates: { title: string; memo?: string; date?: string }) => {
      const nextTitle = updates.title.trim();
      const nextMemo = updates.memo?.trim();
      const index = plannedSpots.findIndex((s) => s.id === id);
      if (index < 0) return;

      const current = plannedSpots[index];
      const edited: PlannedSpot = {
        ...current,
        title: nextTitle || current.title,
        memo: nextMemo || undefined,
        date: updates.date ?? current.date,
      };

      const days = listPlanDays(startDate, endDate);
      const resolved = resolveSpotDates(plannedSpots, days);
      const movesDay =
        updates.date !== undefined && days.includes(updates.date) && updates.date !== resolved[index];
      if (!movesDay) {
        saveSpots(plannedSpots.map((s) => (s.id === id ? edited : s)));
        return;
      }

      // 날짜가 바뀌면 그 날의 마지막 경유지 뒤로 옮긴다. 제자리에 두면 2일차 사이에 1일차가 끼어 보인다.
      // 나머지 경유지에는 지금 보이는 날짜를 적어 둔다. 날짜 없이 이 경유지의 날짜를 따르던 뒤 경유지가 함께 옮겨 가지 않게 하기 위함이다
      const others = plannedSpots
        .map((s, i) => ({ ...s, date: resolved[i] }))
        .filter((s) => s.id !== id);
      const insertAt = dayEndIndex(others, edited.date, days);
      const updated = [...others.slice(0, insertAt), edited, ...others.slice(insertAt)].map(
        (s, i) => ({ ...s, order: i + 1 })
      );
      saveSpots(updated);
    },
    [plannedSpots, saveSpots, startDate, endDate]
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

  /**
   * 경유지를 한 칸 옮긴다. 여러 날짜 플랜에서 날짜 경계를 넘을 때는 자리를 바꾸지 않고 옆 경유지의 날짜를 따른다.
   * 예: 2일차 첫 경유지를 올리면 1일차 마지막이 되고, 한 번 더 올려야 1일차 안에서 자리를 바꾼다.
   */
  const moveSpot = useCallback(
    (index: number, step: -1 | 1) => {
      const target = index + step;
      if (index < 0 || index >= plannedSpots.length || target < 0 || target >= plannedSpots.length) {
        return;
      }

      const days = listPlanDays(startDate, endDate);
      const multiDay = days.length > 1;
      const resolved = resolveSpotDates(plannedSpots, days);
      // 날짜를 넣지 않은 경유지는 앞 경유지의 날짜를 따르므로, 순서가 바뀌어도 보이던 날짜가 남도록 적어 둔다
      const updated = multiDay
        ? plannedSpots.map((s, i) => ({ ...s, date: resolved[i] }))
        : [...plannedSpots];

      if (multiDay && resolved[index] !== resolved[target]) {
        updated[index] = { ...updated[index], date: resolved[target] };
      } else {
        [updated[index], updated[target]] = [updated[target], updated[index]];
      }

      saveSpots(updated.map((s, i) => ({ ...s, order: i + 1 })));
    },
    [plannedSpots, saveSpots, startDate, endDate]
  );

  // Move spot up
  const moveSpotUp = useCallback((index: number) => moveSpot(index, -1), [moveSpot]);

  // Move spot down
  const moveSpotDown = useCallback((index: number) => moveSpot(index, 1), [moveSpot]);

  // Clear all planned spots
  const clearAllPlans = useCallback(() => {
    saveSpots([]);
    updateRouteSummary(null);
    setActivePlanId(null);
    showToast("미래 데이트 플랜이 모두 초기화되었습니다.", "info");
  }, [saveSpots, updateRouteSummary, showToast]);

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
    currentRouteSummary,
    updateRouteSummary,
    patchSegmentRoute,
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
    updateSpot,
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
