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
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-[var(--shadow-sheet)] overflow-hidden flex flex-col border border-line max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-plan text-on-accent flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-on-accent/20 flex items-center justify-center backdrop-blur-xs">
              <Calendar className="w-4 h-4 text-on-accent" />
            </div>
            <div>
              <h2 className="font-display text-sm text-on-accent">데이트 일정 목록</h2>
              <p className="text-[10px] text-on-accent/80">날짜별로 저장된 과거 & 미래 데이트 코스</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-on-accent/20 text-on-accent transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection & Create Button Bar */}
        <div className="p-3 bg-surface-2 border-b border-line flex items-center justify-between gap-2">
          <div className="flex items-center p-1 bg-line/60 rounded-xl">
            <button
              onClick={() => setActiveTab("future")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "future"
                  ? "bg-surface text-plan-strong shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              데이트 계획 ({futurePlans.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "past"
                  ? "bg-surface text-plan-strong shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              데이트 기록 ({pastPlans.length})
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="flex items-center gap-1 bg-plan hover:bg-plan-strong text-on-accent font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>플랜 추가</span>
          </button>
        </div>

        {/* Itinerary List Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {displayedPlans.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-plan-tint text-plan flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-ink">
                {activeTab === "future"
                  ? "등록된 데이트 계획이 없습니다"
                  : "저장된 데이트 기록이 없습니다"}
              </p>
              <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                우측 상단 + 버튼을 눌러 데이트 기간을 설정하고 지도에 코스를 작성해 보세요!
              </p>
            </div>
          ) : (
            displayedPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-3.5 rounded-2xl bg-surface border border-line hover:border-plan-line shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-plan-tint text-plan-strong mb-1">
                      📅 {formatDateRange(plan.start_date, plan.end_date, plan.plan_date)}
                    </span>
                    <h3 className="font-bold text-sm text-ink group-hover:text-plan-strong transition-colors">
                      {plan.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => onDeletePlan(plan.id)}
                    title="플랜 DB 삭제"
                    className="p-1 text-ink-subtle hover:text-warn hover:bg-warn-tint rounded-lg transition-colors cursor-pointer"
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
                        className="text-[10px] bg-surface-2 border border-line text-ink-muted px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0"
                      >
                        <MapPin className="w-2.5 h-2.5 text-plan" />
                        <span>
                          {idx + 1}. {spot.title}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-[10px] text-ink-subtle flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>총 {plan.spots?.length || 0}곳 코스</span>
                  </span>

                  <button
                    onClick={() => onLoadPlan(plan)}
                    className="flex items-center gap-1 text-xs font-bold text-plan-strong hover:underline cursor-pointer"
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
