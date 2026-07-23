"use client";

import { useState, useCallback } from "react";
import { PlannedSpot, RouteDirectionsResult } from "@/types/planner";

export function useDirections() {
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const fetchRoute = useCallback(async (spots: PlannedSpot[]): Promise<RouteDirectionsResult> => {
    if (spots.length < 2) {
      return { path: [] };
    }

    setLoadingRoute(true);
    setRouteError(null);

    const originSpot = spots[0];
    const destinationSpot = spots[spots.length - 1];
    const waypointSpots = spots.slice(1, spots.length - 1);

    const payload = {
      origin: { lng: originSpot.longitude, lat: originSpot.latitude },
      destination: { lng: destinationSpot.longitude, lat: destinationSpot.latitude },
      waypoints: waypointSpots.map((spot) => ({
        lng: spot.longitude,
        lat: spot.latitude,
      })),
    };

    try {
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error (${response.status})`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const path: { lat: number; lng: number }[] = [];
      let totalDistance = 0;
      let totalDuration = 0;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        if (route.summary) {
          totalDistance = route.summary.distance || 0;
          totalDuration = route.summary.duration || 0;
        }

        if (route.sections) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route.sections.forEach((section: any) => {
            if (section.roads) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              section.roads.forEach((road: any) => {
                const vertexes: number[] = road.vertexes;
                for (let i = 0; i < vertexes.length; i += 2) {
                  const lng = vertexes[i];
                  const lat = vertexes[i + 1];
                  path.push({ lat, lng });
                }
              });
            }
          });
        }
      }

      // If Kakao returned path, use it. Otherwise fallback to straight lines.
      if (path.length > 0) {
        setLoadingRoute(false);
        return { path, distance: totalDistance, duration: totalDuration };
      } else {
        // Fallback straight lines
        const fallbackPath = spots.map((s) => ({ lat: s.latitude, lng: s.longitude }));
        setLoadingRoute(false);
        return { path: fallbackPath };
      }
    } catch (err) {
      console.warn("Route API error, falling back to straight lines:", err);
      setRouteError("경로 탐색 실패로 직선 경로를 렌더링합니다.");
      setLoadingRoute(false);
      // Fallback straight lines connecting spots
      const fallbackPath = spots.map((s) => ({ lat: s.latitude, lng: s.longitude }));
      return { path: fallbackPath };
    }
  }, []);

  return {
    fetchRoute,
    loadingRoute,
    routeError,
  };
}
