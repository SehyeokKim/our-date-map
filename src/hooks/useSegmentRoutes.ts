"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlannedSpot } from "@/types/planner";
import {
  RouteMode,
  RouteOption,
  RouteOptionsResponse,
  SavedSegmentRoute,
  SegmentRouteState,
} from "@/types/transit";
import { readSavedRoute, routeSignature, segmentPairKey } from "@/lib/transit";
import { requestCarRoute } from "@/lib/directions";
import { isSamePlace, thinPath } from "@/lib/route";

/**
 * 실패한 조회는 이 시간 동안 다시 부르지 않는다.
 * 편집 중에는 경유지를 고칠 때마다 전체 구간을 다시 훑는데, 그때마다 같은 실패 구간이
 * API를 재호출하지 않게 하기 위함이다. 시간이 지나면 다음 편집 때 다시 시도한다.
 */
const FAILURE_RETRY_MS = 2 * 60 * 1000;

/** 저장 형식이 바뀌면 올린다. 예전 sessionStorage 값을 새 형식으로 잘못 읽지 않게 한다 */
const SESSION_PREFIX = "route_options_v2";

// 새로고침해도 같은 구간을 다시 부르지 않도록 성공한 결과는 sessionStorage에도 둔다 (API 쿼터 보호)
const readSession = (key: string): RouteOption[] | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RouteOption[]) : null;
  } catch {
    return null;
  }
};

const writeSession = (key: string, value: RouteOption[]) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 없거나 막혀 있어도 메모리 캐시로 동작한다
  }
};

/** 경로 조회에 필요한 좌표만. 경유지뿐 아니라 정류장 좌표로도 조회한다 */
type Coord = Pick<PlannedSpot, "latitude" | "longitude">;

/** 실패는 null, 경로가 없다는 정상 응답은 빈 배열 */
const requestKakaoRoutes = async (
  endpoint: "/api/transit" | "/api/walk",
  from: Coord,
  to: Coord
): Promise<RouteOption[] | null> => {
  try {
    const res = await fetch(
      `${endpoint}?SX=${from.longitude}&SY=${from.latitude}&EX=${to.longitude}&EY=${to.latitude}`
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[useSegmentRoutes] ${endpoint} 오류 (${res.status}):`, errData.error);
      return null;
    }
    const data: RouteOptionsResponse = await res.json();
    return data.routes ?? [];
  } catch (err) {
    console.error(`[useSegmentRoutes] ${endpoint} 요청 실패:`, err);
    return null;
  }
};

/** 이동 거리가 가장 짧은 자동차 경로 (Kakao Mobility). 길이 없으면 빈 배열 */
const requestCar = async (from: Coord, to: Coord): Promise<RouteOption[] | null> => {
  try {
    const { path, distance, duration } = await requestCarRoute([from, to]);
    return [
      {
        mode: "car",
        duration,
        distance,
        steps: [{ kind: "car", duration, distance, path: thinPath(path) }],
      },
    ];
  } catch (err) {
    console.warn("[useSegmentRoutes] 자동차 경로 조회 실패:", err);
    return null;
  }
};

/**
 * 경유지 사이 구간의 경로를 관리한다.
 * - 편집 중(`enabled`)에는 경로가 없는 구간을 자동으로 채운다: 대중교통 추천 1순위, 대중교통이 없으면(근거리) 도보.
 * - 사용자가 후보 목록에서 고르거나(`selectRoute`) 자동으로 채워진 경로는 `onResolve`로 넘겨 `route_summary`에 담는다.
 * - 대중교통 경로는 승차 전·하차 후 도보를 도보 경로 API의 실제 길로 이어 붙인 뒤 담는다.
 * - 조회 모드에서는 API를 부르지 않고 저장된 경로만 보여준다 (일일 쿼터 보호).
 */
export function useSegmentRoutes(
  plannedSpots: PlannedSpot[],
  savedRoutes: Record<string, unknown> | null | undefined,
  enabled: boolean,
  onResolve: (pairKey: string, saved: SavedSegmentRoute) => void
) {
  const [segmentRoutes, setSegmentRoutes] = useState<Record<string, SegmentRouteState>>({});
  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(false);
  // 응답을 기다리는 요청까지 보관해, 같은 구간을 동시에 두 번 부르지 않는다
  const requestsRef = useRef<Map<string, Promise<RouteOption[] | null>>>(new Map());
  const onResolveRef = useRef(onResolve);
  useEffect(() => {
    onResolveRef.current = onResolve;
  }, [onResolve]);

  /** 구간의 후보 경로 목록. 같은 좌표·수단이면 캐시된 결과를 돌려준다 */
  const searchRoutes = useCallback(
    (from: Coord, to: Coord, mode: RouteMode): Promise<RouteOption[] | null> => {
      const key = `${SESSION_PREFIX}_${mode}_${from.longitude.toFixed(5)}_${from.latitude.toFixed(
        5
      )}_${to.longitude.toFixed(5)}_${to.latitude.toFixed(5)}`;

      const known = requestsRef.current.get(key);
      if (known) return known;
      // 같은 장소끼리는 어느 API도 경로를 주지 않으므로 부르지 않는다
      if (isSamePlace(from, to)) return Promise.resolve([]);

      const stored = readSession(key);
      const request = stored
        ? Promise.resolve(stored)
        : (mode === "car"
            ? requestCar(from, to)
            : requestKakaoRoutes(mode === "walk" ? "/api/walk" : "/api/transit", from, to)
          ).then((result) => {
            if (result) writeSession(key, result);
            else setTimeout(() => requestsRef.current.delete(key), FAILURE_RETRY_MS);
            return result;
          });

      requestsRef.current.set(key, request);
      return request;
    },
    []
  );

  /**
   * 대중교통 경로의 승차 전·하차 후 도보(직선)를 도보 경로 API의 실제 길로 바꾼다.
   * 고른 경로에만 하므로 구간당 많아야 2건이고, 실패하면 직선을 그대로 둔다.
   */
  const attachWalkPaths = useCallback(
    async (route: RouteOption): Promise<RouteOption> => {
      if (route.mode !== "transit" || !route.steps.some((s) => s.connector)) return route;
      const steps = await Promise.all(
        route.steps.map(async (step, index) => {
          // 이미 실제 길을 받은 단계는 점이 둘보다 많다
          if (!step.connector || step.path?.length !== 2) return step;
          const [a, b] = step.path;
          const walk = await searchRoutes(
            { latitude: a.lat, longitude: a.lng },
            { latitude: b.lat, longitude: b.lng },
            "walk"
          );
          const walkPath = walk?.[0]?.steps[0]?.path;
          if (!walkPath || walkPath.length < 2) return step;
          // 정류장 쪽 끝만 정류장 좌표에 붙인다. 경유지 쪽 끝(길에서 건물까지)은 지도에서 회색 연결선으로 따로 그린다
          const isHead = index === 0;
          return { ...step, path: isHead ? [...walkPath, b] : [a, ...walkPath] };
        })
      );
      return { ...route, steps };
    },
    [searchRoutes]
  );

  // 사용자가 직접 고른 경로 (구간별 서명). 늦게 끝난 자동 선택이나 도보 보강이 이를 덮어쓰지 않게 한다
  const chosenRef = useRef<Map<string, string>>(new Map());

  /** 목록에서 고른 경로. 바로 반영하고, 도보 길을 받아 오면 한 번 더 반영한다 */
  const selectRoute = useCallback(
    (from: PlannedSpot, to: PlannedSpot, route: RouteOption) => {
      const pairKey = segmentPairKey(from.id, to.id);
      const signature = routeSignature(route);
      chosenRef.current.set(pairKey, signature);
      const save = (r: RouteOption) =>
        onResolveRef.current(pairKey, { fromSpotId: from.id, toSpotId: to.id, route: r });
      save(route);
      attachWalkPaths(route).then((withWalk) => {
        if (withWalk !== route && chosenRef.current.get(pairKey) === signature) save(withWalk);
      });
    },
    [attachWalkPaths]
  );

  /** 고르지 않은 구간의 기본 경로 */
  const pickDefaultRoute = useCallback(
    async (
      from: PlannedSpot,
      to: PlannedSpot,
      preferred: RouteMode
    ): Promise<{ route: RouteOption | null; error?: string }> => {
      if (isSamePlace(from, to)) return { route: null, error: "같은 장소라 이동할 경로가 없어요" };
      if (preferred !== "transit") {
        const routes = await searchRoutes(from, to, preferred);
        if (routes?.[0]) return { route: routes[0] };
      }
      const transit = await searchRoutes(from, to, "transit");
      if (transit === null) return { route: null, error: "경로를 불러오지 못했어요" };
      if (transit[0]) return { route: transit[0] };
      // 가까워서 대중교통 결과가 없는 경우가 대부분이라 도보로 대신한다
      const walk = await searchRoutes(from, to, "walk");
      if (walk?.[0]) return { route: walk[0] };
      return { route: null, error: "추천 경로가 없어요. 눌러서 수단을 골라 보세요" };
    },
    [searchRoutes]
  );

  useEffect(() => {
    if (plannedSpots.length < 2) {
      setSegmentRoutes({});
      setLoadingRoutes(false);
      return;
    }

    const segments = plannedSpots.slice(1).map((toSpot, i) => {
      const fromSpot = plannedSpots[i];
      const pairKey = segmentPairKey(fromSpot.id, toSpot.id);
      return { fromSpot, toSpot, pairKey, saved: readSavedRoute(savedRoutes?.[pairKey]) };
    });

    const next: Record<string, SegmentRouteState> = {};
    const pending: typeof segments = [];
    for (const segment of segments) {
      const { fromSpot, toSpot, pairKey, saved } = segment;
      const base = { fromSpotId: fromSpot.id, toSpotId: toSpot.id };
      if (isSamePlace(fromSpot, toSpot)) {
        // 예전에 저장된 "도보 1분 · 0m" 같은 값도 무시하고 같은 장소로 보여준다
        next[pairKey] = { ...base, route: null, samePlace: true, error: "같은 장소라 이동이 없어요" };
      } else if (!enabled) {
        next[pairKey] = saved
          ? { ...base, route: saved.route }
          : { ...base, route: null, error: "수정을 눌러 경로를 불러오세요" };
      } else if (saved && !saved.legacy) {
        next[pairKey] = { ...base, route: saved.route };
      } else {
        // 예전 형식은 지도에 그릴 좌표가 없으므로 같은 수단으로 한 번 새로 조회한다
        pending.push(segment);
        next[pairKey] = { ...base, route: saved?.route ?? null, loading: true };
      }
    }

    setSegmentRoutes(next);
    if (pending.length === 0) {
      setLoadingRoutes(false);
      return;
    }

    let cancelled = false;
    const loadPending = async () => {
      setLoadingRoutes(true);
      // 한꺼번에 몰리지 않도록 한 구간씩 차례로 조회한다
      for (const { fromSpot, toSpot, pairKey, saved } of pending) {
        const { route, error } = await pickDefaultRoute(
          fromSpot,
          toSpot,
          saved?.preferredMode ?? "transit"
        );
        const withWalk = route ? await attachWalkPaths(route) : null;
        // 경유지나 저장분이 바뀌어 effect가 다시 돌았다면 그쪽이 이어서 처리한다 (요청은 캐시로 공유)
        if (cancelled) return;
        // 기다리는 사이 사용자가 목록에서 직접 골랐다면 그 선택을 둔다
        if (chosenRef.current.has(pairKey)) continue;
        if (withWalk) {
          onResolveRef.current(pairKey, {
            fromSpotId: fromSpot.id,
            toSpotId: toSpot.id,
            route: withWalk,
          });
        } else {
          // 예전 저장분이 있으면 시간·거리라도 계속 보여준다
          setSegmentRoutes((prev) => ({
            ...prev,
            [pairKey]: {
              fromSpotId: fromSpot.id,
              toSpotId: toSpot.id,
              route: saved?.route ?? null,
              error,
            },
          }));
        }
      }
      setLoadingRoutes(false);
    };

    loadPending();

    return () => {
      cancelled = true;
    };
  }, [plannedSpots, savedRoutes, enabled, pickDefaultRoute, attachWalkPaths]);

  return {
    segmentRoutes,
    loadingRoutes,
    searchRoutes,
    selectRoute,
  };
}
