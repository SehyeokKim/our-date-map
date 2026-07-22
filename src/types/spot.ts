export interface DateSpot {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  image_urls?: string[];
  address?: string;
  visited_at: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}
