"use client";

import React, { useState, useRef, useEffect } from "react";
import { Heart, Calendar, ChevronDown, MapPin, Sparkles, MessageSquare } from "lucide-react";
import { AppMode } from "@/types/planner";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  memoryCount?: number;
  planningCount?: number;
  user?: User | null;
  onLoginWithKakao?: () => void;
  pushEnabled?: boolean;
  onTogglePush?: () => void;
  pushLoading?: boolean;
  onOpenCustomPushModal?: () => void;
  onOpenScheduleModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onSelectMode,
  memoryCount = 0,
  planningCount = 0,
  user,
  onLoginWithKakao,
  pushEnabled = false,
  onTogglePush,
  pushLoading = false,
  onOpenCustomPushModal,
  onOpenScheduleModal,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const handlePopcatClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onOpenCustomPushModal?.();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        onTogglePush?.();
      }, 250);
    }
  };

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
    <div ref={headerRef} className="absolute top-4 left-6 right-6 z-30 mx-auto max-w-md">
      {/* Main Header Bar */}
      <header
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-surface/90 backdrop-blur-md border border-line/70 rounded-2xl shadow-[var(--shadow-card)] px-4 py-3 flex items-center justify-between transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
              appMode === "memory"
                ? "bg-memory-tint border-memory-line text-memory"
                : "bg-plan-tint border-plan-line text-plan"
            }`}
          >
            {appMode === "memory" ? (
              <Heart className="w-4 h-4 fill-memory" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-ink text-sm tracking-tight">
                {appMode === "memory" ? "우리들의 데이트 지도" : "미래 데이트 플래닝"}
              </h1>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  appMode === "memory"
                    ? "bg-memory-tint text-memory border-memory-line"
                    : "bg-plan-tint text-plan border-plan-line"
                }`}
              >
                {appMode === "memory" ? "추억 기록" : "코스 플랜"}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted leading-tight">
              {appMode === "memory"
                ? "소중한 순간을 지도 위에 기록해요"
                : "앞으로 다녀올 커플 데이터 코스를 계획해요"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Web Push Notification Popcat Toggle (Double Click to Open Settings) */}
          {user && (
            <button
              type="button"
              onClick={handlePopcatClick}
              disabled={pushLoading}
              title={
                pushEnabled
                  ? "웹 푸시 알림 켜짐 (더블클릭 하면 설정창 열림)"
                  : "웹 푸시 알림 꺼짐 (더블클릭 하면 설정창 열림)"
              }
              aria-label={pushEnabled ? "웹 푸시 알림 끄기" : "웹 푸시 알림 켜기"}
              className="border-none bg-transparent outline-none p-0 cursor-pointer transition-transform flex items-center justify-center relative active:scale-95"
            >
              <img
                src={pushEnabled ? "/icons/popcat_open.png" : "/icons/popcat_close.png"}
                alt={pushEnabled ? "Push ON" : "Push OFF"}
                className="w-7 h-7 object-contain select-none pointer-events-none"
              />
              {pushEnabled && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-memory rounded-full border border-surface" />
              )}
            </button>
          )}

          <ChevronDown
            className={`w-4 h-4 text-ink-subtle transition-transform duration-300 ${
              isOpen ? "rotate-180 text-ink" : ""
            }`}
          />
        </div>
      </header>

      {/* Interactive Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-surface/95 backdrop-blur-md border border-line/70 rounded-2xl shadow-[var(--shadow-sheet)] p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-semibold text-ink-subtle px-3 pt-1 uppercase tracking-wider">
            모드 선택
          </div>

          {/* Mode 1: Memory Date Map */}
          <button
            onClick={() => handleModeChange("memory")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-left ${
              appMode === "memory"
                ? "bg-memory-tint text-memory-strong font-semibold border border-memory-line"
                : "hover:bg-surface-2 text-ink-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-memory-tint flex items-center justify-center text-memory">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">추억 데이트 지도</div>
                <div className="text-[10px] text-ink-muted">지금까지 함께했던 장소들</div>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-memory-line text-memory font-medium">
              {memoryCount}개
            </span>
          </button>

          {/* Mode 2: Future Date Planning */}
          <button
            onClick={() => handleModeChange("planning")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-left ${
              appMode === "planning"
                ? "bg-plan-tint text-plan-strong font-semibold border border-plan-line"
                : "hover:bg-surface-2 text-ink-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-plan-tint flex items-center justify-center text-plan">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">미래 데이트 플래닝</div>
                <div className="text-[10px] text-ink-muted">순서별 코스 세우기 & 길찾기</div>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-plan-line text-plan font-medium">
              {planningCount}개
            </span>
          </button>

          {/* Quick Schedule List Button (planning mode only) */}
          {appMode === "planning" && (
            <div className="pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenScheduleModal?.();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-plan-tint hover:bg-plan-line text-plan-strong text-xs font-bold rounded-xl border border-plan-line transition-all active:scale-95 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>일정 목록</span>
              </button>
            </div>
          )}

          {/* Auth Section: Kakao Login (only when logged out) */}
          {!user && (
            <>
              {/* Divider */}
              <div className="border-t border-line my-1" />

              <div className="pt-0.5 px-1">
                <button
                  type="button"
                  onClick={() => {
                    onLoginWithKakao?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 fill-[#191919]" />
                  <span>카카오로 3초 로그인 (작성자 기록)</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
