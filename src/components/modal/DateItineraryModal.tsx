"use client";

import React, { useState } from "react";
import { DatePlan } from "@/types/planner";
import { X, Calendar, MapPin, Trash2, ArrowRight, Sparkles, Clock, Plus } from "lucide-react";

interface DateItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlans: DatePlan[];
  onLoadPlan: (plan: DatePlan) => void;
  onDeletePlan: (planId: string) => void;
  onOpenCreateModal: () => void;
}

export const DateItineraryModal: React.FC<DateItineraryModalProps> = ({
  isOpen,
  onClose,
  allPlans,
  onLoadPlan,
  onDeletePlan,
  onOpenCreateModal,
}) => {
  const [activeTab, setActiveTab] = useState<"future" | "past">("future");

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const pastPlans = allPlans.filter(
    (p) => (p.end_date || p.start_date || p.plan_date) < todayStr
  );
  const futurePlans = allPlans.filter(
    (p) => (p.start_date || p.plan_date) >= todayStr
  );

  const displayedPlans = activeTab === "future" ? futurePlans : pastPlans;

  const formatDateRange = (start?: string, end?: string, fallback?: string) => {
    const s = start || fallback || "";
    const e = end || s;
    if (!s) return "";
    if (s === e) return s;
    return `${s} ~ ${e}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/60 max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">데이트 일정 목록 (DB)</h2>
              <p className="text-[10px] text-violet-100">날짜별로 저장된 과거 & 미래 데이트 코스</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection & Create Button Bar */}
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center p-1 bg-gray-200/60 rounded-xl">
            <button
              onClick={() => setActiveTab("future")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "future"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🔮 미래 데이트 ({futurePlans.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "past"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⏳ 과거 데이트 ({pastPlans.length})
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>플랜 추가</span>
          </button>
        </div>

        {/* Itinerary List Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {displayedPlans.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-violet-50 text-violet-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-700">
                {activeTab === "future"
                  ? "등록된 미래 데이트 일정이 없습니다"
                  : "저장된 과거 데이트 일정이 없습니다"}
              </p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                우측 상단 + 버튼을 눌러 데이트 기간을 설정하고 지도에 코스를 작성해 보세요!
              </p>
            </div>
          ) : (
            displayedPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-3.5 rounded-2xl bg-white border border-gray-100 hover:border-violet-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 mb-1">
                      📅 {formatDateRange(plan.start_date, plan.end_date, plan.plan_date)}
                    </span>
                    <h3 className="font-bold text-sm text-gray-800 group-hover:text-violet-700 transition-colors">
                      {plan.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    title="플랜 DB 삭제"
                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Spot Thumbnails / Highlights */}
                {plan.spots && plan.spots.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {plan.spots.map((spot, idx) => (
                      <span
                        key={spot.id || idx}
                        className="text-[10px] bg-gray-50 border border-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0"
                      >
                        <MapPin className="w-2.5 h-2.5 text-violet-500" />
                        <span>
                          {idx + 1}. {spot.title}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>총 {plan.spots?.length || 0}곳 코스</span>
                  </span>

                  <button
                    onClick={() => onLoadPlan(plan)}
                    className="flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer"
                  >
                    <span>지도에서 코스 보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
