import { PlannedSpot } from "@/types/planner";
import { RouteOption } from "@/types/transit";

/**
 * 코스 경로선(Kakao Mobility)이 어떤 경유지 구성으로 계산됐는지 나타내는 서명.
 * 경로는 경유지의 좌표와 순서로만 결정되므로 둘을 이어 붙인다.
 * 저장된 경로의 서명이 현재 경유지와 다르면 경유지가 추가·삭제·이동된 것이므로 다시 조회해야 한다.
 */
export const getRoutePathKey = (
  spots: Pick<PlannedSpot, "latitude" | "longitude">[]
): string => spots.map((s) => `${s.longitude.toFixed(6)},${s.latitude.toFixed(6)}`).join(";");

/** 두 좌표 사이의 직선 거리(m) — 하버사인 공식 */
export const getStraightDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/**
 * 저장 크기를 줄이려고 좌표를 소수 5자리(약 1m)로 줄이고, `minGapMeters`보다 가까운 연속점은 버린다.
 * 끝점은 항상 남긴다. 구간 경로는 `route_summary` JSONB에 그대로 저장되기 때문이다.
 */
export const thinPath = (
  points: { lat: number; lng: number }[],
  minGapMeters = 5
): { lat: number; lng: number }[] => {
  const out: { lat: number; lng: number }[] = [];
  points.forEach((point, i) => {
    const p = { lat: round5(point.lat), lng: round5(point.lng) };
    const last = out[out.length - 1];
    if (!last || i === points.length - 1 || getStraightDistance(last, p) >= minGapMeters) out.push(p);
  });
  return out;
};

/** 지도 경로선 모양. vehicle(지하철·버스)·car는 실선, walk는 점선, pending은 경로가 아직 없는 구간 */
export type RouteLineStyle = "vehicle" | "car" | "walk" | "pending";

export interface RouteLine {
  path: { lat: number; lng: number }[];
  style: RouteLineStyle;
}

/**
 * 구간마다 고른 경로를 지도에 그릴 선 목록으로 바꾼다.
 * 좌표가 없는 구간(아직 조회 전, 예전 저장분)은 두 경유지를 흐린 직선으로 잇는다.
 */
export const buildRouteLines = (
  spots: Pick<PlannedSpot, "id" | "latitude" | "longitude">[],
  routeOf: (fromId: string, toId: string) => RouteOption | null | undefined
): RouteLine[] =>
  spots.slice(1).flatMap((to, i) => {
    const from = spots[i];
    const stepLines: RouteLine[] = (routeOf(from.id, to.id)?.steps ?? [])
      .filter((s) => (s.path?.length ?? 0) >= 2)
      .map((s) => ({
        path: s.path!,
        style: s.kind === "walk" ? "walk" : s.kind === "car" ? "car" : "vehicle",
      }));
    if (stepLines.length > 0) return stepLines;
    return [
      {
        path: [
          { lat: from.latitude, lng: from.longitude },
          { lat: to.latitude, lng: to.longitude },
        ],
        style: "pending",
      },
    ];
  });
