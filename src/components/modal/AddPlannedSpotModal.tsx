"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Sparkles } from "lucide-react";
import { TransitMode } from "@/types/transit";
import { TRANSIT_MODES, TRANSIT_MODE_META } from "@/lib/transit";

interface AddPlannedSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  latLng: { lat: number; lng: number } | null;
  initialAddress?: string;
  onSubmit: (
    title: string,
    memo: string | undefined,
    lat: number,
    lng: number,
    address?: string,
    transitMode?: TransitMode
  ) => void;
  /** 직전 경유지에서 여기로 오는 이동수단의 추천 기본값 (수도권이면 지하철) */
  defaultTransitMode?: TransitMode;
  /** 첫 경유지는 앞 구간이 없어 이동수단을 고를 필요가 없다 */
  showTransitMode?: boolean;
}

export const AddPlannedSpotModal: React.FC<AddPlannedSpotModalProps> = ({
  isOpen,
  onClose,
  latLng,
  initialAddress = "",
  onSubmit,
  defaultTransitMode = "both",
  showTransitMode = false,
}) => {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [transitMode, setTransitMode] = useState<TransitMode>(defaultTransitMode);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setMemo("");
      setTransitMode(defaultTransitMode);
    }
  }, [isOpen, defaultTransitMode]);

  if (!isOpen || !latLng) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit(
      title,
      memo || undefined,
      latLng.lat,
      latLng.lng,
      initialAddress,
      showTransitMode ? transitMode : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-sheet)] p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-plan-tint text-plan flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-ink text-base">미래 데이트 플랜 추가</h3>
              <p className="text-xs text-ink-muted">방문하고 싶은 장소를 코스에 추가해요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-2 text-ink-subtle hover:text-ink-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Address preview */}
        {initialAddress && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-plan-tint rounded-xl text-plan-strong text-xs font-medium border border-plan-line">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{initialAddress}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              장소 / 목적지 이름 <span className="text-memory">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 성수동 온량, 남산타워 산책, 한강 공원 픽닉"
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-plan focus:bg-surface transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              계획 메모
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 오후 2시 예약완료, 창가 자리 요청하기"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-plan focus:bg-surface transition-all resize-none"
            />
          </div>

          {/* 직전 경유지에서 여기로 오는 이동수단 */}
          {showTransitMode && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                여기로 오는 이동수단
              </label>
              <div className="flex items-center gap-1.5">
                {TRANSIT_MODES.map((mode) => {
                  const isSelected = transitMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTransitMode(mode)}
                      aria-pressed={isSelected}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-plan text-on-accent border-plan"
                          : "bg-surface-2 text-ink-muted border-line hover:bg-plan-tint"
                      }`}
                    >
                      {TRANSIT_MODE_META[mode].label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-ink-subtle leading-tight">
                고른 수단으로 ODsay에서 경로를 찾아 추천해요. 나중에 코스에서 바꿀 수 있어요.
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-2 text-ink-muted rounded-xl font-semibold text-sm hover:bg-line transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 bg-plan text-on-accent rounded-xl font-semibold text-sm hover:bg-plan-strong disabled:opacity-50 transition-all shadow-[var(--shadow-card)]"
            >
              플랜 코스에 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
