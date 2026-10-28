"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Script from "next/script";
import { ToastState, DeletedDateSpot } from "@/types/spot";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { useDateSpots } from "@/hooks/useDateSpots";
import { useFuturePlanner } from "@/hooks/useFuturePlanner";
import { useSegmentRoutes } from "@/hooks/useSegmentRoutes";
import { useAuth } from "@/hooks/useAuth";
import { useWebPush } from "@/hooks/useWebPush";
import { Header } from "@/components/common/Header";
import { Toast } from "@/components/common/Toast";
import { LoginPrompt } from "@/components/common/LoginPrompt";
import { CoupleConnectPrompt } from "@/components/common/CoupleConnectPrompt";
import { usePartnerLink } from "@/hooks/usePartnerLink";
import { MapContainer } from "@/components/map/MapContainer";
import { AddSpotModal } from "@/components/modal/AddSpotModal";
import { SpotSummarySheet } from "@/components/modal/SpotSummarySheet";
import { SpotDetailSheet } from "@/components/modal/SpotDetailSheet";
import { SpotListModal } from "@/components/modal/SpotListModal";
import { TrashModal } from "@/components/modal/TrashModal";
import { AddressSearchModal } from "@/components/modal/AddressSearchModal";
import { FuturePlanSheet } from "@/components/modal/FuturePlanSheet";
import { AddPlannedSpotModal } from "@/components/modal/AddPlannedSpotModal";
import { RouteOptionsSheet } from "@/components/modal/RouteOptionsSheet";
import { ProfileEditModal } from "@/components/modal/ProfileEditModal";
import { SettingsModal } from "@/components/modal/SettingsModal";
import { CustomPushMessageModal } from "@/components/modal/CustomPushMessageModal";
import { DateItineraryModal } from "@/components/modal/DateItineraryModal";
import { CreateDatePlanModal } from "@/components/modal/CreateDatePlanModal";
import { AppMode, DatePlan, PlannedSpot } from "@/types/planner";
import { buildRouteLines, getRoutePathKey } from "@/lib/route";
import { readSavedRoute, segmentPairKey } from "@/lib/transit";

export default function Home() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSpotListOpen, setIsSpotListOpen] = useState<boolean>(false);
  const [isTrashOpen, setIsTrashOpen] = useState<boolean>(false);
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState<boolean>(false);
  // 주소 검색을 어디서 열었는지 — "memory"는 추억 핀 등록, "planning"은 코스 경유지 추가
  const [addressSearchTarget, setAddressSearchTarget] = useState<AppMode>("memory");
  const [deletedSpots, setDeletedSpots] = useState<DeletedDateSpot[]>([]);
  const [loadingTrash, setLoadingTrash] = useState<boolean>(false);
  const [isCustomPushModalOpen, setIsCustomPushModalOpen] = useState<boolean>(false);
  const [customPushMessage, setCustomPushMessage] = useState<{ title: string; body: string }>({
    title: "DateMap😘",
    body: "뽁!",
  });

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2000);
  }, []);

  // Supabase Auth (Kakao OAuth & Profile Management)
  const {
    user,
    loading: authLoading,
    profile,
    partner,
    isCoupled,
    profileLoading,
    nickname,
    avatarUrl,
    loginWithKakao,
    logout,
    updateProfile,
    refetchProfile,
  } = useAuth();

  // 태그 기반 커플 연결 (요청 → 수락). 연결이 맺어지거나 끊기면 프로필을 다시 불러온다
  const {
    receivedRequests,
    sentRequests,
    busy: partnerLinkBusy,
    sendRequest,
    respondRequest,
    cancelRequest,
    disconnect,
  } = usePartnerLink(user?.id, isCoupled, refetchProfile);

  // Load custom push message from localStorage on mount
  useEffect(() => {
    const savedMsg = localStorage.getItem("our_date_map_custom_push_message");
    if (savedMsg) {
      try {
        const parsed = JSON.parse(savedMsg);
        if (parsed && (parsed.title || parsed.body)) {
          setCustomPushMessage(parsed);
        }
      } catch (e) {
        console.warn("Failed parsing saved push message", e);
      }
    }
  }, []);

  const handleSaveCustomPushMessage = (title: string, body: string) => {
    const newMsg = { title, body };
    setCustomPushMessage(newMsg);
    localStorage.setItem("our_date_map_custom_push_message", JSON.stringify(newMsg));
    showToast("💌 푸시 알림 문구가 저장되었습니다!", "success");
  };

  // Web Push Notifications
  const {
    pushEnabled,
    loading: pushLoading,
    togglePushNotification,
    sendInstantPushNotification,
  } = useWebPush(showToast, user?.id);

  // Supabase Memory Date Spots
  const {
    spots,
    isUploading,
    loadDateSpots,
    createDateSpot,
    deleteDateSpot,
    updateDateSpot,
    restoreDateSpot,
    fetchDeletedSpots,
  } = useDateSpots(showToast);

  // Future Date Spot Planner
  const {
    appMode,
    setAppMode,
    plannedSpots,
    currentRouteSummary,
    patchSegmentRoute,
    currentTitle,
    setCurrentTitle,
    allDatePlans,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isPlanSheetOpen,
    startNewDatePlan,
    loadPlanFromDb,
    deletePlanFromDb,
    fetchAllDatePlans,
    savePlanToDb,
    isSavingDb,
    addSpot,
    updateSpot,
    removeSpot,
    moveSpotUp,
    moveSpotDown,
  } = useFuturePlanner(showToast, user?.id);

  // 코스 편집 상태 — 새 플랜을 만들면 곧바로 편집에 들어가야 해서 시트 밖에서 관리한다
  const [isEditingPlan, setIsEditingPlan] = useState<boolean>(false);
  // "핀으로 추가" — 이 동안에만 플래너 모드에서 지도 클릭으로 핀을 찍을 수 있다
  const [isPickingOnMap, setIsPickingOnMap] = useState<boolean>(false);

  // 구간별 경로 (카카오 대중교통·도보, Kakao Mobility 자동차)
  // 경유지를 등록·수정하는 동안에만 조회하고, 그냥 볼 때는 저장된 결과를 쓴다 (일일 쿼터 보호)
  const { segmentRoutes, loadingRoutes, searchRoutes } = useSegmentRoutes(
    plannedSpots,
    currentRouteSummary?.transitRoutes,
    isEditingPlan,
    patchSegmentRoute
  );
  // 경로 목록을 연 구간
  const [routePicker, setRoutePicker] = useState<{ from: PlannedSpot; to: PlannedSpot } | null>(
    null
  );

  // Kakao Maps Instance & Markers
  const {
    mapContainerRef,
    map,
    loadingMap,
    mapError,
    setMapError,
    setLoadingMap,
    initKakaoMap,
    locateUser,
    fitBounds,
    panToSpot,
    renderSpotMarkers,
    clearMemorySpotMarkers,
    renderPlannedSpotMarkers,
    clearPlannedSpotMarkers,
    renderRouteLines,
    clearRoutePolyline,
    summarySpot,
    closeSummary,
    openDetailFromSummary,
    selectedSpot,
    setSelectedSpot,
    isAddModalOpen,
    newSpotLatLng,
    currentAddress,
    openAddSpotAt,
    closeAddModal,
  } = useKakaoMap(showToast, appMode, appMode === "memory" || isPickingOnMap);

  // Load plan and auto-fit map bounds to encompass all course spots
  const handleLoadPlanWithFit = useCallback(
    (plan: DatePlan) => {
      loadPlanFromDb(plan);
      setIsEditingPlan(false);
      setIsPickingOnMap(false);
      if (plan.spots && plan.spots.length > 0) {
        fitBounds(plan.spots.map((s: PlannedSpot) => ({ lat: s.latitude, lng: s.longitude })));
      }
    },
    [loadPlanFromDb, fitBounds]
  );

  // 일정 생성 직후엔 바로 경유지를 넣을 수 있도록 편집 상태로 진입시킨다
  const handleStartPlan = useCallback(
    async (start: string, end: string, title?: string) => {
      setIsEditingPlan(true);
      setIsPickingOnMap(false);
      await startNewDatePlan(start, end, title);
    },
    [startNewDatePlan]
  );

  // 편집 토글 — 완료를 누르면 현재 코스를 DB에 반영하고 편집을 닫는다
  const handleTogglePlanEdit = useCallback(async () => {
    if (!isEditingPlan) {
      setIsEditingPlan(true);
      return;
    }
    setIsPickingOnMap(false);
    setRoutePicker(null);

    // 편집 중 고른 구간 경로를 함께 저장해야 다음에 열어볼 때 다시 조회하지 않는다.
    // 지금 코스에 없는 구간(삭제·순서 변경으로 끊긴 구간)과 읽을 수 없는 값은 버린다.
    const currentPairs = new Set(
      plannedSpots.slice(1).map((to, i) => segmentPairKey(plannedSpots[i].id, to.id))
    );
    const kept = Object.fromEntries(
      Object.entries(currentRouteSummary?.transitRoutes ?? {}).filter(
        ([pairKey, value]) => currentPairs.has(pairKey) && readSavedRoute(value)
      )
    );

    await savePlanToDb(undefined, {
      ...(currentRouteSummary ?? {}),
      transitRoutes: kept,
    });
    setIsEditingPlan(false);
  }, [isEditingPlan, savePlanToDb, currentRouteSummary, plannedSpots]);

  // "핀으로 추가" — 검색 창을 닫고 지도 클릭을 기다린다
  const handlePickOnMap = useCallback(() => {
    setIsAddressSearchOpen(false);
    setIsPickingOnMap(true);
    showToast("지도를 눌러 경유지 위치를 선택하세요 📍", "info");
  }, [showToast]);

  // Load date spots from Supabase when map is ready
  useEffect(() => {
    if (map) {
      loadDateSpots();
    }
  }, [map, loadDateSpots]);

  // 기록은 커플끼리만 보이므로, 로그인 사용자가 바뀌거나 연결이 맺어지거나 끊기면 핀과 일정을 다시 불러온다
  const accessKey = `${user?.id ?? ""}|${isCoupled}`;
  const prevAccessKeyRef = useRef<string>(accessKey);
  useEffect(() => {
    if (prevAccessKeyRef.current === accessKey) return;
    prevAccessKeyRef.current = accessKey;
    if (map) loadDateSpots();
    fetchAllDatePlans();
  }, [accessKey, map, loadDateSpots, fetchAllDatePlans]);

  // 홈 화면 앱은 백그라운드에서 돌아와도 새로 로드되지 않으므로,
  // 다른 기기에서 추가·수정한 기록이 보이도록 화면에 다시 나타날 때마다 새로 불러온다
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== "visible" || !user) return;
      if (map) loadDateSpots();
      fetchAllDatePlans();
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [user, map, loadDateSpots, fetchAllDatePlans]);

  // Synchronize Markers & Polylines based on appMode and data changes
  useEffect(() => {
    if (!map) return;

    if (appMode === "planning") {
      clearMemorySpotMarkers();

      // 코스 핀·경로선은 하단 시트와 같은 조건으로 표시한다 (플랜을 불러왔거나 새로 시작했을 때).
      // 둘을 별도 상태로 두면 모드를 오갈 때 시트만 남고 경로가 사라지는 불일치가 생긴다.
      if (isPlanSheetOpen) {
        renderPlannedSpotMarkers(plannedSpots);

        if (plannedSpots.length >= 2) {
          const lines = buildRouteLines(
            plannedSpots,
            (fromId, toId) => segmentRoutes[segmentPairKey(fromId, toId)]?.route
          );
          // 구간 경로가 하나도 없는 예전 플랜은 그때 저장해 둔 코스 전체 자동차 경로를 그대로 보여준다
          const legacyPath = currentRouteSummary?.path;
          const hasSegmentPath = lines.some((line) => line.style !== "pending");
          if (
            !hasSegmentPath &&
            legacyPath &&
            legacyPath.length > 1 &&
            currentRouteSummary?.pathKey === getRoutePathKey(plannedSpots)
          ) {
            renderRouteLines([{ path: legacyPath, style: "vehicle" }]);
          } else {
            renderRouteLines(lines);
          }
        } else {
          clearRoutePolyline();
        }
      } else {
        clearPlannedSpotMarkers();
        clearRoutePolyline();
      }
    } else {
      clearPlannedSpotMarkers();
      clearRoutePolyline();
      if (spots) {
        renderSpotMarkers(spots);
      }
    }
  }, [
    appMode,
    map,
    spots,
    plannedSpots,
    isPlanSheetOpen,
    currentRouteSummary,
    segmentRoutes,
    renderSpotMarkers,
    clearMemorySpotMarkers,
    renderPlannedSpotMarkers,
    clearPlannedSpotMarkers,
    renderRouteLines,
    clearRoutePolyline,
  ]);

  // Handle client-side fast refresh or navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      initKakaoMap();
    }
  }, [initKakaoMap]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-bg">
      {/* Header with Mode Selection Dropdown, Kakao Auth & Profile Edit */}
      <Header
        appMode={appMode}
        onSelectMode={setAppMode}
        memoryCount={spots ? spots.length : 0}
        planningCount={allDatePlans ? allDatePlans.length : 0}
        user={user}
        onLoginWithKakao={loginWithKakao}
        pushEnabled={pushEnabled}
        onTogglePush={togglePushNotification}
        pushLoading={pushLoading}
        onOpenCustomPushModal={() => setIsCustomPushModalOpen(true)}
        onOpenScheduleModal={() => {
          setIsScheduleModalOpen(true);
          fetchAllDatePlans();
        }}
      />

      <Toast toast={toast} />

      {/* Main Kakao Map View Container */}
      <MapContainer
        mapContainerRef={mapContainerRef}
        loading={loadingMap}
        mapError={mapError}
        locateUser={locateUser}
        onOpenSpotList={() => setIsSpotListOpen(true)}
        onOpenAddressSearch={() => {
          setAddressSearchTarget("memory");
          setIsAddressSearchOpen(true);
        }}
        onOpenProfileEdit={user ? () => setIsProfileEditOpen(true) : undefined}
        onOpenSettings={() => setIsSettingsOpen(true)}
        profileAvatarUrl={avatarUrl}
        onOpenTrash={async () => {
          setIsTrashOpen(true);
          setLoadingTrash(true);
          setDeletedSpots(await fetchDeletedSpots());
          setLoadingTrash(false);
        }}
        pushEnabled={pushEnabled}
        onSendInstantPush={() => {
          const finalTitle = customPushMessage.title || "DateMap😘";
          const finalBody = customPushMessage.body || "뽁!";
          // 팝캣 알림은 서로 연결된 파트너에게만 보낸다
          sendInstantPushNotification(finalTitle, finalBody, partner?.id ?? null, nickname, user?.id);
        }}
        pushLoading={pushLoading}
        onOpenCustomPushModal={() => setIsCustomPushModalOpen(true)}
      />

      {/* 커플 전용 앱 — ① 로그인 전에는 로그인, ② 로그인했지만 커플이 아니면 커플 연결부터 안내한다 */}
      {!authLoading && !user && <LoginPrompt onLoginWithKakao={loginWithKakao} />}
      {!authLoading && user && !profileLoading && !isCoupled && (
        <CoupleConnectPrompt
          myTag={profile?.tag}
          nickname={nickname}
          avatarUrl={avatarUrl}
          receivedRequests={receivedRequests}
          sentRequests={sentRequests}
          busy={partnerLinkBusy}
          onSendRequest={sendRequest}
          onRespondRequest={async (requestId, accept) => {
            const result = await respondRequest(requestId, accept);
            if (result.ok && accept) showToast("💞 커플로 연결됐어요!", "success");
            return result;
          }}
          onCancelRequest={cancelRequest}
          onLogout={logout}
        />
      )}

      {/* App Settings Modal (테마 설정 등) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userId={user?.id}
      />

      {/* User Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        currentNickname={nickname}
        currentAvatarUrl={avatarUrl}
        myTag={profile?.tag}
        partner={partner}
        onDisconnect={async () => {
          const result = await disconnect();
          if (result.ok) {
            showToast("커플 연결을 해제했어요.", "info");
          } else {
            showToast(result.message ?? "연결을 해제하지 못했어요.", "error");
          }
          return result.ok;
        }}
        onLogout={logout}
        onSave={async (newNickname, imageFile) => {
          const success = await updateProfile(newNickname, imageFile);
          if (success) {
            showToast("✨ 프로필 정보가 성공적으로 수정되었습니다!", "success");
            await loadDateSpots();
          } else {
            showToast("프로필 수정 중 오류가 발생했습니다.", "error");
          }
          return success;
        }}
      />

      {/* Custom Push Notification Message Modal */}
      <CustomPushMessageModal
        isOpen={isCustomPushModalOpen}
        onClose={() => setIsCustomPushModalOpen(false)}
        currentTitle={customPushMessage.title}
        currentBody={customPushMessage.body}
        defaultNickname={nickname}
        onSave={handleSaveCustomPushMessage}
      />

      {/* Memory Spot Creation Modal with Creator Tracking */}
      {appMode === "memory" && (
        <AddSpotModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          latLng={newSpotLatLng}
          initialAddress={currentAddress}
          onSubmit={createDateSpot}
          isUploading={isUploading}
          currentUserId={user?.id}
          currentUserNickname={nickname}
          currentUserAvatarUrl={avatarUrl}
        />
      )}

      {/* Future Planned Spot Creation Modal */}
      {appMode === "planning" && (
        <AddPlannedSpotModal
          isOpen={isAddModalOpen}
          onClose={() => {
            closeAddModal();
            setIsPickingOnMap(false);
          }}
          latLng={newSpotLatLng}
          initialAddress={currentAddress}
          onSubmit={(title, memo, lat, lng, address) => {
            addSpot(title, memo, lat, lng, address);
            closeAddModal();
            setIsPickingOnMap(false);
          }}
        />
      )}

      {/* Step 1: Summary View Sheet for Memory Spots */}
      {appMode === "memory" && (
        <SpotSummarySheet
          spot={summarySpot}
          onClose={closeSummary}
          onOpenDetail={openDetailFromSummary}
        />
      )}

      {/* Step 2: Full Detail View Modal for Memory Spots */}
      {appMode === "memory" && (
        <SpotDetailSheet
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onDelete={deleteDateSpot}
          onUpdate={async (spot, updates) => {
            const updated = await updateDateSpot(spot, updates);
            if (updated) setSelectedSpot(updated);
            return updated;
          }}
          currentUserId={user?.id}
        />
      )}

      {/* Address Search Modal (추억 핀 등록 & 코스 경유지 추가 공용) */}
      <AddressSearchModal
        isOpen={isAddressSearchOpen}
        onClose={() => setIsAddressSearchOpen(false)}
        accent={addressSearchTarget === "planning" ? "plan" : "memory"}
        title={addressSearchTarget === "planning" ? "경유지 추가" : "주소로 추가"}
        subtitle={
          addressSearchTarget === "planning"
            ? "검색한 장소를 코스 마지막에 추가해요"
            : "주소나 장소 이름으로 검색해 핀을 찍어보세요"
        }
        onPickOnMap={addressSearchTarget === "planning" ? handlePickOnMap : undefined}
        onSelectLocation={(result) => {
          setIsAddressSearchOpen(false);
          // 경유지 추가로 열었다면 플래닝 모드를 유지해 현재 코스에 이어 붙인다
          if (addressSearchTarget === "memory" && appMode !== "memory") {
            setAppMode("memory");
          }
          openAddSpotAt(result.lat, result.lng, result.address || result.name);
        }}
      />

      {/* Trash Modal (휴지통 — 삭제된 핀 복구) */}
      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedSpots={deletedSpots}
        isLoading={loadingTrash}
        onRestore={async (originalSpotId) => {
          const success = await restoreDateSpot(originalSpotId);
          if (success) {
            setDeletedSpots((prev) =>
              prev.filter((d) => d.original_spot_id !== originalSpotId)
            );
            await loadDateSpots();
          }
          return success;
        }}
      />

      {/* Memory Spot List Modal (추억 모아보기) */}
      <SpotListModal
        isOpen={isSpotListOpen}
        onClose={() => setIsSpotListOpen(false)}
        spots={spots}
        onSelectSpot={(spot) => {
          setIsSpotListOpen(false);
          if (appMode !== "memory") setAppMode("memory");
          panToSpot(spot.latitude, spot.longitude);
          setSelectedSpot(spot);
        }}
      />

      {/* Future Planning Control Sheet (Only shown when user loads or creates a course) */}
      {appMode === "planning" && isPlanSheetOpen && (
        <FuturePlanSheet
          planTitle={currentTitle}
          plannedSpots={plannedSpots}
          onRemoveSpot={removeSpot}
          onMoveUp={moveSpotUp}
          onMoveDown={moveSpotDown}
          segmentRoutes={segmentRoutes}
          loadingRoutes={loadingRoutes}
          onPanToSpot={(lat, lng) => panToSpot(lat, lng)}
          onAddWaypoint={() => {
            setAddressSearchTarget("planning");
            setIsAddressSearchOpen(true);
          }}
          isEditing={isEditingPlan}
          onToggleEdit={handleTogglePlanEdit}
          isSaving={isSavingDb}
          onRenamePlan={setCurrentTitle}
          onUpdateSpot={updateSpot}
          onOpenRouteOptions={(from, to) => setRoutePicker({ from, to })}
        />
      )}

      {/* 구간 경로 고르기 (편집 중에만 열린다) */}
      {appMode === "planning" && isEditingPlan && routePicker && (
        <RouteOptionsSheet
          from={routePicker.from}
          to={routePicker.to}
          selected={
            segmentRoutes[segmentPairKey(routePicker.from.id, routePicker.to.id)]?.route ?? null
          }
          searchRoutes={searchRoutes}
          onSelect={(route) => {
            patchSegmentRoute(segmentPairKey(routePicker.from.id, routePicker.to.id), {
              fromSpotId: routePicker.from.id,
              toSpotId: routePicker.to.id,
              route,
            });
            setRoutePicker(null);
          }}
          onClose={() => setRoutePicker(null)}
        />
      )}

      {/* Date Itineraries List Modal (Past & Future) */}
      <DateItineraryModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        allPlans={allDatePlans}
        onLoadPlan={handleLoadPlanWithFit}
        onDeletePlan={deletePlanFromDb}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Create New Date Plan Modal (Date Range Selection) */}
      <CreateDatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStartPlan={handleStartPlan}
      />

      {/* Dynamic Kakao Map SDK Script Loading */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={initKakaoMap}
        onError={() => {
          setMapError("카카오 지도 API 로드에 실패했습니다. (API 키 혹은 플랫폼 도메인 설정을 확인해 주세요)");
          setLoadingMap(false);
        }}
      />
    </main>
  );
}