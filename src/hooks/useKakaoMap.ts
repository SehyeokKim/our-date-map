"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DateSpot, LatLng } from "@/types/spot";
import { AppMode, PlannedSpot } from "@/types/planner";
import { RouteLine, RouteLineStyle, mixColor } from "@/lib/route";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** 지도에 올린 경로선 하나와, 강조할 때 되돌릴 원래 색·투명도·순서 */
interface RouteShape {
  polyline: any;
  group: number;
  color: string;
  opacity: number;
  zIndex: number;
}

interface LineOption {
  weight: number;
  opacity: number;
  stroke: string;
}

/** 강조하지 않은 구간은 이 회색 쪽으로 섞고 투명도를 낮춰 채도를 뺀다 */
const DIM_TARGET = "#c9ced6";
const DIM_MIX = 0.45;
const DIM_OPACITY = 0.55;
/** 실선 테두리는 선 색에 검정을 이만큼 섞는다 */
const BORDER_DARKEN = 0.4;
const ARROW_COLOR = "#ffffff";
/** 화살표 사이 화면 거리와 꺾쇠 한 변의 크기(px) */
const ARROW_GAP_PX = 56;
const ARROW_SIZE_PX = 1.8;
/**
 * 마우스·손가락이 닿는 범위. 보이는 선보다 굵은 투명 선을 맨 위에 깔아,
 * 가는 실선이나 점 사이가 빈 도보선도 쉽게 잡히게 한다
 */
const HIT_WEIGHT_PX = 18;
const HIT_Z_INDEX = 30;
/** 많이 확대했을 때 화살표가 지나치게 늘지 않게 막는다 */
const MAX_ARROWS = 400;

export function useKakaoMap(
  showToast: (message: string, type?: "success" | "error" | "info") => void,
  appMode: AppMode = "memory",
  /** 지도를 클릭했을 때 등록용 핀을 찍을 수 있는지. 플래너 모드는 핀 선택 중일 때만 허용한다 */
  allowMapPin: boolean = true
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const userOverlayRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const userCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isFirstLocationLoadRef = useRef<boolean>(true);

  // Spot selection & Temporary pin states
  const [summarySpot, setSummarySpot] = useState<DateSpot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<DateSpot | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newSpotLatLng, setNewSpotLatLng] = useState<LatLng | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  const overlaysRef = useRef<any[]>([]);
  const plannedOverlaysRef = useRef<any[]>([]);
  const polylinesRef = useRef<RouteShape[]>([]);
  const arrowsRef = useRef<RouteShape[]>([]);
  // 화살표를 찍을 실선. 지도를 움직이면 이 선들로 화살표를 다시 계산한다
  const arrowLinesRef = useRef<RouteLine[]>([]);
  const hoveredGroupRef = useRef<number | null>(null);
  const pinnedGroupRef = useRef<number | null>(null);
  const lineClickedAtRef = useRef<number>(0);
  // 경로선을 잡기 위한 투명 선. 색은 그대로 두고 순서만 바꾼다
  const hitLinesRef = useRef<{ polyline: any; group: number }[]>([]);
  const tempOverlayRef = useRef<any | null>(null);
  const tempElRef = useRef<HTMLDivElement | null>(null);
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

  // Render Date Spot markers with Mobile Touch Event Prevention
  const renderSpotMarkers = useCallback(
    (spotsData: DateSpot[]) => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps || !map) return;

      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];

      spotsData.forEach((spot) => {
        const position = new kakao.maps.LatLng(spot.latitude, spot.longitude);

        const el = document.createElement("div");
        el.className = "w-12 h-12 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-200 select-none touch-manipulation pointer-events-auto";
        el.style.pointerEvents = "auto";
        el.style.cursor = "pointer";
        el.style.touchAction = "manipulation";
        (el.style as any).webkitTapHighlightColor = "transparent";

        el.innerHTML = `
        <div class="relative flex flex-col items-center pointer-events-auto cursor-pointer">
          <div class="w-10 h-10 rounded-full bg-surface border border-memory-line shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200 pointer-events-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-memory pointer-events-none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div class="w-1.5 h-1.5 bg-memory rounded-full -mt-0.5 shadow-sm pointer-events-none"></div>
        </div>
      `;

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

          setSummarySpot(spot);
          setSelectedSpot(null);
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

  // Clear memory spot overlays
  const clearMemorySpotMarkers = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
  }, []);

  // Clear planned spot overlays
  const clearPlannedSpotMarkers = useCallback(() => {
    plannedOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    plannedOverlaysRef.current = [];
  }, []);

  // Render Planned Spot markers (Numbered violet circles)
  const renderPlannedSpotMarkers = useCallback(
    (plannedSpotsData: PlannedSpot[]) => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps || !map) return;

      clearPlannedSpotMarkers();

      plannedSpotsData.forEach((spot) => {
        const position = new kakao.maps.LatLng(spot.latitude, spot.longitude);

        const el = document.createElement("div");
        el.className = "flex flex-col items-center select-none touch-manipulation pointer-events-auto cursor-pointer";
        el.style.pointerEvents = "auto";
        el.style.touchAction = "manipulation";
        (el.style as any).webkitTapHighlightColor = "transparent";

        el.innerHTML = `
          <div class="relative flex flex-col items-center hover:scale-105 transition-transform">
            <div class="w-8 h-8 rounded-full bg-plan border-2 border-surface shadow-lg flex items-center justify-center text-on-accent font-extrabold text-xs">
              ${spot.order}
            </div>
            <div class="mt-1 bg-surface border border-plan-line px-2 py-0.5 rounded-full shadow-md text-[11px] font-bold text-plan-strong whitespace-nowrap max-w-[130px] truncate">
              ${spot.title}
            </div>
          </div>
        `;

        const stopMapPan = (e: Event) => {
          e.stopPropagation();
        };

        el.addEventListener("touchstart", stopMapPan, { passive: true });
        el.addEventListener("touchmove", stopMapPan, { passive: true });
        el.addEventListener("pointerdown", stopMapPan);
        el.addEventListener("mousedown", stopMapPan);

        const handlePlannedSelect = (e: Event) => {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          map.panTo(position);
        };

        el.addEventListener("click", handlePlannedSelect);
        el.addEventListener("touchend", handlePlannedSelect);

        const overlay = new kakao.maps.CustomOverlay({
          position: position,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 35,
          clickable: true,
        });

        overlay.setMap(map);
        plannedOverlaysRef.current.push(overlay);
      });
    },
    [map, clearPlannedSpotMarkers]
  );

  // Clear route lines
  const clearRoutePolyline = useCallback(() => {
    [...polylinesRef.current, ...arrowsRef.current].forEach(({ polyline }) => polyline.setMap(null));
    hitLinesRef.current.forEach(({ polyline }) => polyline.setMap(null));
    hitLinesRef.current = [];
    polylinesRef.current = [];
    arrowsRef.current = [];
    arrowLinesRef.current = [];
  }, []);

  // 강조할 구간: 마우스를 올린 구간(웹)이 먼저, 없으면 누른 구간(앱). 나머지는 흐리게 둔다
  const applyRouteHighlight = useCallback(() => {
    const active = hoveredGroupRef.current ?? pinnedGroupRef.current;
    [...polylinesRef.current, ...arrowsRef.current].forEach(
      ({ polyline, group, color, opacity, zIndex }) => {
        const on = group === active;
        polyline.setOptions({
          strokeColor: on ? color : mixColor(color, DIM_TARGET, DIM_MIX),
          strokeOpacity: on ? opacity : opacity * DIM_OPACITY,
        });
        polyline.setZIndex(on ? zIndex + 10 : zIndex);
      }
    );
    // 강조한 구간의 잡는 선을 맨 위로 올려, 다른 구간과 겹친 곳에서도 강조가 그 구간에 머물게 한다
    hitLinesRef.current.forEach(({ polyline, group }) =>
      polyline.setZIndex(group === active ? HIT_Z_INDEX + 1 : HIT_Z_INDEX)
    );
  }, []);

  const bindRouteEvents = useCallback(
    (polyline: any, group: number) => {
      const kakao = window.kakao;
      const canHover = window.matchMedia("(hover: hover)").matches;
      if (canHover) {
        kakao.maps.event.addListener(polyline, "mouseover", () => {
          hoveredGroupRef.current = group;
          applyRouteHighlight();
        });
        kakao.maps.event.addListener(polyline, "mouseout", () => {
          if (hoveredGroupRef.current !== group) return;
          hoveredGroupRef.current = null;
          applyRouteHighlight();
        });
      }
      kakao.maps.event.addListener(polyline, "click", () => {
        lineClickedAtRef.current = Date.now();
        pinnedGroupRef.current = group;
        applyRouteHighlight();
      });
    },
    [applyRouteHighlight]
  );

  // 실선 위에 진행 방향 화살표(흰 꺾쇠)를 화면 간격으로 찍는다. 화면 거리 기준이라 지도를 움직일 때마다 다시 그린다
  const drawRouteArrows = useCallback(() => {
    const kakao = window.kakao;
    const container = mapContainerRef.current;
    if (!kakao || !kakao.maps || !map || !container) return;

    arrowsRef.current.forEach(({ polyline }) => polyline.setMap(null));
    arrowsRef.current = [];

    const projection = map.getProjection();
    const width = container.clientWidth;
    const height = container.clientHeight;
    const inView = (x: number, y: number) =>
      x > -ARROW_GAP_PX && x < width + ARROW_GAP_PX && y > -ARROW_GAP_PX && y < height + ARROW_GAP_PX;
    const toCoords = (x: number, y: number) =>
      projection.coordsFromContainerPoint(new kakao.maps.Point(x, y));

    for (const line of arrowLinesRef.current) {
      const points: { x: number; y: number }[] = line.path.map((c) =>
        projection.containerPointFromCoords(new kakao.maps.LatLng(c.lat, c.lng))
      );
      let walked = 0;
      let next = ARROW_GAP_PX / 2;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        if (length === 0) continue;
        const ux = (b.x - a.x) / length;
        const uy = (b.y - a.y) / length;
        for (; next <= walked + length; next += ARROW_GAP_PX) {
          if (arrowsRef.current.length >= MAX_ARROWS) break;
          const t = next - walked;
          const x = a.x + ux * t;
          const y = a.y + uy * t;
          if (!inView(x, y)) continue;
          const backX = x - ux * ARROW_SIZE_PX;
          const backY = y - uy * ARROW_SIZE_PX;
          const polyline = new kakao.maps.Polyline({
            map,
            path: [
              toCoords(backX - uy * ARROW_SIZE_PX, backY + ux * ARROW_SIZE_PX),
              toCoords(x + ux * ARROW_SIZE_PX, y + uy * ARROW_SIZE_PX),
              toCoords(backX + uy * ARROW_SIZE_PX, backY - ux * ARROW_SIZE_PX),
            ],
            strokeWeight: 1.5,
            strokeColor: ARROW_COLOR,
            strokeOpacity: 1,
            strokeStyle: "solid",
            zIndex: 3,
          });
          bindRouteEvents(polyline, line.group);
          arrowsRef.current.push({
            polyline,
            group: line.group,
            color: ARROW_COLOR,
            opacity: 1,
            zIndex: 3,
          });
        }
        walked += length;
      }
    }
    applyRouteHighlight();
  }, [map, bindRouteEvents, applyRouteHighlight]);

  // 구간 경로선을 그린다. 구간마다 색을 나누고, 지하철·버스·자동차는 어두운 테두리와 흰 화살표가 있는 실선,
  // 도보는 구간 색 원 점선, 길과 경유지 사이는 회색 원 점선, 아직 경로가 없는 구간은 긴 점선이다.
  const renderRouteLines = useCallback(
    (lines: RouteLine[]) => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps || !map) return;

      clearRoutePolyline();

      const styles: Record<RouteLineStyle, LineOption> = {
        solid: { weight: 5, opacity: 1, stroke: "solid" },
        // 카카오는 선 끝을 둥글게 그려서 shortdot이 굵기만 한 원을 간격을 두고 찍는다
        walk: { weight: 4, opacity: 1, stroke: "shortdot" },
        spur: { weight: 4, opacity: 0.85, stroke: "shortdot" },
        pending: { weight: 2, opacity: 0.7, stroke: "longdash" },
      };

      const addLine = (line: RouteLine, option: LineOption, color: string, zIndex: number) => {
        const polyline = new kakao.maps.Polyline({
          map,
          path: line.path.map((c) => new kakao.maps.LatLng(c.lat, c.lng)),
          strokeWeight: option.weight,
          strokeColor: color,
          strokeOpacity: option.opacity,
          strokeStyle: option.stroke,
          zIndex,
        });
        bindRouteEvents(polyline, line.group);
        polylinesRef.current.push({ polyline, group: line.group, color, opacity: option.opacity, zIndex });
      };

      lines.forEach((line) => {
        if (line.path.length < 2) return;
        const option = styles[line.style];
        if (line.style === "solid") {
          // 테두리: 선 색을 어둡게 한 조금 더 굵은 선을 아래에 깐다
          addLine(
            line,
            { ...option, weight: option.weight + 3 },
            mixColor(line.color, "#000000", BORDER_DARKEN),
            1
          );
          arrowLinesRef.current.push(line);
        }
        addLine(line, option, line.color, 2);

        // 투명도가 0이면 이벤트를 받지 않을 수 있어 눈에 띄지 않을 만큼만 남긴다
        const hit = new kakao.maps.Polyline({
          map,
          path: line.path.map((c) => new kakao.maps.LatLng(c.lat, c.lng)),
          strokeWeight: HIT_WEIGHT_PX,
          strokeColor: "#000000",
          strokeOpacity: 0.01,
          strokeStyle: "solid",
          zIndex: HIT_Z_INDEX,
        });
        bindRouteEvents(hit, line.group);
        hitLinesRef.current.push({ polyline: hit, group: line.group });
      });

      // 경유지가 줄어 강조하던 구간이 없어졌으면 강조를 푼다
      const groups = new Set(lines.map((line) => line.group));
      if (pinnedGroupRef.current !== null && !groups.has(pinnedGroupRef.current)) {
        pinnedGroupRef.current = null;
      }
      hoveredGroupRef.current = null;
      drawRouteArrows();
    },
    [map, clearRoutePolyline, bindRouteEvents, drawRouteArrows]
  );

  // 지도를 움직이면 화살표를 다시 찍고, 경로 밖을 누르면 강조를 푼다
  useEffect(() => {
    if (!map) return;
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;

    const handleIdle = () => {
      if (arrowLinesRef.current.length > 0) drawRouteArrows();
    };
    const handleClick = () => {
      // 경로선을 누르면 지도 클릭도 함께 올 수 있어, 방금 경로선을 눌렀다면 무시한다
      setTimeout(() => {
        if (Date.now() - lineClickedAtRef.current < 300) return;
        if (pinnedGroupRef.current === null) return;
        pinnedGroupRef.current = null;
        applyRouteHighlight();
      }, 0);
    };

    kakao.maps.event.addListener(map, "idle", handleIdle);
    kakao.maps.event.addListener(map, "click", handleClick);
    return () => {
      kakao.maps.event.removeListener(map, "idle", handleIdle);
      kakao.maps.event.removeListener(map, "click", handleClick);
    };
  }, [map, drawRouteArrows, applyRouteHighlight]);

  // Transition from Step 1 Summary to Step 2 Full Detail View
  const openDetailFromSummary = useCallback((spot: DateSpot) => {
    setSelectedSpot(spot);
    setSummarySpot(null);
  }, []);

  const closeSummary = useCallback(() => {
    setSummarySpot(null);
  }, []);

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

  // Open "Add Spot" modal at a searched location (address search flow)
  const openAddSpotAt = useCallback(
    (lat: number, lng: number, address?: string) => {
      const coords = { lat, lng };
      setNewSpotLatLng(coords);
      if (address) {
        setCurrentAddress(address);
      } else {
        fetchAddress(lat, lng);
      }

      const kakao = window.kakao;
      if (map && kakao?.maps) {
        map.setLevel(3);
        map.panTo(new kakao.maps.LatLng(lat, lng));
      }
      setIsAddModalOpen(true);
    },
    [map, fetchAddress]
  );

  // Handle map click to place temporary pin & fetch reverse geocoding address
  useEffect(() => {
    if (!map) return;
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;

    let clickListener: any = null;

    clickListener = (mouseEvent: any) => {
      if (!allowMapPin) return;

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
  }, [map, fetchAddress, allowMapPin]);

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

        // 강조색은 --pin-accent 로 빼두고 아래에서 모드에 맞춰 주입한다
        el.innerHTML = `
          <div class="relative flex flex-col items-center pointer-events-auto">
            <div class="w-10 h-10 rounded-full border border-surface shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style="background-color: var(--pin-accent)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-on-accent">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div class="w-1.5 h-1.5 rounded-full -mt-0.5" style="background-color: var(--pin-accent)"></div>
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
        tempElRef.current = el;
      }

      // 추억 기록은 memory, 미래 플래닝은 plan 축을 따르도록 강조색을 갱신한다.
      // 오버레이를 재사용하는 경로에서도 모드 변경이 반영되도록 매번 다시 설정한다.
      tempElRef.current?.style.setProperty(
        "--pin-accent",
        appMode === "planning" ? "var(--plan)" : "var(--memory)"
      );
    } else {
      if (tempOverlayRef.current) {
        tempOverlayRef.current.setMap(null);
        tempOverlayRef.current = null;
      }
      tempElRef.current = null;
    }
  }, [map, newSpotLatLng, appMode]);

  // Clean temp overlay when modal is closed
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setNewSpotLatLng(null);
    setCurrentAddress("");
    if (tempOverlayRef.current) {
      tempOverlayRef.current.setMap(null);
      tempOverlayRef.current = null;
    }
    tempElRef.current = null;
  }, []);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fit map bounds to encompass given coordinate array
  const fitBounds = useCallback(
    (coords: { lat: number; lng: number }[]) => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps || !map || coords.length === 0) return;

      const bounds = new (kakao.maps as any).LatLngBounds();
      coords.forEach((c) => {
        bounds.extend(new kakao.maps.LatLng(c.lat, c.lng));
      });
      map.setBounds(bounds);
    },
    [map]
  );

  // Pan map smooth transition to single coordinate
  const panToSpot = useCallback(
    (lat: number, lng: number) => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps || !map) return;
      map.panTo(new kakao.maps.LatLng(lat, lng));
    },
    [map]
  );

  return {
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
    setIsAddModalOpen,
    newSpotLatLng,
    setNewSpotLatLng,
    currentAddress,
    setCurrentAddress,
    handleStartAddSpot,
    openAddSpotAt,
    closeAddModal,
  };
}
