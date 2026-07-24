"use client";

import React, { useState, useRef, useEffect } from "react";
import { Navigation, AlertCircle, Loader2 } from "lucide-react";

interface MapContainerProps {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  mapError: string | null;
  locateUser: () => void;
  handleFabClick: () => void;
  pushEnabled?: boolean;
  onSendInstantPush?: () => void;
  pushLoading?: boolean;
  onOpenCustomPushModal?: () => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapContainerRef,
  loading,
  mapError,
  locateUser,
  handleFabClick,
  pushEnabled = false,
  onSendInstantPush,
  pushLoading = false,
  onOpenCustomPushModal,
}) => {
  const [isPopcatOpen, setIsPopcatOpen] = useState<boolean>(false);
  const [isCooldown, setIsCooldown] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const handleSendPush = async () => {
    if (isCooldown || pushLoading) return;

    setIsCooldown(true);
    setIsPopcatOpen(true);

    if (onSendInstantPush) {
      try {
        await onSendInstantPush();
      } catch (err) {
        console.error("[MapContainer] Error sending push:", err);
      }
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsPopcatOpen(false);
      setIsCooldown(false);
    }, 1000);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onOpenCustomPushModal?.();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleSendPush();
      }, 250);
    }
  };

  return (
    <>
      {/* Loading & Error Screen */}
      {(loading || mapError) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm px-6 text-center transition-opacity duration-500">
          {mapError ? (
            <div className="max-w-md p-6 bg-red-50 border border-red-100 rounded-2xl shadow-xl shadow-red-500/5 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-red-900 text-base">카카오 지도 로드 실패</h3>
                <p className="text-xs text-red-700 leading-relaxed font-medium">{mapError}</p>
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
                  <li>
                    등록된 애플리케이션의 <span className="font-semibold text-gray-700">플랫폼 &gt; Web</span> 설정으로 이동합니다.
                  </li>
                  <li>
                    사이트 도메인에 현재 접속 주소(
                    <span className="font-semibold text-gray-700 font-mono">http://localhost:3000</span>)가 등록되어 있는지 확인합니다.
                  </li>
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

      {/* Map DOM Element */}
      <div
        ref={mapContainerRef}
        id="map"
        className="w-full h-full z-0 transition-opacity duration-300"
        style={{ opacity: loading ? 0 : 1 }}
      />

      {/* Map Floating Control Area (Bottom Right) */}
      {!loading && (
        <div className="absolute bottom-6 right-6 z-10 flex flex-col items-center gap-3">
          {/* Floating Push Send Button (Popcat Animation & Double Click to Open Settings) */}
          {pushEnabled && (
            <button
              type="button"
              onClick={handleClick}
              disabled={isCooldown || pushLoading}
              title="상대방에게 알림 보내기 💌 (더블클릭 하면 설정창 열림)"
              aria-label="상대방에게 알림 전송 (더블클릭 하면 설정창 열림)"
              className="bg-transparent border-none p-0 outline-none transition-transform cursor-pointer flex items-center justify-center drop-shadow-md active:scale-90"
            >
              <img
                src={isPopcatOpen ? "/icons/popcat_open.png" : "/icons/popcat_close.png"}
                alt={isPopcatOpen ? "Popcat Open" : "Popcat Close"}
                className="w-12 h-12 object-contain select-none pointer-events-none"
              />
            </button>
          )}

          {/* GPS Locate Button */}
          <button
            onClick={locateUser}
            className="w-12 h-12 rounded-full bg-white/95 border border-gray-100/50 text-gray-700 flex items-center justify-center shadow-lg shadow-black/5 hover:text-rose-500 hover:border-rose-100 hover:bg-white active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="현재 위치 찾기"
          >
            <Navigation className="w-5 h-5 fill-current" />
          </button>
        </div>
      )}
    </>
  );
};
