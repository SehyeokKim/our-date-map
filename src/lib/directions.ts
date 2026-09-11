import { PlannedSpot } from "@/types/planner";

export interface CarRouteData {
  path: { lat: number; lng: number }[];
  distance: number; // meters
  duration: number; // seconds
}

/**
 * `/api/directions`(Kakao Mobility, 최단 거리)로 자동차 경로를 조회한다.
 * 첫 장소가 출발지, 마지막 장소가 도착지, 사이는 경유지다.
 * 요청이 실패하거나 경로가 비어 있으면 예외를 던진다.
 */
export async function requestCarRoute(
  spots: Pick<PlannedSpot, "latitude" | "longitude">[]
): Promise<CarRouteData> {
  const originSpot = spots[0];
  const destinationSpot = spots[spots.length - 1];
  const waypointSpots = spots.slice(1, spots.length - 1);

  const response = await fetch("/api/directions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: { lng: originSpot.longitude, lat: originSpot.latitude },
      destination: { lng: destinationSpot.longitude, lat: destinationSpot.latitude },
      waypoints: waypointSpots.map((spot) => ({ lng: spot.longitude, lat: spot.latitude })),
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  const route = data.routes?.[0];
  const path: { lat: number; lng: number }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route?.sections?.forEach((section: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    section.roads?.forEach((road: any) => {
      const vertexes: number[] = road.vertexes;
      for (let i = 0; i < vertexes.length; i += 2) {
        path.push({ lat: vertexes[i + 1], lng: vertexes[i] });
      }
    });
  });

  // 출발·도착이 너무 가깝거나 길이 없으면(result_code ≠ 0) sections 없이 온다
  if (path.length === 0) {
    throw new Error(route?.result_msg || "자동차 경로가 없습니다.");
  }

  return {
    path,
    distance: route.summary?.distance || 0,
    duration: route.summary?.duration || 0,
  };
}
