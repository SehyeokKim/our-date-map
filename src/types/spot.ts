export interface Profile {
  id: string;
  nickname?: string | null;
  profile_image_url?: string | null;
  /** 사용자 식별 태그 (#0000). 닉네임은 바뀔 수 있으므로 사람을 찾을 때는 태그만 쓴다 */
  tag?: string;
  partner_id?: string | null;
  /** 공용 설정(테마·폰트 등)을 함께 쓰는 커플 그룹 */
  couple_id?: string | null;
  updated_at?: string;
  created_at?: string;
}

export interface DateSpot {
  id: string;
  user_id?: string | null;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  image_urls?: string[] | null;
  video_urls?: string[] | null;
  address?: string | null;
  visited_at: string;
  created_at: string;
  deleted_at?: string | null;
  created_by?: string | null;
  profiles?: Profile | null;
}

export interface DeletedDateSpot {
  id: string;
  original_spot_id: string;
  spot_data: DateSpot;
  deleted_by?: string | null;
  deleted_at: string;
  reason?: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}
