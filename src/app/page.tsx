"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { ToastState } from "@/types/spot";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { useDateSpots } from "@/hooks/useDateSpots";
import { useFuturePlanner } from "@/hooks/useFuturePlanner";
import { useDirections } from "@/hooks/useDirections";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/common/Header";
import { Toast } from "@/components/common/Toast";
import { MapContainer } from "@/components/map/MapContainer";
import { AddSpotModal } from "@/components/modal/AddSpotModal";
import { SpotSummarySheet } from "@/components/modal/SpotSummarySheet";
import { SpotDetailSheet } from "@/components/modal/SpotDetailSheet";
import { FuturePlanSheet } from "@/components/modal/FuturePlanSheet";
import { AddPlannedSpotModal } from "@/components/modal/AddPlannedSpotModal";

export default function Home() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance?: number; duration?: number }>({});

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Supabase Auth (Kakao OAuth)
  const { user, nickname, avatarUrl, loginWithKakao, logout } = useAuth();

  // Supabase Memory Date Spots
  const { spots, isUploading, loadDateSpots, createDateSpot, deleteDateSpot } = useDateSpots(showToast);

  // Future Date Spot Planner
  const {
    appMode,
    setAppMode,
    plannedSpots,
    addSpot,
    removeSpot,
    moveSpotUp,
    moveSpotDown,
    clearAllPlans,
  } = useFuturePlanner(showToast);

  // Kakao Mobility Directions API
  const { fetchRoute, loadingRoute } = useDirections();

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
      {/* Header with Mode Selection Dropdown & Kakao Auth */}
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
      />

      <Toast toast={toast} />

      {/* Main Kakao Map View Container */}
      <MapContainer
        mapContainerRef={mapContainerRef}
        loading={loadingMap}
        mapError={mapError}
        locateUser={locateUser}
        handleFabClick={handleStartAddSpot}
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
        />
      )}

      {/* Future Planning Control Sheet */}
      {appMode === "planning" && (
        <FuturePlanSheet
          plannedSpots={plannedSpots}
          onRemoveSpot={removeSpot}
          onMoveUp={moveSpotUp}
          onMoveDown={moveSpotDown}
          onClearAll={clearAllPlans}
          routeDistance={routeStats.distance}
          routeDuration={routeStats.duration}
          loadingRoute={loadingRoute}
        />
      )}

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