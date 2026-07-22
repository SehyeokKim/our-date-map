"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DateSpot, LatLng } from "@/types/spot";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useKakaoMap(showToast: (message: string, type?: "success" | "error" | "info") => void) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const userOverlayRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const userCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isFirstLocationLoadRef = useRef<boolean>(true);

  // Spot selection & Temporary pin states
  const [selectedSpot, setSelectedSpot] = useState<DateSpot | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newSpotLatLng, setNewSpotLatLng] = useState<LatLng | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  const overlaysRef = useRef<any[]>([]);
  const tempOverlayRef = useRef<any | null>(null);
  const geocoderRef = useRef<any | null>(null);

  // Helper for Reverse Geocoding
  const fetchAddress = useCallback((lat: number, lng: number) => {
    const kakao = window.kakao;
    if (!kakao || !kakao.maps || !kakao.maps.services) return;

    if (!geocoderRef.current) {
      geocoderRef.current = new kakao.maps.services.Geocoder();
    }

    geocoderRef.current.coord2Address(lng, lat, (result: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        const item = result[0];
        const roadAddr = item.road_address ? item.road_address.address_name : "";
        const jibunAddr = item.address ? item.address.address_name : "";
        const finalAddress = roadAddr || jibunAddr || "";
        setCurrentAddress(finalAddress);
      } else {
        setCurrentAddress("");
      }
    });
  }, []);

  // Initialize Kakao Maps
  const initKakaoMap = useCallback(() => {
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) {
      setMapError("카카오 지도 API가 로드되었으나 초기화할 수 없습니다.");
      setLoadingMap(false);
      return;
    }

    kakao.maps.load(() => {
      if (!mapContainerRef.current) return;

      // Default center: Namsan Seoul Tower (37.551172, 126.988226)
      const defaultLatLng = new kakao.maps.LatLng(37.551172, 126.988226);
      const mapOptions = {
        center: defaultLatLng,
        level: 3,
      };

      const mapInstance = new kakao.maps.Map(mapContainerRef.current, mapOptions);
      setMap(mapInstance);
      setLoadingMap(false);
      setMapError(null);

      startTrackingLocation(mapInstance);
    });
  }, []);

  // Geolocation tracking
  const startTrackingLocation = useCallback(
    (mapInstance: any) => {
      if (!mapInstance || typeof window === "undefined" || !navigator.geolocation) {
        return;
      }

      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          userCoordsRef.current = { latitude, longitude };

          const currentLatLng = new kakao.maps.LatLng(latitude, longitude);

          if (isFirstLocationLoadRef.current) {
            mapInstance.panTo(currentLatLng);
            isFirstLocationLoadRef.current = false;
            showToast("현재 위치를 불러왔습니다.", "success");
          }

          if (userOverlayRef.current) {
            userOverlayRef.current.setPosition(currentLatLng);
            userOverlayRef.current.setMap(mapInstance);
          } else {
            const overlayElement = document.createElement("div");
            overlayElement.className = "custom-user-marker";

            const ping = document.createElement("div");
            ping.className = "ping";

            const dot = document.createElement("div");
            dot.className = "dot";

            const core = document.createElement("div");
            core.className = "core";

            dot.appendChild(core);
            overlayElement.appendChild(ping);
            overlayElement.appendChild(dot);

            const newOverlay = new kakao.maps.CustomOverlay({
              position: currentLatLng,
              content: overlayElement,
              xAnchor: 0.5,
              yAnchor: 0.5,
              zIndex: 10,
            });

            newOverlay.setMap(mapInstance);
            userOverlayRef.current = newOverlay;
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (isFirstLocationLoadRef.current) {
            showToast("위치 정보를 가져올 수 없어 기본 위치로 표시합니다.", "info");
            isFirstLocationLoadRef.current = false;
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    },
    [showToast]
  );

  // Center map on user location
  const locateUser = useCallback(() => {
    if (!map) return;
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;

    if (userCoordsRef.current) {
      const { latitude, longitude } = userCoordsRef.current;
      const currentLatLng = new kakao.maps.LatLng(latitude, longitude);
      map.panTo(currentLatLng);
      showToast("현재 위치로 이동했습니다.", "success");
    } else {
      showToast("위치 정보를 불러오는 중입니다...", "info");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          userCoordsRef.current = { latitude, longitude };
          const currentLatLng = new kakao.maps.LatLng(latitude, longitude);
          map.panTo(currentLatLng);
          startTrackingLocation(map);
          showToast("현재 위치를 불러왔습니다.", "success");
        },
        (error) => {
          console.error("Geolocation error:", error);
          showToast("위치 정보를 가져올 수 없습니다.", "error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [map, showToast, startTrackingLocation]);

  // Render Date Spot markers with Mobile Map Pan Event Prevention & Direct SpotDetailSheet Open
  const renderSpotMarkers = useCallback(
    (spotsData: DateSpot[]) => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps || !map) return;

      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];

      spotsData.forEach((spot) => {
        const position = new kakao.maps.LatLng(spot.latitude, spot.longitude);

        const el = document.createElement("div");
        // Minimum 48x48px touch target & explicit pointer-events: auto
        el.className = "w-12 h-12 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-200 select-none touch-manipulation pointer-events-auto";
        el.style.pointerEvents = "auto";
        el.style.cursor = "pointer";
        el.style.touchAction = "manipulation";
        (el.style as any).webkitTapHighlightColor = "transparent";

        el.innerHTML = `
        <div class="relative flex flex-col items-center pointer-events-auto cursor-pointer">
          <div class="w-10 h-10 rounded-full bg-white border border-rose-100 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200 pointer-events-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-rose-500 pointer-events-none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div class="w-1.5 h-1.5 bg-rose-500 rounded-full -mt-0.5 shadow-sm pointer-events-none"></div>
        </div>
      `;

        // CRITICAL FIX FOR MOBILE: Stop touchstart/pointerdown propagation to prevent Kakao Map from capturing map drag session
        const stopMapPan = (e: Event) => {
          e.stopPropagation();
        };

        el.addEventListener("touchstart", stopMapPan, { passive: true });
        el.addEventListener("touchmove", stopMapPan, { passive: true });
        el.addEventListener("pointerdown", stopMapPan);
        el.addEventListener("mousedown", stopMapPan);

        let lastTouchTime = 0;
        const handleMarkerSelect = (e: Event) => {
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();

          const now = Date.now();
          if (now - lastTouchTime < 300) return;
          lastTouchTime = now;

          // DIRECTLY OPEN SpotDetailSheet (Full detail view sheet with photo, story, address, coordinates, delete button)
          setSelectedSpot(spot);
          map.panTo(position);
        };

        el.addEventListener("click", handleMarkerSelect);
        el.addEventListener("touchend", handleMarkerSelect);

        const overlay = new kakao.maps.CustomOverlay({
          position: position,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 30,
          clickable: true,
        });

        overlay.setMap(map);
        overlaysRef.current.push(overlay);
      });
    },
    [map]
  );

  // Open "Add Spot" modal manually via FAB
  const handleStartAddSpot = useCallback(() => {
    let coords: LatLng | null = null;
    if (userCoordsRef.current) {
      coords = {
        lat: userCoordsRef.current.latitude,
        lng: userCoordsRef.current.longitude,
      };
    } else if (map) {
      const center = map.getCenter();
      coords = {
        lat: center.getLat(),
        lng: center.getLng(),
      };
    }

    if (coords) {
      setNewSpotLatLng(coords);
      fetchAddress(coords.lat, coords.lng);
    }
    setIsAddModalOpen(true);
  }, [map, fetchAddress]);

  // Handle map click to place temporary pin & fetch reverse geocoding address
  useEffect(() => {
    if (!map) return;
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;

    let clickListener: any = null;

    clickListener = (mouseEvent: any) => {
      const clickedLatLng = mouseEvent.latLng;
      const lat = clickedLatLng.getLat();
      const lng = clickedLatLng.getLng();
      const newCoords = { lat, lng };

      setNewSpotLatLng(newCoords);
      fetchAddress(lat, lng);
    };

    kakao.maps.event.addListener(map, "click", clickListener);

    return () => {
      if (clickListener) {
        kakao.maps.event.removeListener(map, "click", clickListener);
      }
    };
  }, [map, fetchAddress]);

  // Handle temporary pin overlay rendering
  useEffect(() => {
    if (!map) return;
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;

    if (newSpotLatLng) {
      const latLngObj = new kakao.maps.LatLng(newSpotLatLng.lat, newSpotLatLng.lng);

      if (tempOverlayRef.current) {
        tempOverlayRef.current.setPosition(latLngObj);
        tempOverlayRef.current.setMap(map);
      } else {
        const el = document.createElement("div");
        el.className = "animate-bounce cursor-pointer touch-manipulation w-12 h-12 flex items-center justify-center p-1 pointer-events-auto";
        el.style.pointerEvents = "auto";
        el.style.cursor = "pointer";
        el.style.touchAction = "manipulation";
        (el.style as any).webkitTapHighlightColor = "transparent";

        el.innerHTML = `
          <div class="relative flex flex-col items-center pointer-events-auto">
            <div class="w-10 h-10 rounded-full bg-rose-500 border border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-white">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div class="w-1.5 h-1.5 bg-rose-500 rounded-full -mt-0.5"></div>
          </div>
        `;

        const stopMapPan = (e: Event) => {
          e.stopPropagation();
        };
        el.addEventListener("touchstart", stopMapPan, { passive: true });
        el.addEventListener("touchmove", stopMapPan, { passive: true });
        el.addEventListener("pointerdown", stopMapPan);
        el.addEventListener("mousedown", stopMapPan);

        let lastTempTouchTime = 0;
        const handleTempSelect = (e: Event) => {
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();

          const now = Date.now();
          if (now - lastTempTouchTime < 300) return;
          lastTempTouchTime = now;

          setIsAddModalOpen(true);
        };

        el.addEventListener("click", handleTempSelect);
        el.addEventListener("touchend", handleTempSelect);

        const overlay = new kakao.maps.CustomOverlay({
          position: latLngObj,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 35,
          clickable: true,
        });

        overlay.setMap(map);
        tempOverlayRef.current = overlay;
      }
    } else {
      if (tempOverlayRef.current) {
        tempOverlayRef.current.setMap(null);
        tempOverlayRef.current = null;
      }
    }
  }, [map, newSpotLatLng]);

  // Clean temp overlay when modal is closed
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setNewSpotLatLng(null);
    setCurrentAddress("");
    if (tempOverlayRef.current) {
      tempOverlayRef.current.setMap(null);
      tempOverlayRef.current = null;
    }
  }, []);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    mapContainerRef,
    map,
    loadingMap,
    mapError,
    setMapError,
    setLoadingMap,
    initKakaoMap,
    locateUser,
    renderSpotMarkers,
    selectedSpot,
    setSelectedSpot,
    isAddModalOpen,
    setIsAddModalOpen,
    newSpotLatLng,
    setNewSpotLatLng,
    currentAddress,
    setCurrentAddress,
    handleStartAddSpot,
    closeAddModal,
  };
}
