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
  payment: number; // KRW fare
  busTransitCount: number;
  subwayTransitCount: number;
  firstStartStation?: string;
  lastEndStation?: string;
  subpaths: TransitSubPath[];
  polylinePath?: { lat: number; lng: number }[];
  isWalkOnly?: boolean;
  /** 요청한 수단으로 경로가 없어 지하철+버스로 대체 탐색했음을 알린다 */
  fallbackApplied?: boolean;
}

/** 사용자가 구간별로 고르는 이동수단. ODsay searchPubTransPathT의 SearchPathType과 매핑된다. */
export type TransitMode = "subway" | "bus" | "both";

export interface TransitRouteResult {
  fromSpotId: string;
  toSpotId: string;
  routeInfo: TransitRouteInfo | null;
  /** 이 결과를 만들 때 사용한 이동수단 — 사용자가 바꾸면 캐시를 무효화하는 기준 */
  mode?: TransitMode;
  /** 선택한 수단으로 경로가 없어 지하철+버스로 대체 탐색한 경우 */
  fallbackApplied?: boolean;
  error?: string | null;
  loading?: boolean;
}

export interface TransitQueryParams {
  SX: number;
  SY: number;
  EX: number;
  EY: number;
}
