"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Navigation, Heart, Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const userOverlayRef = useRef<any>(null);

  // Show toast message with automatic auto-hide
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Initialize Kakao Maps
  useEffect(() => {
    const initKakaoMap = () => {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps) {
        showToast("카카오 지도 API를 불러오지 못했습니다.", "error");
        setLoading(false);
        return;
      }

      kakao.maps.load(() => {
        if (!mapContainerRef.current) return;

        // Default center: Namsan Seoul Tower (37.551172, 126.988226)
        const defaultLatLng = new kakao.maps.LatLng(37.551172, 126.988226);
        const mapOptions = {
          center: defaultLatLng,
          level: 3,
        };

        const mapInstance = new kakao.maps.Map(mapContainerRef.current, mapOptions);
        setMap(mapInstance);
        setLoading(false);

        // Fetch location immediately
        locateUser(mapInstance);
      });
    };

    // Ensure API is loaded from global window
    if (typeof window !== "undefined") {
      if ((window as any).kakao && (window as any).kakao.maps) {
        initKakaoMap();
      } else {
        const interval = setInterval(() => {
          if ((window as any).kakao && (window as any).kakao.maps) {
            clearInterval(interval);
            initKakaoMap();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, []);

  // Fetch current user location and pan map
  const locateUser = (mapInstance = map) => {
    if (!mapInstance) return;
    const kakao = (window as any).kakao;
    if (!kakao) return;

    if (!navigator.geolocation) {
      showToast("이 브라우저에서는 위치 서비스를 지원하지 않습니다.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLatLng = new kakao.maps.LatLng(latitude, longitude);

        // Pan to user's location
        mapInstance.panTo(currentLatLng);

        // Clear existing current location marker
        if (userOverlayRef.current) {
          userOverlayRef.current.setMap(null);
        }

        // Create elegant custom pulsing marker container
        const overlayElement = document.createElement("div");
        overlayElement.className = "relative flex items-center justify-center w-10 h-10 pointer-events-none";

        // Outer pulsing ring
        const outerPing = document.createElement("div");
        outerPing.className = "absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping opacity-75";
        
        // Inner circle
        const innerCircle = document.createElement("div");
        innerCircle.className = "relative w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg shadow-rose-500/50 flex items-center justify-center";
        
        // Central white core dot
        const centerDot = document.createElement("div");
        centerDot.className = "w-1.5 h-1.5 rounded-full bg-white";

        innerCircle.appendChild(centerDot);
        overlayElement.appendChild(outerPing);
        overlayElement.appendChild(innerCircle);

        const newOverlay = new kakao.maps.CustomOverlay({
          position: currentLatLng,
          content: overlayElement,
          xAnchor: 0.5,
          yAnchor: 0.5,
        });

        newOverlay.setMap(mapInstance);
        userOverlayRef.current = newOverlay;

        showToast("현재 위치를 불러왔습니다.", "success");
      },
      (error) => {
        console.error("Geolocation error:", error);
        showToast("위치 정보를 가져올 수 없어 기본 위치로 표시합니다.", "info");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // FAB Click Handler
  const handleFabClick = () => {
    showToast("📸 데이트 사진 올리기 기능이 곧 구현됩니다!", "success");
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-50">
      {/* Premium Glassmorphic Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-10 mx-auto max-w-md bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-lg shadow-black/5 px-5 py-3.5 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-50/80 flex items-center justify-center border border-rose-100">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm tracking-tight">우리들의 데이트 지도</h1>
            <p className="text-[10px] text-gray-500 leading-tight">소중한 순간을 지도 위에 기록해요</p>
          </div>
        </div>
      </header>

      {/* Elegant Loading Screen */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-500">
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute w-16 h-16 rounded-full bg-rose-500/10 animate-pulse" />
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-700 animate-pulse">지도를 불러오고 있습니다...</p>
        </div>
      )}

      {/* Modern Slide-in/Bounce Toast Notifications */}
      {toast && (
        <div className="absolute top-20 left-4 right-4 z-50 mx-auto max-w-sm flex justify-center animate-bounce-in">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-all duration-300 ${
            toast.type === "success" 
              ? "bg-rose-50/95 border-rose-100 text-rose-600 shadow-rose-500/10" 
              : toast.type === "error"
              ? "bg-amber-50/95 border-amber-100 text-amber-600 shadow-amber-500/10"
              : "bg-white/95 border-gray-100 text-gray-600"
          }`}>
            {toast.type === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <Heart className={`w-3.5 h-3.5 flex-shrink-0 ${toast.type === "success" ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        id="map" 
        className="w-full h-full z-0 transition-opacity duration-300"
        style={{ opacity: loading ? 0 : 1 }}
      />

      {/* GPS Locate Button */}
      {!loading && (
        <button
          onClick={() => locateUser()}
          className="absolute bottom-24 right-6 z-10 w-12 h-12 rounded-full bg-white/95 border border-gray-100/50 text-gray-700 flex items-center justify-center shadow-lg shadow-black/5 hover:text-rose-500 hover:border-rose-100 hover:bg-white active:scale-95 transition-all duration-200 cursor-pointer"
          aria-label="현재 위치 찾기"
        >
          <Navigation className="w-5 h-5 fill-current" />
        </button>
      )}

      {/* Floating Action Button (FAB) */}
      {!loading && (
        <button
          onClick={handleFabClick}
          className="group absolute bottom-6 right-6 z-10 flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium text-sm tracking-wide shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out border border-rose-400/20 cursor-pointer"
        >
          <Camera className="w-5 h-5 transition-transform group-hover:rotate-12 duration-300" />
          <span>데이트 사진 올리기</span>
        </button>
      )}
    </main>
  );
}