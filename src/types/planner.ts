export interface PlannedSpot {
  id: string;
  title: string;
  memo?: string;
  latitude: number;
  longitude: number;
  address?: string;
  order: number;
  createdAt: string;
}

export type AppMode = 'memory' | 'planning';

export interface RouteDirectionsResult {
  path: { lat: number; lng: number }[];
  distance?: number; // Total distance in meters
  duration?: number; // Total duration in seconds
  error?: string;
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
  route_summary?: {
    distance?: number;
    duration?: number;
  } | null;
  created_at: string;
  updated_at: string;
}
