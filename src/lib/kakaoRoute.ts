import { LatLngPoint, RouteOption, RouteOptionsResponse, RouteStep } from "@/types/transit";
import { getStraightDistance, thinPath } from "@/lib/route";

/* 카카오맵 경로 API(대중교통·도보) 응답을 우리 형식으로 바꾸는 서버 전용 도우미 */

const KAKAO_ROUTING_BASE = "https://dapi.kakao.com/v2/routing";

/** 도보 속도 (분당 약 67m ≈ 시속 4km). 연결 도보의 시간이 비어 있을 때만 쓴다 */
const WALK_METERS_PER_SEC = 67 / 60;

/** 이보다 짧은 승차 전·하차 후 도보는 단계로 만들지 않는다 */
const MIN_CONNECTOR_M = 20;

/** 카카오 `[x, y]` 좌표 배열을 위경도로 바꾸면서 촘촘한 점을 솎아낸다 */
export const simplifyPoints = (points: number[][] | undefined): LatLngPoint[] =>
  thinPath((points ?? []).map(([x, y]) => ({ lat: y, lng: x })));

/** 성공한 조회 결과만 정해진 시간 동안 보관하는 인메모리 캐시 (좌표 쌍이 키) */
export const createSuccessCache = (ttlMs: number, maxEntries = 500) => {
  const store = new Map<string, { body: RouteOptionsResponse; expiresAt: number }>();
  return {
    read(key: string): RouteOptionsResponse | null {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return hit.body;
    },
    write(key: string, body: RouteOptionsResponse) {
      if (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest) store.delete(oldest);
      }
      store.set(key, { body, expiresAt: Date.now() + ttlMs });
    },
  };
};

/**
 * 카카오 경로 API를 호출한다. 실패는 HTTP 200이 아닌 상태로 오므로 본문을 읽어 메시지를 붙인다.
 * (예: 콘솔에서 카카오맵을 켜지 않았거나 무료 쿼터를 넘긴 경우)
 */
export const fetchKakaoRouting = async (
  kind: "publictraffic" | "walk",
  params: Record<string, string>,
  restApiKey: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${KAKAO_ROUTING_BASE}/${kind}?${query}`, {
    headers: { Authorization: `KakaoAK ${restApiKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`카카오 ${kind} API 오류 (${res.status}) ${body.slice(0, 200)}`);
  }
  return res.json();
};

/** 차량 단계 이름. 급행이면 노선명 뒤에 붙인다 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vehicleName = (vehicle: any): string | undefined => {
  if (!vehicle?.name) return undefined;
  return vehicle.type === "급행" ? `${vehicle.name}(급행)` : vehicle.name;
};

/** 승차 전·하차 후 도보. 카카오 응답에는 단계가 없어서 출발·도착 좌표와 첫·마지막 정류장을 직선으로 잇는다 */
const connectorStep = (
  from: LatLngPoint,
  to: LatLngPoint,
  distance: number,
  duration: number,
  start: string,
  end: string
): RouteStep => ({
  kind: "walk",
  distance: Math.round(distance),
  duration: Math.round(duration || distance / WALK_METERS_PER_SEC),
  start,
  end,
  path: [from, to],
  connector: true,
});

/** 카카오 대중교통 `routes[]`를 후보 목록으로 바꾼다. 응답 순서(카카오 추천순)를 유지한다 */
export const parseTransitRoutes = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes: any[],
  origin: LatLngPoint,
  destination: LatLngPoint
): RouteOption[] =>
  routes.map((route) => {
    const props = route.properties ?? {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steps: RouteStep[] = (route.steps ?? []).map((step: any) => {
      const p = step.properties ?? {};
      const stops: { name?: string }[] = p.stops ?? [];
      const vehicles = p.vehicles ?? [];
      const kind: RouteStep["kind"] =
        p.type === "SUBWAY" ? "subway" : p.type === "BUS" ? "bus" : "walk";
      return {
        kind,
        duration: p.time ?? 0,
        distance: p.distance ?? 0,
        name: kind === "walk" ? undefined : vehicleName(vehicles[0]),
        altCount: vehicles.length > 1 ? vehicles.length - 1 : undefined,
        start: stops[0]?.name,
        end: stops[stops.length - 1]?.name,
        stopCount: kind === "walk" ? undefined : stops.length,
        path: simplifyPoints(step.path?.points),
      };
    });

    const totalDistance: number = props.totalDistance ?? 0;
    const totalDuration: number = props.totalTime ?? 0;

    // 합계에는 들어 있지만 단계로는 빠진 승차 전·하차 후 도보를 직선 거리 비율로 나눠 채운다
    const firstPoint = steps[0]?.path?.[0];
    const lastStepPath = steps[steps.length - 1]?.path;
    const lastPoint = lastStepPath?.[lastStepPath.length - 1];
    if (firstPoint && lastPoint) {
      const leftDistance = Math.max(0, totalDistance - steps.reduce((s, x) => s + x.distance, 0));
      const leftDuration = Math.max(0, totalDuration - steps.reduce((s, x) => s + x.duration, 0));
      const headStraight = getStraightDistance(origin, firstPoint);
      const tailStraight = getStraightDistance(lastPoint, destination);
      const straightSum = headStraight + tailStraight;
      const share = (straight: number) => (straightSum > 0 ? straight / straightSum : 0.5);

      const headDistance = leftDistance > 0 ? leftDistance * share(headStraight) : headStraight;
      const tailDistance = leftDistance > 0 ? leftDistance * share(tailStraight) : tailStraight;

      if (headDistance >= MIN_CONNECTOR_M) {
        steps.unshift(
          connectorStep(
            origin,
            firstPoint,
            headDistance,
            leftDuration * share(headStraight),
            "출발지",
            steps[0].start ?? ""
          )
        );
      }
      if (tailDistance >= MIN_CONNECTOR_M) {
        steps.push(
          connectorStep(
            lastPoint,
            destination,
            tailDistance,
            leftDuration * share(tailStraight),
            steps[steps.length - 1].end ?? "",
            "도착지"
          )
        );
      }
    }

    return {
      mode: "transit",
      duration: totalDuration,
      distance: totalDistance,
      fare: props.fare?.value ?? props.fare?.min,
      transfers: props.transfers ?? 0,
      steps,
    };
  });

/** 카카오 도보 응답(`route.legs[].steps[]`)을 경로 하나로 바꾼다 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseWalkRoute = (route: any): RouteOption => {
  const points: number[][] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (route.legs ?? []).forEach((leg: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (leg.steps ?? []).forEach((step: any) => points.push(...(step.path?.points ?? [])))
  );
  const distance: number = route.properties?.totalDistance ?? 0;
  const duration: number = route.properties?.totalTime ?? 0;
  return {
    mode: "walk",
    duration,
    distance,
    steps: [{ kind: "walk", duration, distance, path: simplifyPoints(points) }],
  };
};

/** `SX/SY/EX/EY` 쿼리를 읽는다. 하나라도 숫자가 아니면 null */
export const readCoordParams = (
  searchParams: URLSearchParams
): { origin: LatLngPoint; destination: LatLngPoint } | null => {
  const raw = ["SX", "SY", "EX", "EY"].map((k) => searchParams.get(k));
  if (raw.some((v) => !v)) return null;
  const [sx, sy, ex, ey] = raw.map(Number);
  if (![sx, sy, ex, ey].every(Number.isFinite)) return null;
  return { origin: { lat: sy, lng: sx }, destination: { lat: ey, lng: ex } };
};
