"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { ToastState } from "@/types/spot";
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
import { FuturePlanSheet } from "@/components/modal/FuturePlanSheet";
import { AddPlannedSpotModal } from "@/components/modal/AddPlannedSpotModal";
import { ProfileEditModal } from "@/components/modal/ProfileEditModal";
import { CustomPushMessageModal } from "@/components/modal/CustomPushMessageModal";
import { DateItineraryModal } from "@/components/modal/DateItineraryModal";
import { CreateDatePlanModal } from "@/components/modal/CreateDatePlanModal";
import { DatePlan, PlannedSpot } from "@/types/planner";

export default function Home() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance?: number; duration?: number }>({});
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
  const [isCustomPushModalOpen, setIsCustomPushModalOpen] = useState<boolean>(false);
  const [customPushMessage, setCustomPushMessage] = useState<{ title: string; body: string }>({
    title: "DateMap😘",
    body: "뽁!",
  });

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
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
  const { spots, isUploading, loadDateSpots, createDateSpot, deleteDateSpot } = useDateSpots(showToast);

  // Future Date Spot Planner
  const {
    appMode,
    setAppMode,
    plannedSpots,
    selectedDate,
    setSelectedDate,
    allDatePlans,
    savedPlans,
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
    addSpot,
    removeSpot,
    moveSpotUp,
    moveSpotDown,
    clearAllPlans,
  } = useFuturePlanner(showToast, user?.id);

  // Kakao Mobility Directions API
  const { fetchRoute, loadingRoute } = useDirections();

  // ODsay Public Transit Route API
  const { transitRoutes, loadingTransit } = useTransitRoute(plannedSpots);

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
    handleStartAddSpot,
    closeAddModal,
  } = useKakaoMap(showToast);

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
      renderPlannedSpotMarkers(plannedSpots);

      if (plannedSpots.length >= 2) {
        fetchRoute(plannedSpots).then((res) => {
          if (res.path && res.path.length > 0) {
            renderRoutePolyline(res.path);
          }
          setRouteStats({ distance: res.distance, duration: res.duration });
        });
      } else {
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
    fetchRoute,
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
    <main className="relative w-screen h-screen overflow-hidden bg-gray-50">
      {/* Header with Mode Selection Dropdown, Kakao Auth & Profile Edit */}
      <Header
        appMode={appMode}
        onSelectMode={setAppMode}
        memoryCount={spots ? spots.length : 0}
        planningCount={plannedSpots.length}
        user={user}
        nickname={nickname}
        avatarUrl={avatarUrl}
        onLoginWithKakao={loginWithKakao}
        onLogout={logout}
        onOpenProfileEdit={() => setIsProfileEditOpen(true)}
        pushEnabled={pushEnabled}
        onTogglePush={togglePushNotification}
        pushLoading={pushLoading}
        onOpenCustomPushModal={() => setIsCustomPushModalOpen(true)}
        onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <Toast toast={toast} />

      {/* Main Kakao Map View Container */}
      <MapContainer
        mapContainerRef={mapContainerRef}
        loading={loadingMap}
        mapError={mapError}
        locateUser={locateUser}
        handleFabClick={handleStartAddSpot}
        pushEnabled={pushEnabled}
        onSendInstantPush={() => {
          const finalTitle = customPushMessage.title || "DateMap😘";
          const finalBody = customPushMessage.body || "뽁!";
          const targetPartnerId =
            profile?.partner_id ||
            (typeof window !== "undefined"
              ? localStorage.getItem("our_date_map_target_partner_id")
              : null);
          sendInstantPushNotification(finalTitle, finalBody, targetPartnerId);
        }}
        pushLoading={pushLoading}
        onOpenCustomPushModal={() => setIsCustomPushModalOpen(true)}
      />

      {/* User Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        currentNickname={nickname}
        currentAvatarUrl={avatarUrl}
        currentPartnerId={profile?.partner_id}
        fetchAvailablePartners={fetchAvailablePartners}
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
          currentUserId={user?.id}
        />
      )}

      {/* Future Planning Control Sheet (Only shown when user loads or creates a course) */}
      {appMode === "planning" && isPlanSheetOpen && (
        <FuturePlanSheet
          plannedSpots={plannedSpots}
          onRemoveSpot={removeSpot}
          onMoveUp={moveSpotUp}
          onMoveDown={moveSpotDown}
          onClearAll={clearAllPlans}
          routeDistance={routeStats.distance}
          routeDuration={routeStats.duration}
          loadingRoute={loadingRoute}
          transitRoutes={transitRoutes}
          loadingTransit={loadingTransit}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          savedPlans={savedPlans}
          isSavingDb={isSavingDb}
          isLoadingDb={isLoadingDb}
          onSavePlanToDb={() => savePlanToDb(undefined, routeStats)}
          onLoadPlanFromDb={loadPlanFromDb}
          onDeletePlanFromDb={deletePlanFromDb}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onClose={() => setIsPlanSheetOpen(false)}
          onPanToSpot={(lat, lng) => panToSpot(lat, lng)}
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