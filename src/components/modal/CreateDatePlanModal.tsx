"use client";

import React, { useState } from "react";
import { X, Calendar, MapPin, Sparkles, Check } from "lucide-react";

interface CreateDatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlan: (startDate: string, endDate: string, title?: string) => void;
}

export const CreateDatePlanModal: React.FC<CreateDatePlanModalProps> = ({
  isOpen,
  onClose,
  onStartPlan,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [title, setTitle] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStart = startDate || todayStr;
    const finalEnd = endDate || finalStart;
    const finalTitle =
      title.trim() ||
      (finalStart === finalEnd
        ? `${finalStart} 데이트`
        : `${finalStart} ~ ${finalEnd} 데이트`);

    onStartPlan(finalStart, finalEnd, finalTitle);
  };

  const handleQuickPreset = (days: number) => {
    const s = new Date();
    const e = new Date(Date.now() + days * 86400000);
    setStartDate(s.toISOString().split("T")[0]);
    setEndDate(e.toISOString().split("T")[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col border border-white/60">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">새 데이트 일정 생성</h2>
              <p className="text-[10px] text-violet-100">데이트 기간을 설정하고 장소를 추가해 보세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              빠른 기간 선택
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset(0)}
                className="flex-1 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs rounded-xl border border-violet-100 transition-all active:scale-95 cursor-pointer"
              >
                당일치기
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(1)}
                className="flex-1 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs rounded-xl border border-violet-100 transition-all active:scale-95 cursor-pointer"
              >
                1박 2일
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(2)}
                className="flex-1 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs rounded-xl border border-violet-100 transition-all active:scale-95 cursor-pointer"
              >
                2박 3일
              </button>
            </div>
          </div>

          {/* Date Range Selection Inputs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">시작일 🗓️</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">종료일 🏁</label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              플랜 제목 (선택)
            </label>
            <input
              type="text"
              placeholder={
                startDate === endDate
                  ? `${startDate} 데이트`
                  : `${startDate} ~ ${endDate} 데이트`
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200 transition-all active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>장소 핀 찍기 시작</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
