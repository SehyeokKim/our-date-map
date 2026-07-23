/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => any;
        Map: new (container: HTMLElement, options: { center: any; level: number }) => any;
        CustomOverlay: new (options: {
          position: any;
          content: HTMLElement | string;
          xAnchor?: number;
          yAnchor?: number;
          zIndex?: number;
          clickable?: boolean;
        }) => any;
        Polyline: new (options: {
          map?: any;
          path: any[];
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          strokeStyle?: string;
        }) => any;
        event: {
          addListener: (target: any, type: string, handler: (e: any) => void) => void;
          removeListener: (target: any, type: string, handler: (e: any) => void) => void;
        };
        services: {
          Geocoder: new () => {
            coord2Address: (
              lng: number,
              lat: number,
              callback: (result: any[], status: string) => void
            ) => void;
          };
          Status: {
            OK: string;
          };
        };
      };
    };
  }
}
