export interface LatLngPoint {
  lat: number;
  lng: number;
}

/** 구간 경로를 고르는 탭. 대중교통은 후보가 여러 개, 자동차·도보는 하나다 */
export type RouteMode = "transit" | "car" | "walk";

/** 경로를 이루는 한 단계의 이동 방식. 지도에서 walk는 점선으로 그린다 */
export type RouteStepKind = "subway" | "bus" | "walk" | "car";

export interface RouteStep {
  kind: RouteStepKind;
  duration: number; // seconds
  distance: number; // meters
  /** 노선명 (예: "2호선", "7716"). 같은 구간을 다니는 노선이 여럿이면 첫 번째 */
  name?: string;
  /** 같은 구간에서 대신 탈 수 있는 다른 노선 수 */
  altCount?: number;
  /** 타는 곳 / 내리는 곳 */
  start?: string;
  end?: string;
  /** 지나는 정류장·역 수 (타는 곳 포함) */
  stopCount?: number;
  path?: LatLngPoint[];
  /**
   * 승차 전·하차 후 도보. 카카오 대중교통 응답에는 좌표가 없어 서버가 직선으로 채우고,
   * 경로를 고르면 화면에서 도보 경로 API로 실제 길을 받아 `path`를 바꾼다.
   */
  connector?: boolean;
}

export interface RouteOption {
  mode: RouteMode;
  duration: number; // seconds, 승차 전·하차 후 도보 포함
  distance: number; // meters
  fare?: number; // KRW
  transfers?: number;
  steps: RouteStep[];
}

/** `/api/transit`, `/api/walk` 응답 */
export interface RouteOptionsResponse {
  routes: RouteOption[];
}

/**
 * `route_summary.transitRoutes[from->to]`에 저장되는 구간 경로.
 * 예전 저장분은 `routeInfo`/`carRoute` 형식이라 `route`가 없다 (`readSavedRoute` 참고).
 */
export interface SavedSegmentRoute {
  fromSpotId: string;
  toSpotId: string;
  route: RouteOption;
}

/** 화면에 보여주는 구간 상태 */
export interface SegmentRouteState {
  fromSpotId: string;
  toSpotId: string;
  route: RouteOption | null;
  loading?: boolean;
  error?: string | null;
  /** 출발·도착이 같은 장소라 이동이 없는 구간. 합계에서는 0으로 친다 */
  samePlace?: boolean;
}
