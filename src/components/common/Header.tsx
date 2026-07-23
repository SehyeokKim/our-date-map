"use client";

import React, { useState, useRef, useEffect } from "react";
import { Heart, Calendar, ChevronDown, MapPin, Sparkles } from "lucide-react";
import { AppMode } from "@/types/planner";

interface HeaderProps {
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  memoryCount?: number;
  planningCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onSelectMode,
  memoryCount = 0,
  planningCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModeChange = (mode: AppMode) => {
    onSelectMode(mode);
    setIsOpen(false);
  };

  return (
    <div ref={headerRef} className="absolute top-4 left-4 right-4 z-30 mx-auto max-w-md">
      {/* Main Header Bar */}
      <header
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl shadow-lg shadow-black/5 px-4 py-3 flex items-center justify-between transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
              appMode === "memory"
                ? "bg-rose-50 border-rose-100 text-rose-500"
                : "bg-violet-50 border-violet-100 text-violet-600"
            }`}
          >
            {appMode === "memory" ? (
              <Heart className="w-4 h-4 fill-rose-500" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-gray-800 text-sm tracking-tight">
                {appMode === "memory" ? "우리들의 데이트 지도" : "미래 데이트 플래닝"}
              </h1>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  appMode === "memory"
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-violet-50 text-violet-600 border-violet-200"
                }`}
              >
                {appMode === "memory" ? "추억 기록" : "코스 플랜"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-tight">
              {appMode === "memory"
                ? "소중한 순간을 지도 위에 기록해요"
                : "앞으로 다녀올 커플 데이터 코스를 계획해요"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-gray-700" : ""}`}
          />
        </div>
      </header>

      {/* Interactive Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-white/95 backdrop-blur-md border border-white/70 rounded-2xl shadow-xl p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-semibold text-gray-400 px-3 pt-1 uppercase tracking-wider">
            모드 선택
          </div>

          {/* Mode 1: Memory Date Map */}
          <button
            onClick={() => handleModeChange("memory")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-left ${
              appMode === "memory"
                ? "bg-rose-50/80 text-rose-700 font-semibold border border-rose-100"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100/70 flex items-center justify-center text-rose-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">추억 데이트 지도</div>
                <div className="text-[10px] text-gray-500">지금까지 함께했던 장소들</div>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-rose-200 text-rose-600 font-medium">
              {memoryCount}개
            </span>
          </button>

          {/* Mode 2: Future Date Planning */}
          <button
            onClick={() => handleModeChange("planning")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-left ${
              appMode === "planning"
                ? "bg-violet-50/80 text-violet-700 font-semibold border border-violet-100"
                : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-100/70 flex items-center justify-center text-violet-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">미래 데이트 플래닝</div>
                <div className="text-[10px] text-gray-500">순서별 코스 세우기 & 길찾기</div>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-violet-200 text-violet-600 font-medium">
              {planningCount}개
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
