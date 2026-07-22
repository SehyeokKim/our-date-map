"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { ToastState } from "@/types/spot";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import { useDateSpots } from "@/hooks/useDateSpots";
import { Header } from "@/components/common/Header";
import { Toast } from "@/components/common/Toast";
import { MapContainer } from "@/components/map/MapContainer";
import { AddSpotModal } from "@/components/modal/AddSpotModal";
import { SpotSummarySheet } from "@/components/modal/SpotSummarySheet";
import { SpotDetailSheet } from "@/components/modal/SpotDetailSheet";

export default function Home() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const { spots, isUploading, loadDateSpots, createDateSpot, deleteDateSpot } = useDateSpots(showToast);

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

  // Load spots when Kakao Map is ready
  useEffect(() => {
    if (map) {
      loadDateSpots();
    }
  }, [map, loadDateSpots]);

  // Render spot markers whenever spots change
  useEffect(() => {
    if (map && spots) {
      renderSpotMarkers(spots);
    }
  }, [map, spots, renderSpotMarkers]);

  // Handle client-side fast refresh or navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      initKakaoMap();
    }
  }, [initKakaoMap]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-50">
      <Header />
      <Toast toast={toast} />

      <MapContainer
        mapContainerRef={mapContainerRef}
        loading={loadingMap}
        mapError={mapError}
        locateUser={locateUser}
        handleFabClick={handleStartAddSpot}
      />

      <AddSpotModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        latLng={newSpotLatLng}
        initialAddress={currentAddress}
        onSubmit={createDateSpot}
        isUploading={isUploading}
      />

      {/* Step 1: Summary Preview Popup */}
      <SpotSummarySheet
        spot={summarySpot}
        onClose={closeSummary}
        onOpenDetail={openDetailFromSummary}
      />

      {/* Step 2: Full Detail View Popup */}
      <SpotDetailSheet
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        onDelete={deleteDateSpot}
      />

      {/* Dynamic Kakao Map SDK Script Loading with Geocoder Services */}
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