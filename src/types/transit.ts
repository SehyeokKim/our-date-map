export interface TransitSubPath {
  trafficType: 1 | 2 | 3; // 1: Subway, 2: Bus, 3: Walk
  sectionTime: number; // minutes
  distance: number; // meters
  transportName?: string; // e.g. "1호선", "첨단09"
  startName?: string;
  endName?: string;
  passStations?: { lat: number; lng: number }[];
}

export interface TransitRouteInfo {
  totalTime: number; // minutes
  /** 도보를 포함한 총 이동 거리(m). 예전에 저장된 경로에는 없을 수 있다 */
  totalDistance?: number;
  payment: number; // KRW fare
  busTransitCount: number;
  subwayTransitCount: number;
  firstStartStation?: string;
  lastEndStation?: string;
  subpaths: TransitSubPath[];
  polylinePath?: { lat: number; lng: number }[];
  isWalkOnly?: boolean;
}

/** 자동차 구간 — Kakao Mobility 최단 거리 경로 */
export interface CarRouteInfo {
  totalTime: number; // minutes
  totalDistance: number; // meters
}

/**
 * 사용자가 구간별로 고르는 이동수단.
 * - transit: 도보 + 대중교통(지하철·버스 모두) 중 이동 거리가 가장 짧은 경로 (ODsay)
 * - car: 이동 거리가 가장 짧은 자동차 경로 (Kakao Mobility)
 */
export type TransitMode = "transit" | "car";

/** `/api/transit` 응답 — 도보 포함 이동 거리가 가장 짧은 대중교통 경로 하나 */
export interface TransitRouteResponse {
  route: TransitRouteInfo;
}

export interface TransitRouteResult {
  fromSpotId: string;
  toSpotId: string;
  /** 대중교통 구간의 경로 */
  routeInfo: TransitRouteInfo | null;
  /** 자동차 구간의 경로 */
  carRoute?: CarRouteInfo | null;
  /**
   * 이 결과를 만들 때 사용한 이동수단 — 사용자가 바꾸면 다시 조회하는 기준.
   * 예전에 저장된 결과에는 지금은 없는 값("subway" 등)이 들어 있을 수 있다.
   */
  mode?: TransitMode;
  error?: string | null;
  loading?: boolean;
}

export interface TransitQueryParams {
  SX: number;
  SY: number;
  EX: number;
  EY: number;
}
