"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlannedSpot } from "@/types/planner";
import { TransitMode, TransitRouteResponse, TransitRouteResult } from "@/types/transit";
import { resolveTransitMode } from "@/lib/transit";
import { requestCarRoute } from "@/lib/directions";

/** 한 구간의 조회 결과 — 대중교통이면 routeInfo, 자동차면 carRoute만 채워진다 */
type SegmentRoute = Pick<TransitRouteResult, "routeInfo" | "carRoute">;

/**
 * 실패한 구간은 이 시간 동안 다시 부르지 않는다.
 * 편집 중에는 경유지를 고칠 때마다 전체 구간을 다시 훑는데, 그때마다 같은 실패 구간이
 * ODsay를 재호출하지 않게 하기 위함이다. 시간이 지나면 다음 편집 때 다시 시도한다.
 */
const FAILURE_RETRY_MS = 2 * 60 * 1000;

const hasRoute = (r?: TransitRouteResult | null): boolean => Boolean(r?.routeInfo || r?.carRoute);

// 새로고침해도 같은 구간을 다시 부르지 않도록 성공한 결과는 sessionStorage에도 둔다 (API 쿼터 보호)
const readSession = (key: string): SegmentRoute | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SegmentRoute) : null;
  } catch {
    return null;
  }
};

const writeSession = (key: string, value: SegmentRoute) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 없거나 막혀 있어도 메모리 캐시로 동작한다
  }
};

/** 도보 + 대중교통 중 이동 거리가 가장 짧은 경로 (ODsay) */
const requestTransit = async (from: PlannedSpot, to: PlannedSpot): Promise<SegmentRoute | null> => {
  try {
    const res = await fetch(
      `/api/transit?SX=${from.longitude}&SY=${from.latitude}&EX=${to.longitude}&EY=${to.latitude}`
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[useTransitRoute] API 오류 (${res.status}):`, errData.error);
      return null;
    }
    const data: TransitRouteResponse = await res.json();
    return data?.route ? { routeInfo: data.route } : null;
  } catch (err) {
    console.error("[useTransitRoute] Fetch error:", err);
    return null;
  }
};

/** 이동 거리가 가장 짧은 자동차 경로 (Kakao Mobility) */
const requestCar = async (from: PlannedSpot, to: PlannedSpot): Promise<SegmentRoute | null> => {
  try {
    const { distance, duration } = await requestCarRoute([from, to]);
    return {
      routeInfo: null,
      carRoute: { totalDistance: distance, totalTime: Math.max(1, Math.round(duration / 60)) },
    };
  } catch (err) {
    console.warn("[useTransitRoute] 자동차 경로 조회 실패:", err);
    return null;
  }
};

export function useTransitRoute(
  plannedSpots: PlannedSpot[],
  savedTransitRoutes?: Record<string, TransitRouteResult> | null,
  /**
   * API를 실제로 호출할지 여부. 경유지를 등록·수정하는 동안에만 true로 두고,
   * 단순 조회일 때는 저장된 결과만 보여준다 (일일 쿼터 보호).
   */
  enabled: boolean = true
) {
  const [transitRoutes, setTransitRoutes] = useState<Record<string, TransitRouteResult>>({});
  const [loadingTransit, setLoadingTransit] = useState<boolean>(false);
  // 응답을 기다리는 요청까지 보관해, 같은 구간을 동시에 두 번 부르지 않는다
  const requestsRef = useRef<Map<string, Promise<SegmentRoute | null>>>(new Map());

  const fetchSegmentRoute = useCallback(
    (fromSpot: PlannedSpot, toSpot: PlannedSpot, mode: TransitMode): Promise<SegmentRoute | null> => {
      // 같은 좌표라도 이동수단이 다르면 다른 경로이므로 캐시 키에 수단을 포함한다
      const key = `route_${mode}_${fromSpot.longitude.toFixed(5)}_${fromSpot.latitude.toFixed(
        5
      )}_${toSpot.longitude.toFixed(5)}_${toSpot.latitude.toFixed(5)}`;

      const known = requestsRef.current.get(key);
      if (known) return known;

      const stored = readSession(key);
      const request = stored
        ? Promise.resolve(stored)
        : (mode === "car" ? requestCar(fromSpot, toSpot) : requestTransit(fromSpot, toSpot)).then(
            (result) => {
              if (result) writeSession(key, result);
              else setTimeout(() => requestsRef.current.delete(key), FAILURE_RETRY_MS);
              return result;
            }
          );

      requestsRef.current.set(key, request);
      return request;
    },
    []
  );

  useEffect(() => {
    if (plannedSpots.length < 2) {
      setTransitRoutes({});
      setLoadingTransit(false);
      return;
    }

    const segments = plannedSpots.slice(1).map((toSpot, i) => {
      const fromSpot = plannedSpots[i];
      return {
        fromSpot,
        toSpot,
        pairKey: `${fromSpot.id}->${toSpot.id}`,
        mode: resolveTransitMode(toSpot),
      };
    });

    // 조회 모드에서는 절대 API를 부르지 않고, 저장해 둔 결과만 그대로 보여준다.
    if (!enabled) {
      const viewRoutes: Record<string, TransitRouteResult> = {};
      for (const { fromSpot, toSpot, pairKey } of segments) {
        viewRoutes[pairKey] = savedTransitRoutes?.[pairKey] ?? {
          fromSpotId: fromSpot.id,
          toSpotId: toSpot.id,
          routeInfo: null,
          error: "수정을 눌러 경로를 불러오세요",
        };
      }
      setTransitRoutes(viewRoutes);
      setLoadingTransit(false);
      return;
    }

    // 저장된 결과는 구간마다 따로 재사용한다. 이동수단이 같고 경로가 있으면 그대로 쓰고,
    // 없거나 수단이 바뀐 구간만 새로 조회한다. (경유지 좌표는 바뀌지 않으므로 id 쌍이 같으면 같은 구간)
    const nextRoutes: Record<string, TransitRouteResult> = {};
    const pending: typeof segments = [];
    for (const segment of segments) {
      const saved = savedTransitRoutes?.[segment.pairKey];
      if (saved && saved.mode === segment.mode && hasRoute(saved)) {
        nextRoutes[segment.pairKey] = saved;
      } else {
        pending.push(segment);
        nextRoutes[segment.pairKey] = {
          fromSpotId: segment.fromSpot.id,
          toSpotId: segment.toSpot.id,
          routeInfo: null,
          mode: segment.mode,
          loading: true,
        };
      }
    }

    setTransitRoutes(nextRoutes);
    if (pending.length === 0) {
      setLoadingTransit(false);
      return;
    }

    let isMounted = true;

    const loadPendingRoutes = async () => {
      setLoadingTransit(true);
      const loaded = { ...nextRoutes };

      // 한꺼번에 몰리지 않도록 한 구간씩 차례로 조회한다
      for (const { fromSpot, toSpot, pairKey, mode } of pending) {
        const data = await fetchSegmentRoute(fromSpot, toSpot, mode);
        if (!isMounted) return;

        loaded[pairKey] = {
          fromSpotId: fromSpot.id,
          toSpotId: toSpot.id,
          routeInfo: data?.routeInfo ?? null,
          carRoute: data?.carRoute ?? null,
          mode,
          error: data ? null : mode === "car" ? "자동차 경로 탐색 불가" : "경로 탐색 불가 (도보 권장)",
        };
      }

      setTransitRoutes(loaded);
      setLoadingTransit(false);
    };

    loadPendingRoutes();

    return () => {
      isMounted = false;
    };
  }, [plannedSpots, savedTransitRoutes, fetchSegmentRoute, enabled]);

  return {
    transitRoutes,
    loadingTransit,
  };
}
