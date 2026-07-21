"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Navigation, Heart, Loader2, AlertCircle, X, Calendar } from "lucide-react";
import Script from "next/script";
import { supabase } from "../lib/supabase";
import { uploadCompressedPhoto } from "../lib/upload";

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const userOverlayRef = useRef<any>(null);

  const watchIdRef = useRef<number | null>(null);
  const userCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const isFirstLocationLoadRef = useRef<boolean>(true);

  // Date Spots States
  const [spots, setSpots] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSpotTitle, setNewSpotTitle] = useState("");
  const [newSpotDescription, setNewSpotDescription] = useState("");
  const [newSpotImage, setNewSpotImage] = useState<File | null>(null);
  const [newSpotImagePreview, setNewSpotImagePreview] = useState<string | null>(null);
  const [newSpotLatLng, setNewSpotLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [newSpotDate, setNewSpotDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);

  const overlaysRef = useRef<any[]>([]);
  const tempOverlayRef = useRef<any | null>(null);

  // Show toast message with automatic auto-hide
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Initialize Kakao Maps
  const initKakaoMap = () => {
    const kakao = (window as any).kakao;
    if (!kakao || !kakao.maps) {
      setMapError("카카오 지도 API가 로드되었으나 초기화할 수 없습니다.");
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
      setMapError(null);

      // Start real-time tracking
      startTrackingLocation(mapInstance);
    });
  };

  // Check if already loaded (e.g., client navigation or fast refresh)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).kakao && (window as any).kakao.maps) {
      initKakaoMap();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Load Date Spots when map is ready
  useEffect(() => {
    if (map) {
      loadDateSpots();
    }
  }, [map]);

  // Handle temporary pin and map clicks in add mode
  useEffect(() => {
    if (!map) return;
    const kakao = (window as any).kakao;
    if (!kakao) return;

    let clickListener: any = null;

    if (isAddModalOpen && newSpotLatLng) {
      const latLngObj = new kakao.maps.LatLng(newSpotLatLng.lat, newSpotLatLng.lng);
      
      if (tempOverlayRef.current) {
        tempOverlayRef.current.setPosition(latLngObj);
        tempOverlayRef.current.setMap(map);
      } else {
        const el = document.createElement("div");
        el.className = "animate-bounce";
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="w-9 h-9 rounded-full bg-rose-500 border border-white shadow-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-white">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div class="w-1.5 h-1.5 bg-rose-500 rounded-full -mt-0.5"></div>
          </div>
        `;
        const overlay = new kakao.maps.CustomOverlay({
          position: latLngObj,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 15,
        });
        overlay.setMap(map);
        tempOverlayRef.current = overlay;
      }
      
      map.panTo(latLngObj);

      // Register map click listener to change spot location
      clickListener = (mouseEvent: any) => {
        const clickedLatLng = mouseEvent.latLng;
        setNewSpotLatLng({ lat: clickedLatLng.getLat(), lng: clickedLatLng.getLng() });
      };
      kakao.maps.event.addListener(map, 'click', clickListener);
    } else {
      // Clear temporary pin when modal closes
      if (tempOverlayRef.current) {
        tempOverlayRef.current.setMap(null);
        tempOverlayRef.current = null;
      }
    }

    return () => {
      if (clickListener) {
        kakao.maps.event.removeListener(map, 'click', clickListener);
      }
    };
  }, [map, isAddModalOpen, newSpotLatLng]);

  // Load date spots from Supabase
  const loadDateSpots = async () => {
    try {
      const { data, error } = await supabase
        .from('date_spots')
        .select('*')
        .order('visited_at', { ascending: false });

      if (error) throw error;
      setSpots(data || []);
      renderSpotMarkers(data || []);
    } catch (err) {
      console.error("Failed to load date spots:", err);
      showToast("데이트 기록을 불러오지 못했습니다.", "error");
    }
  };

  // Render date spot markers as custom overlays
  const renderSpotMarkers = (spotsData: any[]) => {
    const kakao = (window as any).kakao;
    if (!kakao || !map) return;

    // Clear existing markers
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    // Create markers for each spot
    spotsData.forEach(spot => {
      const position = new kakao.maps.LatLng(spot.latitude, spot.longitude);
      
      const el = document.createElement("div");
      el.className = "cursor-pointer active:scale-95 transition-transform duration-200";
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="w-9 h-9 rounded-full bg-white border border-rose-100 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-rose-500">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div class="w-1.5 h-1.5 bg-rose-500 rounded-full -mt-0.5 shadow-sm"></div>
        </div>
      `;

      // Clicking a marker opens detail bottom sheet
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering map click events
        setSelectedSpot(spot);
        map.panTo(position);
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: position,
        content: el,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 5,
      });

      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  };

  // Start real-time GPS tracking
  const startTrackingLocation = (mapInstance = map) => {
    if (!mapInstance) return;
    const kakao = (window as any).kakao;
    if (!kakao) return;

    if (!navigator.geolocation) {
      showToast("이 브라우저에서는 위치 서비스를 지원하지 않습니다.", "error");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = { latitude, longitude };
        
        const currentLatLng = new kakao.maps.LatLng(latitude, longitude);

        // Center map on first load
        if (isFirstLocationLoadRef.current) {
          mapInstance.panTo(currentLatLng);
          isFirstLocationLoadRef.current = false;
          showToast("현재 위치를 불러왔습니다.", "success");
        }

        // Draw or update pulsing user marker
        if (userOverlayRef.current) {
          userOverlayRef.current.setPosition(currentLatLng);
          userOverlayRef.current.setMap(mapInstance);
        } else {
          const overlayElement = document.createElement("div");
          overlayElement.className = "custom-user-marker";

          const ping = document.createElement("div");
          ping.className = "ping";
          
          const dot = document.createElement("div");
          dot.className = "dot";
          
          const core = document.createElement("div");
          core.className = "core";

          dot.appendChild(core);
          overlayElement.appendChild(ping);
          overlayElement.appendChild(dot);

          const newOverlay = new kakao.maps.CustomOverlay({
            position: currentLatLng,
            content: overlayElement,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 10,
          });

          newOverlay.setMap(mapInstance);
          userOverlayRef.current = newOverlay;
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (isFirstLocationLoadRef.current) {
          showToast("위치 정보를 가져올 수 없어 기본 위치로 표시합니다.", "info");
          isFirstLocationLoadRef.current = false;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Center map to tracked user location
  const locateUser = () => {
    if (!map) return;
    const kakao = (window as any).kakao;
    if (!kakao) return;

    if (userCoordsRef.current) {
      const { latitude, longitude } = userCoordsRef.current;
      const currentLatLng = new kakao.maps.LatLng(latitude, longitude);
      map.panTo(currentLatLng);
      showToast("현재 위치로 이동했습니다.", "success");
    } else {
      showToast("위치 정보를 불러오는 중입니다...", "info");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          userCoordsRef.current = { latitude, longitude };
          const currentLatLng = new kakao.maps.LatLng(latitude, longitude);
          map.panTo(currentLatLng);
          
          startTrackingLocation(map);
          showToast("현재 위치를 불러왔습니다.", "success");
        },
        (error) => {
          console.error("Geolocation error:", error);
          showToast("위치 정보를 가져올 수 없습니다.", "error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Open "Add Spot" modal and set initial coordinates
  const handleStartAddSpot = () => {
    if (userCoordsRef.current) {
      setNewSpotLatLng({
        lat: userCoordsRef.current.latitude,
        lng: userCoordsRef.current.longitude
      });
    } else if (map) {
      const center = map.getCenter();
      setNewSpotLatLng({
        lat: center.getLat(),
        lng: center.getLng()
      });
    }
    
    setNewSpotTitle("");
    setNewSpotDescription("");
    setNewSpotImage(null);
    setNewSpotImagePreview(null);
    setNewSpotDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  // Image input preview handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewSpotImage(file);
      setNewSpotImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit new spot data to Supabase
  const handleSubmitSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotTitle.trim()) {
      showToast("제목을 입력해 주세요.", "error");
      return;
    }
    if (!newSpotLatLng) {
      showToast("위치 정보가 필요합니다.", "error");
      return;
    }

    setIsUploading(true);
    showToast("데이트 기록을 등록하는 중...", "info");

    try {
      let imageUrl = "";
      
      // Upload image if chosen
      if (newSpotImage) {
        const uploadedUrl = await uploadCompressedPhoto(newSpotImage);
        if (!uploadedUrl) {
          throw new Error("이미지 업로드에 실패했습니다.");
        }
        imageUrl = uploadedUrl;
      }

      // Save to Supabase date_spots table
      const { error } = await supabase.from('date_spots').insert({
        title: newSpotTitle.trim(),
        description: newSpotDescription.trim(),
        latitude: newSpotLatLng.lat,
        longitude: newSpotLatLng.lng,
        image_url: imageUrl,
        visited_at: new Date(newSpotDate).toISOString(),
      });

      if (error) throw error;

      showToast("💖 소중한 추억이 기록되었습니다!", "success");
      setIsAddModalOpen(false);
      
      // Reload spots and markers
      await loadDateSpots();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "데이트 기록 등록 중 오류가 발생했습니다.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // FAB Click Handler
  const handleFabClick = () => {
    handleStartAddSpot();
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

      {/* Elegant Loading & Error Screen */}
      {(loading || mapError) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm px-6 text-center transition-opacity duration-500">
          {mapError ? (
            <div className="max-w-md p-6 bg-red-50 border border-red-100 rounded-2xl shadow-xl shadow-red-500/5 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-red-900 text-base">카카오 지도 로드 실패</h3>
                <p className="text-xs text-red-700 leading-relaxed font-medium">
                  {mapError}
                </p>
              </div>
              <div className="w-full mt-2 pt-4 border-t border-red-200/50 text-left space-y-2">
                <p className="text-[11px] text-gray-600 font-semibold">🔧 해결 방법:</p>
                <ol className="text-[10px] text-gray-500 list-decimal list-inside space-y-1 leading-relaxed">
                  <li>
                    <a 
                      href="https://developers.kakao.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-rose-500 hover:underline font-semibold"
                    >
                      카카오 개발자 센터
                    </a>
                    에 로그인합니다.
                  </li>
                  <li>등록된 애플리케이션의 <span className="font-semibold text-gray-700">플랫폼 &gt; Web</span> 설정으로 이동합니다.</li>
                  <li>사이트 도메인에 현재 접속 주소(<span className="font-semibold text-gray-700 font-mono">http://localhost:3000</span>)가 등록되어 있는지 확인합니다.</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-16 h-16 rounded-full bg-rose-500/10 animate-pulse" />
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700 animate-pulse">지도를 불러오고 있습니다...</p>
            </>
          )}
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
      {/* Add Spot Sheet / Bottom Sheet */}
      {isAddModalOpen && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="absolute inset-0" onClick={() => !isUploading && setIsAddModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-t-[32px] md:rounded-2xl shadow-2xl p-6 z-10 animate-bounce-in max-h-[85vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                데이트 기록 남기기
              </h2>
              <button 
                type="button"
                onClick={() => !isUploading && setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSpot} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">데이트 사진</label>
                {newSpotImagePreview ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden group border border-gray-100">
                    <img 
                      src={newSpotImagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewSpotImage(null);
                          setNewSpotImagePreview(null);
                        }}
                        className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-black/75 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-rose-50/10 hover:border-rose-300 transition-all duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-rose-50/80 flex items-center justify-center border border-rose-100">
                        <Camera className="w-5 h-5 text-rose-500" />
                      </div>
                      <p className="text-xs font-semibold text-gray-500 mt-1">이곳을 눌러 사진 추가</p>
                      <p className="text-[10px] text-gray-400">최대 10MB (자동 압축 업로드)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="title" className="text-xs font-semibold text-gray-500">장소/제목</label>
                <input
                  id="title"
                  type="text"
                  placeholder="어디서 데이트를 하셨나요?"
                  value={newSpotTitle}
                  onChange={(e) => setNewSpotTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 transition-all duration-200 placeholder:text-gray-400 font-medium"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="date" className="text-xs font-semibold text-gray-500">방문 날짜</label>
                <input
                  id="date"
                  type="date"
                  value={newSpotDate}
                  onChange={(e) => setNewSpotDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 transition-all duration-200 font-medium"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-xs font-semibold text-gray-500">데이트 메모</label>
                <textarea
                  id="description"
                  placeholder="이 장소에서의 달콤한 이야기를 적어보세요."
                  value={newSpotDescription}
                  onChange={(e) => setNewSpotDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 transition-all duration-200 placeholder:text-gray-400 font-medium resize-none"
                  disabled={isUploading}
                />
              </div>

              <div className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-rose-800 leading-relaxed font-medium">
                  <p className="font-bold mb-0.5">📍 위치 지정 완료</p>
                  지도를 터치하면 등록할 위치를 바꿀 수 있습니다.
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full mt-2 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-rose-500/20 active:scale-98 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>기록 올리는 중...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-current" />
                    <span>추억 기록하기</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spot Detail Sheet / Bottom Sheet */}
      {selectedSpot && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedSpot(null)} />
          
          <div className="relative w-full max-w-md bg-white rounded-t-[32px] md:rounded-2xl shadow-2xl overflow-hidden z-10 animate-bounce-in max-h-[85vh] flex flex-col">
            {selectedSpot.image_url ? (
              <div className="relative w-full h-64 overflow-hidden">
                <img 
                  src={selectedSpot.image_url} 
                  alt={selectedSpot.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <button
                  onClick={() => setSelectedSpot(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                    <Heart className="w-3 h-3 fill-current" />
                    {new Date(selectedSpot.visited_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\./, '')}
                  </span>
                  <h2 className="text-xl font-bold mt-2 tracking-tight drop-shadow-md">{selectedSpot.title}</h2>
                </div>
              </div>
            ) : (
              <div className="p-6 pb-2 flex items-center justify-between border-b border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full bg-rose-50 text-[10px] text-rose-500 font-bold tracking-wide uppercase border border-rose-100">
                    <Heart className="w-3 h-3 fill-current" />
                    {new Date(selectedSpot.visited_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\./, '')}
                  </span>
                  <h2 className="text-lg font-bold text-gray-800 mt-1">{selectedSpot.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedSpot(null)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-6 pt-4 flex flex-col gap-4 overflow-y-auto max-h-[40vh]">
              {selectedSpot.description ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">우리의 이야기</label>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100/50 whitespace-pre-wrap">
                    {selectedSpot.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6 font-medium italic">작성된 데이트 메모가 없습니다.</p>
              )}

              <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mt-2 pt-4 border-t border-gray-100">
                <span>📍 위도: {selectedSpot.latitude.toFixed(6)}</span>
                <span>경도: {selectedSpot.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Kakao Map SDK Script Loading */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={initKakaoMap}
        onError={() => {
          setMapError("카카오 지도 API 로드에 실패했습니다. (API 키 혹은 플랫폼 도메인 설정을 확인해 주세요)");
          setLoading(false);
        }}
      />
    </main>
  );
}