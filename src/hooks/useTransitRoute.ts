"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlannedSpot } from "@/types/planner";
import { TransitRouteInfo, TransitRouteResult } from "@/types/transit";

export function useTransitRoute(plannedSpots: PlannedSpot[]) {
  const [transitRoutes, setTransitRoutes] = useState<Record<string, TransitRouteResult>>({});
  const [loadingTransit, setLoadingTransit] = useState<boolean>(false);
  const cacheRef = useRef<Map<string, TransitRouteInfo>>(new Map());

  const fetchPairTransitRoute = useCallback(
    async (fromSpot: PlannedSpot, toSpot: PlannedSpot): Promise<TransitRouteInfo | null> => {
      const key = `${fromSpot.longitude.toFixed(5)},${fromSpot.latitude.toFixed(5)}->${toSpot.longitude.toFixed(5)},${toSpot.latitude.toFixed(5)}`;

      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key) || null;
      }

      try {
        const url = `/api/transit?SX=${fromSpot.longitude}&SY=${fromSpot.latitude}&EX=${toSpot.longitude}&EY=${toSpot.latitude}`;
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

    let isMounted = true;

    const loadAllRoutes = async () => {
      setLoadingTransit(true);
      const newRoutes: Record<string, TransitRouteResult> = {};

      for (let i = 0; i < plannedSpots.length - 1; i++) {
        const fromSpot = plannedSpots[i];
        const toSpot = plannedSpots[i + 1];
        const pairKey = `${fromSpot.id}->${toSpot.id}`;

        const routeInfo = await fetchPairTransitRoute(fromSpot, toSpot);
        if (isMounted) {
          newRoutes[pairKey] = {
            fromSpotId: fromSpot.id,
            toSpotId: toSpot.id,
            routeInfo,
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
  }, [plannedSpots, fetchPairTransitRoute]);

  return {
    transitRoutes,
    loadingTransit,
  };
}
