import { RouteMode, RouteOption, RouteStep } from "@/types/transit";

export const ROUTE_MODES: RouteMode[] = ["transit", "car", "walk"];

export const ROUTE_MODE_LABEL: Record<RouteMode, string> = {
  transit: "대중교통",
  car: "자동차",
  walk: "도보",
};

/** 대중교통 후보 정렬 기준. recommend는 카카오가 준 순서 그대로다 */
export type TransitSort = "recommend" | "time" | "transfer" | "walk";

export const TRANSIT_SORT_LABEL: Record<TransitSort, string> = {
  recommend: "추천순",
  time: "최소시간",
  transfer: "최소환승",
  walk: "최소도보",
};

/**
 * 지도 경로선·목록 칩·시간 막대가 함께 쓰는 경로 색. 지도 타일은 테마와 상관없이 밝아서 테마 토큰이 아닌 고정 색이다.
 * 지하철과 버스는 색 계열을 나누고, 같은 종류로 갈아타면 다음 색으로 바꿔 환승 지점이 보이게 한다.
 * 도보는 길찾기 앱에서 익숙한 파란 점, 길과 경유지 사이의 짧은 연결(spur)은 회색 점이다.
 * 지도 위에서 튀지 않도록 채도를 낮춘 톤이고, 차량 색은 모두 흰 글자와 4.8:1 이상이다.
 */
export const ROUTE_COLORS = {
  subway: ["#6a52b3", "#2f7c7a"],
  bus: ["#3d7f52", "#ad4778"],
  car: "#434a55",
  walk: "#4f7bd4",
  spur: "#8b929c",
} as const;

/** `steps[index]`의 색. 지하철·버스는 같은 경로 안에서 앞서 탄 같은 종류의 수로 색을 고른다 */
export const stepColor = (steps: RouteStep[], index: number): string => {
  const step = steps[index];
  if (step.kind === "walk") return ROUTE_COLORS.walk;
  if (step.kind === "car") return ROUTE_COLORS.car;
  const palette = ROUTE_COLORS[step.kind];
  const earlier = steps.slice(0, index).filter((s) => s.kind === step.kind).length;
  return palette[earlier % palette.length];
};

export const segmentPairKey = (fromId: string, toId: string) => `${fromId}->${toId}`;

export const walkDistanceOf = (route: RouteOption) =>
  route.steps.reduce((sum, s) => (s.kind === "walk" ? sum + s.distance : sum), 0);

export const sortTransitRoutes = (routes: RouteOption[], sort: TransitSort): RouteOption[] => {
  if (sort === "recommend") return routes;
  const byTime = (a: RouteOption, b: RouteOption) => a.duration - b.duration;
  const compare: Record<Exclude<TransitSort, "recommend">, (a: RouteOption, b: RouteOption) => number> =
    {
      time: byTime,
      transfer: (a, b) => (a.transfers ?? 0) - (b.transfers ?? 0) || byTime(a, b),
      walk: (a, b) => walkDistanceOf(a) - walkDistanceOf(b) || byTime(a, b),
    };
  return [...routes].sort(compare[sort]);
};

/** 같은 경로인지 가리는 서명. 저장된 선택과 후보 목록을 맞춰 볼 때 쓴다 */
export const routeSignature = (route: RouteOption) =>
  [
    route.mode,
    route.duration,
    route.distance,
    ...route.steps.map((s) => `${s.kind}:${s.name ?? ""}:${s.start ?? ""}`),
  ].join("|");

export const formatMinutes = (seconds: number) => {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins}분`;
  const rest = mins % 60;
  return rest ? `${Math.floor(mins / 60)}시간 ${rest}분` : `${Math.floor(mins / 60)}시간`;
};

export const formatMeters = (meters: number) =>
  meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;

/** 차량 단계 이름. 같은 구간에 탈 수 있는 노선이 더 있으면 "외 N"을 붙인다 */
export const stepLabel = (step: RouteStep) => {
  if (step.kind === "walk") return "도보";
  if (step.kind === "car") return "자동차";
  const name = step.name ?? (step.kind === "subway" ? "지하철" : "버스");
  return step.altCount ? `${name} 외 ${step.altCount}` : name;
};

/** 경로 요약 한 줄. 예: "도보 4분 › 2호선 39분 › 도보 1분" */
export const routeStepsSummary = (route: RouteOption) =>
  route.steps.map((s) => `${stepLabel(s)} ${formatMinutes(s.duration)}`).join(" › ");

/* ---------- 저장분 읽기 ---------- */

/** 예전(ODsay 시절) 저장 형식. 분 단위 시간을 쓴다 */
interface LegacySaved {
  mode?: string;
  routeInfo?: {
    totalTime?: number;
    totalDistance?: number;
    payment?: number;
    subpaths?: {
      trafficType?: number;
      sectionTime?: number;
      distance?: number;
      transportName?: string;
      startName?: string;
      endName?: string;
    }[];
  } | null;
  carRoute?: { totalTime?: number; totalDistance?: number } | null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/**
 * `route_summary.transitRoutes`의 한 값을 읽는다.
 * - 새 형식(`{ route }`)은 그대로 돌려준다.
 * - 예전 형식은 지도에 그릴 좌표가 없어 `legacy: true`로 표시한다. 화면에 시간·거리만 보여주고,
 *   편집에 들어가면 같은 수단(`preferredMode`)으로 한 번 새로 조회한다.
 */
export const readSavedRoute = (
  raw: unknown
): { route: RouteOption; legacy: boolean; preferredMode: RouteMode } | null => {
  if (!isRecord(raw)) return null;

  if (isRecord(raw.route) && Array.isArray(raw.route.steps)) {
    const route = raw.route as unknown as RouteOption;
    return { route, legacy: false, preferredMode: route.mode };
  }

  const legacy = raw as LegacySaved;
  if (legacy.mode === "car" && legacy.carRoute) {
    const duration = (legacy.carRoute.totalTime ?? 0) * 60;
    const distance = legacy.carRoute.totalDistance ?? 0;
    return {
      route: { mode: "car", duration, distance, steps: [{ kind: "car", duration, distance }] },
      legacy: true,
      preferredMode: "car",
    };
  }

  if (legacy.routeInfo) {
    const info = legacy.routeInfo;
    const steps: RouteStep[] = (info.subpaths ?? []).map((sp) => ({
      kind: sp.trafficType === 1 ? "subway" : sp.trafficType === 2 ? "bus" : "walk",
      duration: (sp.sectionTime ?? 0) * 60,
      distance: sp.distance ?? 0,
      name: sp.trafficType === 3 ? undefined : sp.transportName,
      start: sp.startName,
      end: sp.endName,
    }));
    const isWalkOnly = steps.every((s) => s.kind === "walk");
    return {
      route: {
        mode: isWalkOnly ? "walk" : "transit",
        duration: (info.totalTime ?? 0) * 60,
        distance: info.totalDistance ?? steps.reduce((sum, s) => sum + s.distance, 0),
        fare: info.payment || undefined,
        steps,
      },
      legacy: true,
      preferredMode: isWalkOnly ? "walk" : "transit",
    };
  }

  return null;
};

/** 지도에 그릴 좌표가 있는 경로인지 */
export const hasRoutePath = (route: RouteOption | null | undefined) =>
  Boolean(route?.steps.some((s) => (s.path?.length ?? 0) >= 2));
