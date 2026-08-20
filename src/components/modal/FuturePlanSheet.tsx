import React, { useState } from "react";
import { PlannedSpot } from "@/types/planner";
import { TransitRouteResult } from "@/types/transit";
import {
  Calendar,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  MapPin,
  Clock,
  Route,
  Bus,
  Pencil,
  Check,
  MapPinPlus,
  Loader2,
} from "lucide-react";

interface FuturePlanSheetProps {
  /** 불러온(또는 새로 만든) 일정의 제목. 없으면 기본 문구를 쓴다 */
  planTitle?: string;
  plannedSpots: PlannedSpot[];
  onRemoveSpot: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  routeDistance?: number;
  routeDuration?: number;
  loadingRoute?: boolean;
  transitRoutes?: Record<string, TransitRouteResult>;
  loadingTransit?: boolean;
  onPanToSpot?: (lat: number, lng: number) => void;
  onAddWaypoint?: () => void;
  /** 편집 상태는 page에서 관리한다 — 새 플랜 생성 직후 자동으로 편집에 들어가야 하기 때문 */
  isEditing?: boolean;
  /** 편집 진입(수정) 또는 저장 후 종료(완료) */
  onToggleEdit?: () => void;
  isSaving?: boolean;
}

export const FuturePlanSheet: React.FC<FuturePlanSheetProps> = ({
  planTitle,
  plannedSpots,
  onRemoveSpot,
  onMoveUp,
  onMoveDown,
  routeDistance,
  routeDuration,
  loadingRoute,
  transitRoutes,
  loadingTransit,
  onPanToSpot,
  onAddWaypoint,
  isEditing = false,
  onToggleEdit,
  isSaving = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Helper for formatting distance (meters to km)
  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Helper for formatting duration (seconds to min/hrs)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `약 ${mins}분`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `약 ${hrs}시간 ${remainMins}분`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 max-w-md mx-auto px-4 pb-4 transition-all duration-300">
      <div className="bg-surface border border-plan-line rounded-3xl shadow-[var(--shadow-sheet)] overflow-hidden">
        {/* Toggle Bar / Summary Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-line bg-plan-tint"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-plan text-on-accent flex items-center justify-center shadow-sm shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* 일정을 불러왔다면 그 제목을, 아니면 기본 문구를 보여준다 */}
                <h2 className="font-display text-ink text-sm truncate">
                  {planTitle?.trim() || "데이트 코스 상세"}
                </h2>
                <span className="bg-surface text-plan-strong font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0">
                  총 {plannedSpots.length}곳
                </span>
              </div>
              <p className="text-[10px] text-ink-muted truncate">
                {isEditing
                  ? "경유지 추가 · 순서 조정 · 삭제 후 완료를 누르세요"
                  : plannedSpots.length === 0
                  ? "수정을 눌러 경유지를 추가해 보세요"
                  : "순서대로 이어지는 경로가 지도에 표시됩니다"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={isExpanded ? "코스 목록 접기" : "코스 목록 펼치기"}
              className="p-1 text-ink-subtle hover:text-ink-muted cursor-pointer"
            >
              <ChevronUp
                className={`w-4 h-4 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          <div className="p-4 space-y-3 max-h-[42vh] overflow-y-auto">
            {/* 상단 바 — 왼쪽은 경로 요약(거리·시간), 오른쪽은 수정 토글.
                경로 요약은 2곳 이상일 때만 계산되지만, 수정 버튼은 장소가 없을 때도
                경유지를 추가할 수 있어야 하므로 바 자체는 항상 렌더링한다. */}
            <div className="flex items-center justify-between gap-2 bg-plan-tint rounded-2xl pl-3 pr-2 py-2 border border-plan-line">
              <div className="flex items-center gap-3 min-w-0 text-xs text-plan-strong">
                {plannedSpots.length >= 2 ? (
                  <>
                    <div className="flex items-center gap-1.5 font-medium min-w-0">
                      <Route className="w-4 h-4 text-plan shrink-0" />
                      <span className="truncate">
                        {loadingRoute
                          ? "경로 계산 중..."
                          : formatDistance(routeDistance) || "경로 연결 완료"}
                      </span>
                    </div>
                    {routeDuration && (
                      <div className="flex items-center gap-1.5 font-medium border-l border-plan-line pl-3 min-w-0">
                        <Clock className="w-4 h-4 text-plan shrink-0" />
                        <span className="truncate">{formatDuration(routeDuration)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium text-ink-muted min-w-0">
                    <Route className="w-4 h-4 text-plan shrink-0" />
                    <span className="truncate">장소가 2곳부터 경로가 표시돼요</span>
                  </div>
                )}
              </div>

              {/* 편집 토글 — 완료를 누르면 변경사항이 저장된다 */}
              <button
                type="button"
                onClick={onToggleEdit}
                disabled={isSaving}
                aria-pressed={isEditing}
                title={isEditing ? "변경사항 저장하고 편집 종료" : "코스 수정"}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60 ${
                  isEditing
                    ? "bg-plan text-on-accent"
                    : "bg-surface text-plan-strong border border-plan-line hover:bg-surface-2"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isEditing ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Pencil className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "저장 중" : isEditing ? "완료" : "수정"}</span>
              </button>
            </div>

            {/* Empty state guidance */}
            {plannedSpots.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-plan-tint text-plan flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-ink">아직 등록된 경유지가 없습니다</p>
                <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                  아래 <b className="text-plan-strong">경유지 추가</b> 버튼으로 장소를 검색하거나, 주소를 모른다면 지도에 직접 핀을 찍어 추가할 수 있어요.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {plannedSpots.map((spot, index) => {
                  const nextSpot = plannedSpots[index + 1];
                  const pairKey = nextSpot ? `${spot.id}->${nextSpot.id}` : null;
                  const transit = pairKey && transitRoutes ? transitRoutes[pairKey] : null;

                  return (
                    <React.Fragment key={spot.id}>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-2 border border-line hover:border-plan-line hover:bg-plan-tint transition-all shadow-2xs group">
                        {/* Clickable spot info area -> pans map to spot */}
                        <div
                          onClick={() => onPanToSpot?.(spot.latitude, spot.longitude)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          title="클릭 시 지도 위치로 이동"
                        >
                          {/* Order Badge */}
                          <div className="w-7 h-7 rounded-full bg-plan text-on-accent font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {spot.order}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-ink group-hover:text-plan-strong transition-colors truncate">
                              {spot.title}
                            </div>
                            {spot.address && (
                              <div className="text-[10px] text-ink-subtle flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{spot.address}</span>
                              </div>
                            )}
                            {spot.memo && (
                              <div className="text-[10px] text-plan-strong font-medium bg-plan-tint p-1.5 rounded-lg border border-plan-line/50 flex items-start gap-1 mt-1">
                                <span className="flex-shrink-0 select-none">💬</span>
                                <span className="whitespace-pre-wrap break-words flex-1 leading-relaxed">
                                  {spot.memo}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions: Reorder & Delete (수정 모드 전용) */}
                        {isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0}
                            title="순서 올리기"
                            className="p-1 rounded-lg hover:bg-surface text-ink-subtle hover:text-ink disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onMoveDown(index)}
                            disabled={index === plannedSpots.length - 1}
                            title="순서 내리기"
                            className="p-1 rounded-lg hover:bg-surface text-ink-subtle hover:text-ink disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemoveSpot(spot.id)}
                            title="핀 삭제"
                            className="p-1.5 rounded-lg hover:bg-warn-tint text-ink-subtle hover:text-warn transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        )}
                      </div>

                      {/* Public Transit Route Card between Spot A and Spot B */}
                      {nextSpot && (
                        <div className="my-1 mx-2 p-2.5 rounded-xl bg-plan-tint border border-plan-line flex items-center justify-between text-xs text-plan-strong shadow-xs animate-in fade-in duration-200">
                          {transit?.routeInfo ? (
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-plan text-on-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Bus className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold flex items-center gap-2 text-ink text-[11px]">
                                  <span>⏱️ 약 {transit.routeInfo.totalTime}분 소요</span>
                                </div>
                                <div className="text-[10px] text-plan-strong font-medium truncate mt-0.5 flex items-center gap-1">
                                  <span>🚉</span>
                                  <span className="truncate">
                                    {transit.routeInfo.subpaths
                                      .map((sp) => sp.transportName)
                                      .filter(Boolean)
                                      .join(" ➔ ") || "대중교통 이동"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-plan text-[11px]">
                              <Bus className="w-3.5 h-3.5 text-plan" />
                              <span>
                                {loadingTransit
                                  ? "대중교통 경로 계산 중..."
                                  : transit?.error || "대중교통 경로 탐색 불가"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* 경유지 추가 (수정 모드 전용) — 코스 맨 뒤에 추가된 뒤 순서 조정으로 위치를 옮긴다 */}
            {isEditing && onAddWaypoint && (
              <button
                type="button"
                onClick={onAddWaypoint}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-dashed border-plan-line text-plan-strong text-xs font-bold hover:bg-plan-tint active:scale-[0.99] transition-all cursor-pointer"
              >
                <MapPinPlus className="w-4 h-4" />
                <span>경유지 추가</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
