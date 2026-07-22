export interface DateSpot {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  address: string | null;
  visited_at: string;
  created_at: string;
}

export type CreateDateSpotInput = Omit<DateSpot, "id" | "created_at">;

export interface LatLng {
  lat: number;
  lng: number;
}

export type ToastType = "success" | "error" | "info";

export interface ToastState {
  message: string;
  type: ToastType;
}
