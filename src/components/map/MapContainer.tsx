"use client";

import React from "react";
import { Navigation, Camera, AlertCircle, Loader2 } from "lucide-react";

interface MapContainerProps {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  mapError: string | null;
  locateUser: () => void;
  handleFabClick: () => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapContainerRef,
  loading,
  mapError,
  locateUser,
  handleFabClick,
}) => {
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

      {/* GPS Locate Button */}
      {!loading && (
        <button
          onClick={locateUser}
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
    </>
  );
};
