"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bus, Car, Check, Footprints, Loader2, TrainFront, X } from "lucide-react";
import { PlannedSpot } from "@/types/planner";
import { RouteMode, RouteOption, RouteStep } from "@/types/transit";
import {
  ROUTE_MODES,
  ROUTE_MODE_LABEL,
  TRANSIT_SORT_LABEL,
  TransitSort,
  formatMeters,
  formatMinutes,
  routeSignature,
  sortTransitRoutes,
  stepLabel,
  walkDistanceOf,
} from "@/lib/transit";

interface RouteOptionsSheetProps {
  from: PlannedSpot;
  to: PlannedSpot;
  /** 지금 이 구간에 저장된 경로 */
  selected: RouteOption | null;
  searchRoutes: (from: PlannedSpot, to: PlannedSpot, mode: RouteMode) => Promise<RouteOption[] | null>;
  onSelect: (route: RouteOption) => void;
  onClose: () => void;
}

/** 탭 조회 결과. 아직 없으면 조회 중이다 */
type TabState = { status: "done"; routes: RouteOption[] } | { status: "error" };

const MODE_ICON: Record<RouteMode, React.ElementType> = {
  transit: Bus,
  car: Car,
  walk: Footprints,
};

const EMPTY_MESSAGE: Record<RouteMode, string> = {
  transit: "대중교통 경로가 없어요. 가까운 거리라면 도보 탭을 확인해 보세요.",
  car: "자동차 경로를 찾지 못했어요.",
  walk: "걸어서 가기엔 너무 멀어요.",
};

const SORTS: TransitSort[] = ["recommend", "time", "transfer", "walk"];

/** 지도 도보 점선과 같은 무늬. 목록에서도 도보 구간을 같은 표기로 읽게 한다 */
const WALK_STRIPE =
  "bg-[repeating-linear-gradient(90deg,var(--plan)_0_4px,transparent_4px_7px)] opacity-60";

const StepIcon = ({ step, className }: { step: RouteStep; className?: string }) => {
  const Icon =
    step.kind === "subway" ? TrainFront : step.kind === "bus" ? Bus : step.kind === "car" ? Car : Footprints;
  return <Icon className={className} aria-hidden />;
};

/** 단계별 소요시간 비율 막대. 차량은 채운 막대, 도보는 점선 무늬 */
const DurationBar = ({ route }: { route: RouteOption }) => (
  <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
    {route.steps.map((step, i) => (
      <div
        key={i}
        style={{ flexGrow: Math.max(step.duration, 30) }}
        className={step.kind === "walk" ? WALK_STRIPE : "bg-plan"}
      />
    ))}
  </div>
);

const RouteCard = ({
  route,
  isSelected,
  onSelect,
}: {
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const rideSteps = route.steps.filter((s) => s.kind === "subway" || s.kind === "bus");
  const walkSeconds = route.steps.reduce((sum, s) => (s.kind === "walk" ? sum + s.duration : sum), 0);
  const meta = [
    formatMeters(route.distance),
    route.fare ? `${route.fare.toLocaleString()}원` : null,
    route.mode === "transit" ? `환승 ${route.transfers ?? 0}회` : null,
    route.mode === "transit" && walkSeconds > 0
      ? `도보 ${formatMinutes(walkSeconds)}(${formatMeters(walkDistanceOf(route))})`
      : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`w-full text-left rounded-2xl border p-3.5 space-y-2.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plan ${
        isSelected ? "border-plan bg-plan-tint" : "border-line bg-surface hover:bg-surface-2"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-lg text-ink">{formatMinutes(route.duration)}</span>
        {isSelected && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-plan-strong">
            <Check className="w-3.5 h-3.5" aria-hidden />
            지금 경로
          </span>
        )}
      </div>
      <p className="text-[11px] text-ink-muted">{meta.join(" · ")}</p>
      <DurationBar route={route} />

      {rideSteps.length > 0 ? (
        <ol className="space-y-1">
          {rideSteps.map((step, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px] text-ink min-w-0">
              <span className="flex items-center gap-1 shrink-0 rounded-md bg-plan text-on-accent px-1.5 py-0.5 font-bold">
                <StepIcon step={step} className="w-3 h-3" />
                {stepLabel(step)}
              </span>
              <span className="truncate text-ink-muted">
                {step.start} 승차 · {step.end} 하차
                {step.stopCount && step.stopCount > 1 ? ` (${step.stopCount - 1}${step.kind === "subway" ? "개 역" : "정류장"})` : ""}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="flex items-center gap-1.5 text-[11px] text-ink">
          <StepIcon step={route.steps[0] ?? { kind: "walk", duration: 0, distance: 0 }} className="w-3.5 h-3.5 text-plan" />
          {route.mode === "car" ? "자동차 · 이동 거리가 가장 짧은 길" : "걸어서 이동"}
        </p>
      )}
    </button>
  );
};

export const RouteOptionsSheet: React.FC<RouteOptionsSheetProps> = ({
  from,
  to,
  selected,
  searchRoutes,
  onSelect,
  onClose,
}) => {
  const [mode, setMode] = useState<RouteMode>(selected?.mode ?? "transit");
  const [sort, setSort] = useState<TransitSort>("recommend");
  const [tabs, setTabs] = useState<Partial<Record<RouteMode, TabState>>>({});

  // 탭을 처음 열 때만 조회한다. 결과는 searchRoutes가 캐시하므로 다시 열어도 호출이 늘지 않는다.
  // 응답을 기다리는 사이 다른 탭으로 옮겨도 결과는 원래 탭에 채워 둔다
  const requestedRef = useRef<Set<RouteMode>>(new Set());
  useEffect(() => {
    if (requestedRef.current.has(mode)) return;
    requestedRef.current.add(mode);
    const requestedMode = mode;
    searchRoutes(from, to, requestedMode).then((routes) => {
      setTabs((prev) => ({
        ...prev,
        [requestedMode]: routes ? { status: "done", routes } : { status: "error" },
      }));
    });
  }, [mode, from, to, searchRoutes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tab = tabs[mode];
  const routes =
    tab?.status === "done" ? (mode === "transit" ? sortTransitRoutes(tab.routes, sort) : tab.routes) : [];
  const selectedSignature = selected ? routeSignature(selected) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-options-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-[min(80vh,640px)] flex flex-col bg-surface rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-sheet)] animate-in slide-in-from-bottom duration-300"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h2 id="route-options-title" className="font-display text-ink text-base">
              경로 고르기
            </h2>
            <p className="mt-0.5 text-[11px] text-ink-muted truncate">
              {from.title}에서 {to.title}까지
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-11 h-11 -mr-2 -mt-2 shrink-0 rounded-full text-ink-subtle hover:text-ink hover:bg-surface-2 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 수단 탭 */}
        <div role="tablist" aria-label="이동수단" className="mx-5 shrink-0 grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {ROUTE_MODES.map((m) => {
            const Icon = MODE_ICON[m];
            const isActive = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setMode(m)}
                className={`min-h-11 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plan ${
                  isActive ? "bg-surface text-plan-strong shadow-2xs" : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                {ROUTE_MODE_LABEL[m]}
              </button>
            );
          })}
        </div>

        {/* 대중교통 정렬 — 후보가 둘 이상일 때만 */}
        {mode === "transit" && routes.length > 1 && (
          <div className="mx-5 mt-2 shrink-0 flex gap-1 overflow-x-auto">
            {SORTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                className={`min-h-11 shrink-0 px-3 rounded-lg text-[11px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plan ${
                  sort === s ? "text-plan-strong underline underline-offset-4" : "text-ink-muted hover:text-ink"
                }`}
              >
                {TRANSIT_SORT_LABEL[s]}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-5 space-y-2" role="tabpanel">
          {!tab ? (
            <div className="py-10 flex flex-col items-center gap-2 text-xs text-ink-muted">
              <Loader2 className="w-5 h-5 animate-spin text-plan" aria-hidden />
              경로를 찾는 중이에요
            </div>
          ) : tab.status === "error" ? (
            <p className="py-10 text-center text-xs text-ink-muted">
              경로를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.
            </p>
          ) : routes.length === 0 ? (
            <p className="py-10 text-center text-xs text-ink-muted">{EMPTY_MESSAGE[mode]}</p>
          ) : (
            routes.map((route, i) => {
              const signature = routeSignature(route);
              return (
                <RouteCard
                  key={`${i}-${signature}`}
                  route={route}
                  isSelected={signature === selectedSignature}
                  onSelect={() => onSelect(route)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
