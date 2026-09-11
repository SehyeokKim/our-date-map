"use client";

import { useState, useCallback } from "react";
import { PlannedSpot, RouteDirectionsResult } from "@/types/planner";
import { requestCarRoute } from "@/lib/directions";

export function useDirections() {
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const fetchRoute = useCallback(async (spots: PlannedSpot[]): Promise<RouteDirectionsResult> => {
    if (spots.length < 2) {
      return { path: [] };
    }

    setLoadingRoute(true);
    setRouteError(null);

    try {
      const { path, distance, duration } = await requestCarRoute(spots);
      setLoadingRoute(false);
      return { path, distance, duration };
    } catch (err) {
      console.warn("Route API error, falling back to straight lines:", err);
      setRouteError("경로 탐색 실패로 직선 경로를 렌더링합니다.");
      setLoadingRoute(false);
      // Fallback straight lines connecting spots
      const fallbackPath = spots.map((s) => ({ lat: s.latitude, lng: s.longitude }));
      return { path: fallbackPath, isFallback: true };
    }
  }, []);

  return {
    fetchRoute,
    loadingRoute,
    routeError,
  };
}
