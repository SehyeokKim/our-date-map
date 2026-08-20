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
   * 사용자가 고르지 않았으면 undefined이며, 이때만 좌표 기반 기본값이 쓰인다.
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
}

export interface RouteSummaryData {
  distance?: number;
  duration?: number;
  path?: { lat: number; lng: number }[];
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
