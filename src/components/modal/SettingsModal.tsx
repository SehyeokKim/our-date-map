"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Palette, ChevronRight, ArrowLeft, Check, Heart } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  COLOR_THEMES,
  FONT_THEMES,
  COLOR_THEME_META,
  FONT_THEME_META,
  ColorTheme,
  FontTheme,
} from "@/lib/theme";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 로그인 사용자 — 커플로 묶여 있으면 테마가 상대방과 공유된다 */
  userId?: string | null;
}

type SettingsView = "list" | "theme";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userId }) => {
  const [view, setView] = useState<SettingsView>("list");
  const { theme, font, applyTheme, isShared } = useTheme(userId);

  // 아직 적용하지 않은 선택값 — 미리보기 카드에만 반영된다
  const [pendingTheme, setPendingTheme] = useState<ColorTheme>(theme);
  const [pendingFont, setPendingFont] = useState<FontTheme>(font);

  // Always start from the settings list when reopened
  useEffect(() => {
    if (isOpen) setView("list");
  }, [isOpen]);

  if (!isOpen) return null;

  const isDirty = pendingTheme !== theme || pendingFont !== font;

  const openThemeView = () => {
    setPendingTheme(theme);
    setPendingFont(font);
    setView("theme");
  };

  const handleApply = () => {
    applyTheme(pendingTheme, pendingFont);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-surface rounded-3xl shadow-[var(--shadow-sheet)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col pointer-events-auto border border-line max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-memory-tint shrink-0">
          <div className="flex items-center gap-2">
            {view === "theme" ? (
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="설정 목록으로 돌아가기"
                className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-memory hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-memory">
                <Settings className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="font-display text-sm text-ink leading-tight">
                {view === "theme" ? "테마 설정" : "설정"}
              </h2>
              <p className="text-[10px] text-ink-muted">
                {view === "theme"
                  ? isShared
                    ? "색상과 폰트는 상대방과 함께 적용돼요"
                    : "색상과 폰트를 골라 나만의 지도 만들기"
                  : "앱 환경 설정"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="설정 닫기"
            className="w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center text-ink-subtle hover:text-ink-muted hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        {view === "list" ? (
          <div className="p-3">
            <button
              type="button"
              onClick={openThemeView}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left hover:bg-memory-tint active:bg-memory-line transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-memory-tint flex items-center justify-center text-memory shrink-0">
                <Palette className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">테마 설정</p>
                <p className="text-[11px] text-ink-muted">색상, 폰트 커스터마이징</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-subtle shrink-0" />
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5 overflow-y-auto">
            {/* 색상 테마 선택 */}
            <section>
              <div className="text-xs font-bold text-ink mb-2">색상</div>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_THEMES.map((t) => {
                  const meta = COLOR_THEME_META[t];
                  const isSelected = pendingTheme === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPendingTheme(t)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-memory bg-memory-tint ring-1 ring-memory"
                          : "border-line bg-surface hover:bg-surface-2"
                      }`}
                    >
                      <div className="flex items-center -space-x-1.5">
                        <span
                          className="w-6 h-6 rounded-full border-2 border-surface shadow-xs"
                          style={{ background: meta.swatch.bg }}
                        />
                        <span
                          className="w-6 h-6 rounded-full border-2 border-surface shadow-xs"
                          style={{ background: meta.swatch.memory }}
                        />
                        <span
                          className="w-6 h-6 rounded-full border-2 border-surface shadow-xs"
                          style={{ background: meta.swatch.plan }}
                        />
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-[11px] font-bold ${
                            isSelected ? "text-memory-strong" : "text-ink"
                          }`}
                        >
                          {meta.label}
                        </div>
                        <div className="text-[9px] text-ink-muted leading-tight">
                          {meta.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 폰트 선택 */}
            <section>
              <div className="text-xs font-bold text-ink mb-2">폰트</div>
              <div className="space-y-1.5">
                {FONT_THEMES.map((f) => {
                  const meta = FONT_THEME_META[f];
                  const isSelected = pendingFont === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPendingFont(f)}
                      aria-pressed={isSelected}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-memory bg-memory-tint ring-1 ring-memory"
                          : "border-line bg-surface hover:bg-surface-2"
                      }`}
                    >
                      <div className="min-w-0">
                        <div
                          className="text-sm text-ink truncate"
                          style={{
                            fontFamily: meta.displayFamily,
                            fontWeight: meta.displayWeight,
                          }}
                        >
                          우리들의 데이트 지도
                        </div>
                        <div
                          className="text-[10px] text-ink-muted"
                          style={{ fontFamily: meta.bodyFamily }}
                        >
                          {meta.label} — {meta.description}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-memory shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 적용 예시 미리보기 — data-theme/data-font 스코프로 선택값만 반영 */}
            <section>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-xs font-bold text-ink">적용 예시</div>
                <div className="text-[10px] text-ink-subtle">
                  {isShared ? "적용하면 상대방에게도 반영돼요" : "적용하기를 눌러야 실제로 바뀌어요"}
                </div>
              </div>
              <div
                data-theme={pendingTheme}
                data-font={pendingFont}
                className="rounded-2xl border border-line bg-bg p-4 font-body transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-memory-tint text-memory flex items-center justify-center">
                    <Heart className="w-3 h-3 fill-current" />
                  </div>
                  <span className="font-display text-[13px] text-ink">우리들의 데이트 지도</span>
                </div>
                <div className="mt-3 bg-surface border border-line rounded-xl p-3 shadow-[var(--shadow-card)]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-memory-tint border border-memory-line text-memory text-[9px] font-bold">
                    추억 기록
                  </span>
                  <p className="mt-1.5 text-xs font-bold text-ink">성수동 카페 오후</p>
                  <p className="mt-0.5 text-[10px] text-ink-muted">2026.08.14 · 사진 6장</p>
                </div>
                <div className="mt-2 bg-plan-tint border border-plan-line rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-plan-strong">다음 데이트 코스</p>
                  <p className="mt-0.5 text-[10px] text-ink-muted">3개 장소 · 도보 22분</p>
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  <div className="flex-1 text-center py-2 rounded-lg bg-memory text-on-accent text-[11px] font-bold">
                    기록 남기기
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-surface border border-line text-ink-muted text-[11px] font-semibold">
                    코스
                  </div>
                </div>
              </div>
            </section>

            {/* 적용 버튼 */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingTheme(theme);
                  setPendingFont(font);
                  setView("list");
                }}
                className="flex-1 py-2.5 bg-surface-2 hover:bg-line text-ink-muted rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!isDirty}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isDirty
                    ? "bg-memory hover:bg-memory-strong text-on-accent shadow-[var(--shadow-card)] cursor-pointer"
                    : "bg-surface-2 text-ink-subtle cursor-default"
                }`}
              >
                {isDirty ? "적용하기" : "적용됨"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
