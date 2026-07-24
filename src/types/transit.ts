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
}

export interface TransitRouteResult {
  fromSpotId: string;
  toSpotId: string;
  routeInfo: TransitRouteInfo | null;
  error?: string | null;
  loading?: boolean;
}

export interface TransitQueryParams {
  SX: number;
  SY: number;
  EX: number;
  EY: number;
}
