export interface Profile {
  id: string;
  nickname?: string | null;
  profile_image_url?: string | null;
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
  address?: string | null;
  visited_at: string;
  created_at: string;
  deleted_at?: string | null;
  created_by?: string | null;
  profiles?: Profile | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}
