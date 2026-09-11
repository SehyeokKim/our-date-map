import { TransitMode } from "@/types/transit";

export interface PlannedSpot {
  id: string;
  title: string;
  memo?: string;
  latitude: number;
  longitude: number;
  address?: string;
  order: number;
  createdAt: string;
  /**
   * 직전 경유지에서 **이 장소로 오는** 이동수단.
   * 사용자가 고르지 않았으면 undefined이며 대중교통으로 본다 (`resolveTransitMode`).
   * (한 번 고르면 다시 바꾸기 전까지 유지된다)
   */
  transitMode?: TransitMode;
}

export type AppMode = 'memory' | 'planning';

export interface RouteDirectionsResult {
  path: { lat: number; lng: number }[];
  distance?: number; // Total distance in meters
  duration?: number; // Total duration in seconds
  error?: string;
  /** 길찾기 실패로 경유지를 직선으로 이은 임시 경로인지 여부 (저장하지 않는다) */
  isFallback?: boolean;
}

export interface RouteSummaryData {
  distance?: number;
  duration?: number;
  path?: { lat: number; lng: number }[];
  /**
   * `path`를 계산할 때의 경유지 서명 (`getRoutePathKey`).
   * 현재 경유지와 다르면 저장된 경로는 낡은 것이므로 다시 조회한다.
   * 이 값이 없는 예전 저장분도 낡은 것으로 보고 한 번 다시 조회한다.
   */
  pathKey?: string;
  transitRoutes?: Record<string, any>;
}

export interface DatePlan {
  id: string;
  user_id?: string | null;
  created_by?: string | null;
  title: string;
  plan_date: string; // YYYY-MM-DD
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  spots: PlannedSpot[];
  route_summary?: RouteSummaryData | null;
  created_at: string;
  updated_at: string;
}
