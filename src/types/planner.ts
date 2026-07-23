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
