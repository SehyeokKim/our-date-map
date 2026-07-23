"use client";

import React, { useState, useRef, useEffect } from "react";
import { Heart, Calendar, ChevronDown, MapPin, Sparkles, LogOut, User as UserIcon, MessageSquare } from "lucide-react";
import { AppMode } from "@/types/planner";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  memoryCount?: number;
  planningCount?: number;
  user?: User | null;
  nickname?: string | null;
  avatarUrl?: string | null;
  onLoginWithKakao?: () => void;
  onLogout?: () => void;
  pushEnabled?: boolean;
  onTogglePush?: () => void;
  pushLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onSelectMode,
  memoryCount = 0,
  planningCount = 0,
  user,
  nickname,
  avatarUrl,
  onLoginWithKakao,
  onLogout,
  pushEnabled = false,
  onTogglePush,
  pushLoading = false,
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

        <div className="flex items-center gap-2">
          {/* Push Notification Toggle (1번 위치) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePush?.();
            }}
            disabled={pushLoading}
            title={pushEnabled ? "웹 푸시 알림 켜짐 (클릭하여 끄기)" : "웹 푸시 알림 꺼짐 (클릭하여 켜기)"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
              pushEnabled
                ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <img
              src={pushEnabled ? "/icons/push-on.svg" : "/icons/push-off.svg"}
              alt={pushEnabled ? "Push ON" : "Push OFF"}
              className="w-4 h-4 object-contain"
            />
            <span className="text-[11px]">
              {pushEnabled ? "ON" : "OFF"}
            </span>
          </button>

          {/* Active User Avatar Preview */}
          {user && avatarUrl && (
            <img
              src={avatarUrl}
              alt={nickname || "사용자 프로필"}
              className="w-7 h-7 rounded-full border border-gray-200 object-cover shadow-sm"
            />
          )}

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-gray-700" : ""
            }`}
          />
        </div>
      </header>

      {/* Interactive Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-white/95 backdrop-blur-md border border-white/70 rounded-2xl shadow-xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
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

          {/* Push Notification Toggle Setting Item inside Dropdown */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50/80 rounded-xl border border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <img
                src={pushEnabled ? "/icons/push-on.svg" : "/icons/push-off.svg"}
                alt="Push Icon"
                className="w-5 h-5 object-contain"
              />
              <div>
                <div className="text-xs font-semibold text-gray-800">웹 푸시 알림 설정</div>
                <div className="text-[10px] text-gray-500">
                  {pushEnabled ? "상대방 데이트 알림 수신 중 🔔" : "푸시 알림 수신 꺼짐 🔕"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onTogglePush}
              disabled={pushLoading}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                pushEnabled
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {pushEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Auth Section: Kakao Login / Profile & Logout */}
          <div className="pt-0.5 px-1">
            {user ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={nickname || "프로필 이미지"}
                      className="w-8 h-8 rounded-full border border-amber-200 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-200/80 flex items-center justify-center text-amber-800 font-bold text-xs">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 truncate">
                      {nickname || "카카오 사용자"}님
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium">
                      작성자 추적 중 📍
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout?.();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-white border border-rose-100 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onLoginWithKakao?.();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 fill-[#191919]" />
                <span>카카오로 3초 로그인 (작성자 기록)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
