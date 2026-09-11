import { PlannedSpot } from "@/types/planner";

/**
 * 코스 경로선(Kakao Mobility)이 어떤 경유지 구성으로 계산됐는지 나타내는 서명.
 * 경로는 경유지의 좌표와 순서로만 결정되므로 둘을 이어 붙인다.
 * 저장된 경로의 서명이 현재 경유지와 다르면 경유지가 추가·삭제·이동된 것이므로 다시 조회해야 한다.
 */
export const getRoutePathKey = (
  spots: Pick<PlannedSpot, "latitude" | "longitude">[]
): string => spots.map((s) => `${s.longitude.toFixed(6)},${s.latitude.toFixed(6)}`).join(";");
