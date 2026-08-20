"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Script from "next/script";
import { ToastState, DeletedDateSpot } from "@/types/spot";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { useDateSpots } from "@/hooks/useDateSpots";
import { useFuturePlanner } from "@/hooks/useFuturePlanner";
import { useDirections } from "@/hooks/useDirections";
import { useTransitRoute } from "@/hooks/useTransitRoute";
import { useAuth } from "@/hooks/useAuth";
import { useWebPush } from "@/hooks/useWebPush";
import { Header } from "@/components/common/Header";
import { Toast } from "@/components/common/Toast";
import { MapContainer } from "@/components/map/MapContainer";
import { AddSpotModal } from "@/components/modal/AddSpotModal";
import { SpotSummarySheet } from "@/components/modal/SpotSummarySheet";
import { SpotDetailSheet } from "@/components/modal/SpotDetailSheet";
import { SpotListModal } from "@/components/modal/SpotListModal";
import { TrashModal } from "@/components/modal/TrashModal";
import { AddressSearchModal } from "@/components/modal/AddressSearchModal";
import { FuturePlanSheet } from "@/components/modal/FuturePlanSheet";
import { AddPlannedSpotModal } from "@/components/modal/AddPlannedSpotModal";
import { ProfileEditModal } from "@/components/modal/ProfileEditModal";
import { SettingsModal } from "@/components/modal/SettingsModal";
import { CustomPushMessageModal } from "@/components/modal/CustomPushMessageModal";
import { DateItineraryModal } from "@/components/modal/DateItineraryModal";
import { CreateDatePlanModal } from "@/components/modal/CreateDatePlanModal";
import { AppMode, DatePlan, PlannedSpot } from "@/types/planner";

export default function Home() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance?: number; duration?: number }>({});
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
    profile,
    nickname,
    avatarUrl,
    loginWithKakao,
    logout,
    updateProfile,
    fetchAvailablePartners,
  } = useAuth();

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
    updateRouteSummary,
    currentTitle,
    allDatePlans,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isPlanSheetOpen,
    startNewDatePlan,
    loadPlanFromDb,
    deletePlanFromDb,
    addSpot,
    removeSpot,
    moveSpotUp,
    moveSpotDown,
  } = useFuturePlanner(showToast, user?.id);

  // Kakao Mobility Directions API
  const { fetchRoute, loadingRoute } = useDirections();

  // ODsay Public Transit Route API
  const { transitRoutes, loadingTransit } = useTransitRoute(
    plannedSpots,
    currentRouteSummary?.transitRoutes
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
    renderRoutePolyline,
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
  } = useKakaoMap(showToast, appMode);

  // Load plan and auto-fit map bounds to encompass all course spots
  const handleLoadPlanWithFit = useCallback(
    (plan: DatePlan) => {
      loadPlanFromDb(plan);
      if (plan.spots && plan.spots.length > 0) {
        fitBounds(plan.spots.map((s: PlannedSpot) => ({ lat: s.latitude, lng: s.longitude })));
      }
    },
    [loadPlanFromDb, fitBounds]
  );

  // Load date spots from Supabase when map is ready
  useEffect(() => {
    if (map) {
      loadDateSpots();
    }
  }, [map, loadDateSpots]);

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
          // Use cached/saved route path if available, avoiding redundant Kakao API calls
          if (currentRouteSummary?.path && currentRouteSummary.path.length > 0) {
            renderRoutePolyline(currentRouteSummary.path);
            setRouteStats({
              distance: currentRouteSummary.distance,
              duration: currentRouteSummary.duration,
            });
          } else {
            fetchRoute(plannedSpots).then((res) => {
              if (res.path && res.path.length > 0) {
                renderRoutePolyline(res.path);
                updateRouteSummary({
                  distance: res.distance,
                  duration: res.duration,
                  path: res.path,
                  transitRoutes: transitRoutes,
                });
              }
              setRouteStats({ distance: res.distance, duration: res.duration });
            });
          }
        } else {
          clearRoutePolyline();
          setRouteStats({});
        }
      } else {
        clearPlannedSpotMarkers();
        clearRoutePolyline();
        setRouteStats({});
      }
    } else {
      clearPlannedSpotMarkers();
      clearRoutePolyline();
      setRouteStats({});
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
    fetchRoute,
    updateRouteSummary,
    transitRoutes,
    renderSpotMarkers,
    clearMemorySpotMarkers,
    renderPlannedSpotMarkers,
    clearPlannedSpotMarkers,
    renderRoutePolyline,
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
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
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
          const targetPartnerId =
            profile?.partner_id ||
            (typeof window !== "undefined"
              ? localStorage.getItem("our_date_map_target_partner_id")
              : null);
          sendInstantPushNotification(finalTitle, finalBody, targetPartnerId, nickname, user?.id);
        }}
        pushLoading={pushLoading}
        onOpenCustomPushModal={() => setIsCustomPushModalOpen(true)}
      />

      {/* App Settings Modal (테마 설정 등) */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* User Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        currentNickname={nickname}
        currentAvatarUrl={avatarUrl}
        currentPartnerId={profile?.partner_id}
        fetchAvailablePartners={fetchAvailablePartners}
        onLogout={logout}
        onSave={async (newNickname, imageFile, partnerId) => {
          const success = await updateProfile(newNickname, imageFile, partnerId);
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
          onClose={closeAddModal}
          latLng={newSpotLatLng}
          initialAddress={currentAddress}
          onSubmit={(title, memo, lat, lng, address) => {
            addSpot(title, memo, lat, lng, address);
            closeAddModal();
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
          routeDistance={routeStats.distance}
          routeDuration={routeStats.duration}
          loadingRoute={loadingRoute}
          transitRoutes={transitRoutes}
          loadingTransit={loadingTransit}
          onPanToSpot={(lat, lng) => panToSpot(lat, lng)}
          onAddWaypoint={() => {
            setAddressSearchTarget("planning");
            setIsAddressSearchOpen(true);
          }}
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
        onStartPlan={startNewDatePlan}
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