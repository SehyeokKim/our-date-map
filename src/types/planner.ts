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
   * 여러 날짜 플랜에서 이 경유지를 방문하는 날 (`YYYY-MM-DD`).
   * 없으면 앞 경유지의 날짜를 따른다 (`resolveSpotDates`).
   */
  date?: string;
}

export type AppMode = 'memory' | 'planning';

export interface RouteSummaryData {
  /**
   * 예전 플랜에 저장된 코스 전체 자동차 경로(거리·시간·선). 이제 새로 만들지 않고,
   * 구간 경로가 하나도 없는 예전 플랜을 열었을 때 지도에 그리는 용도로만 읽는다.
   */
  distance?: number;
  duration?: number;
  path?: { lat: number; lng: number }[];
  /** `path`를 계산할 때의 경유지 서명 (`getRoutePathKey`). 지금 경유지와 같을 때만 `path`를 그린다 */
  pathKey?: string;
  /**
   * 구간별 선택 경로 (`"출발 id->도착 id"` 키). 새 형식은 `SavedSegmentRoute`이고,
   * 예전 저장분은 ODsay 시절 형식이 섞여 있을 수 있어 읽을 때 `readSavedRoute`로 거른다.
   */
  transitRoutes?: Record<string, unknown>;
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
