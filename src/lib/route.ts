import { PlannedSpot } from "@/types/planner";

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
