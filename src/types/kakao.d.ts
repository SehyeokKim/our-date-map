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
        }) => any;
        event: {
          addListener: (target: any, type: string, handler: (e: any) => void) => void;
          removeListener: (target: any, type: string, handler: (e: any) => void) => void;
        };
      };
    };
  }
}
