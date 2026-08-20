"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Palette, ChevronRight, ArrowLeft } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsView = "list" | "theme";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<SettingsView>("list");

  // Always start from the settings list when reopened
  useEffect(() => {
    if (isOpen) setView("list");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col pointer-events-auto border border-white/60">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            {view === "theme" ? (
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="설정 목록으로 돌아가기"
                className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
                <Settings className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">
                {view === "theme" ? "테마 설정" : "설정"}
              </h2>
              <p className="text-[10px] text-gray-500">
                {view === "theme" ? "색상·폰트 등 나만의 테마 만들기" : "앱 환경 설정"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="설정 닫기"
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        {view === "list" ? (
          <div className="p-3">
            <button
              type="button"
              onClick={() => setView("theme")}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <Palette className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">테마 설정</p>
                <p className="text-[11px] text-gray-500">색상, 폰트 등 커스터마이징</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-3 min-h-40">
            {/* Theme customization options (colors, fonts, ...) will be added here */}
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
              <Palette className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-800">테마 커스터마이징 준비 중</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                색상, 폰트 등 테마를 꾸밀 수 있는 기능이
                <br />곧 이곳에 추가될 예정이에요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
