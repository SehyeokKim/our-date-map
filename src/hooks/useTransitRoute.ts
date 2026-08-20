"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlannedSpot } from "@/types/planner";
import { TransitMode, TransitRouteInfo, TransitRouteResult } from "@/types/transit";
import { getDefaultTransitMode } from "@/lib/transit";

/**
 * 구간(경유지 i → i+1)에 적용할 이동수단.
 * 도착 경유지에 저장된 사용자의 선택이 있으면 그대로 쓰고,
 * 없을 때만 좌표 기반 기본값(수도권이면 지하철)을 쓴다.
 */
export const resolveTransitMode = (from: PlannedSpot, to: PlannedSpot): TransitMode =>
  to.transitMode ?? getDefaultTransitMode(from, to);

export function useTransitRoute(
  plannedSpots: PlannedSpot[],
  savedTransitRoutes?: Record<string, TransitRouteResult> | null
) {
  const [transitRoutes, setTransitRoutes] = useState<Record<string, TransitRouteResult>>({});
  const [loadingTransit, setLoadingTransit] = useState<boolean>(false);
  const cacheRef = useRef<Map<string, TransitRouteInfo>>(new Map());

  const fetchPairTransitRoute = useCallback(
    async (
      fromSpot: PlannedSpot,
      toSpot: PlannedSpot,
      mode: TransitMode
    ): Promise<TransitRouteInfo | null> => {
      // 같은 좌표라도 이동수단이 다르면 다른 경로이므로 캐시 키에 수단을 포함한다
      const key = `${fromSpot.longitude.toFixed(5)},${fromSpot.latitude.toFixed(
        5
      )}->${toSpot.longitude.toFixed(5)},${toSpot.latitude.toFixed(5)}@${mode}`;

      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key) || null;
      }

      try {
        const url = `/api/transit?SX=${fromSpot.longitude}&SY=${fromSpot.latitude}&EX=${toSpot.longitude}&EY=${toSpot.latitude}&mode=${mode}`;
        const res = await fetch(url);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn(`[useTransitRoute] API 오류 (${res.status}):`, errData.error);
          return null;
        }

        const data: TransitRouteInfo = await res.json();
        cacheRef.current.set(key, data);
        return data;
      } catch (err) {
        console.error("[useTransitRoute] Fetch error:", err);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (plannedSpots.length < 2) {
      setTransitRoutes({});
      setLoadingTransit(false);
      return;
    }

    // 저장된 결과를 재사용하려면 모든 구간이 있고, 각 구간의 이동수단도 지금 선택과 같아야 한다.
    // (사용자가 수단을 바꿨는데 예전 경로를 그대로 보여주면 안 되기 때문)
    let hasAllSaved = !!savedTransitRoutes && Object.keys(savedTransitRoutes).length > 0;
    if (hasAllSaved && savedTransitRoutes) {
      for (let i = 0; i < plannedSpots.length - 1; i++) {
        const from = plannedSpots[i];
        const to = plannedSpots[i + 1];
        const saved = savedTransitRoutes[`${from.id}->${to.id}`];
        if (!saved || saved.mode !== resolveTransitMode(from, to)) {
          hasAllSaved = false;
          break;
        }
      }
    }

    if (hasAllSaved && savedTransitRoutes) {
      setTransitRoutes(savedTransitRoutes);
      setLoadingTransit(false);
      return;
    }

    let isMounted = true;

    const loadAllRoutes = async () => {
      setLoadingTransit(true);
      const newRoutes: Record<string, TransitRouteResult> = {};

      for (let i = 0; i < plannedSpots.length - 1; i++) {
        const fromSpot = plannedSpots[i];
        const toSpot = plannedSpots[i + 1];
        const pairKey = `${fromSpot.id}->${toSpot.id}`;
        const mode = resolveTransitMode(fromSpot, toSpot);

        const routeInfo = await fetchPairTransitRoute(fromSpot, toSpot, mode);
        if (isMounted) {
          newRoutes[pairKey] = {
            fromSpotId: fromSpot.id,
            toSpotId: toSpot.id,
            routeInfo,
            mode,
            fallbackApplied: routeInfo?.fallbackApplied,
            error: routeInfo ? null : "경로 탐색 불가 (도보 권장)",
          };
        }
      }

      if (isMounted) {
        setTransitRoutes(newRoutes);
        setLoadingTransit(false);
      }
    };

    loadAllRoutes();

    return () => {
      isMounted = false;
    };
  }, [plannedSpots, savedTransitRoutes, fetchPairTransitRoute]);

  return {
    transitRoutes,
    loadingTransit,
  };
}
