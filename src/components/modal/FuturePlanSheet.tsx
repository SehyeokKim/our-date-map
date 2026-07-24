import React, { useState } from "react";
import { PlannedSpot, DatePlan } from "@/types/planner";
import { TransitRouteResult } from "@/types/transit";
import {
  Calendar,
  ChevronUp,
  ChevronDown,
  Trash2,
  Navigation,
  Sparkles,
  MapPin,
  RefreshCw,
  Clock,
  Route,
  Bus,
} from "lucide-react";

interface FuturePlanSheetProps {
  plannedSpots: PlannedSpot[];
  onRemoveSpot: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearAll: () => void;
  routeDistance?: number;
  routeDuration?: number;
  loadingRoute?: boolean;
  transitRoutes?: Record<string, TransitRouteResult>;
  loadingTransit?: boolean;

  // Date selection & DB persistence props
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  savedPlans?: DatePlan[];
  isSavingDb?: boolean;
  isLoadingDb?: boolean;
  onSavePlanToDb?: () => void;
  onLoadPlanFromDb?: (plan: DatePlan) => void;
  onDeletePlanFromDb?: (planId: string) => void;
  onOpenScheduleModal?: () => void;
  onOpenCreateModal?: () => void;
  onClose?: () => void;
  onPanToSpot?: (lat: number, lng: number) => void;
}

export const FuturePlanSheet: React.FC<FuturePlanSheetProps> = ({
  plannedSpots,
  onRemoveSpot,
  onMoveUp,
  onMoveDown,
  onClearAll,
  routeDistance,
  routeDuration,
  loadingRoute,
  transitRoutes,
  loadingTransit,
  selectedDate = new Date().toISOString().split("T")[0],
  onSelectDate,
  savedPlans = [],
  isSavingDb = false,
  isLoadingDb = false,
  onSavePlanToDb,
  onLoadPlanFromDb,
  onDeletePlanFromDb,
  onOpenScheduleModal,
  onOpenCreateModal,
  onClose,
  onPanToSpot,
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
      <div className="bg-white/95 backdrop-blur-md border border-violet-100 rounded-3xl shadow-2xl overflow-hidden">
        {/* Toggle Bar / Summary Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-200">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-800 text-sm">미래 데이트 코스 플랜</h2>
                <span className="bg-violet-100 text-violet-700 font-bold text-[11px] px-2 py-0.5 rounded-full">
                  총 {plannedSpots.length}곳
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                {plannedSpots.length === 0
                  ? "지도를 터치하여 방문할 코스를 추가하세요"
                  : "순서대로 이어지는 경로가 지도에 표시됩니다"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
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
            {/* Route Stats Bar if route exists */}
            {plannedSpots.length >= 2 && (
              <div className="flex items-center justify-around bg-violet-50/80 rounded-2xl p-2.5 text-xs text-violet-800 border border-violet-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <Route className="w-4 h-4 text-violet-600" />
                  <span>
                    {loadingRoute
                      ? "경로 계산 중..."
                      : formatDistance(routeDistance) || "경로 연결 완료"}
                  </span>
                </div>
                {routeDuration && (
                  <div className="flex items-center gap-1.5 font-medium border-l border-violet-200 pl-3">
                    <Clock className="w-4 h-4 text-violet-600" />
                    <span>{formatDuration(routeDuration)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Empty state guidance */}
            {plannedSpots.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-violet-50 text-violet-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">등록된 미래 데이트 장소가 없습니다</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  지도 위 원하는 위치를 터치하면 이동 순서대로 코스 핀이 생성되고 길찾기 경로가 연결됩니다!
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
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-300 hover:bg-violet-50/50 transition-all shadow-2xs group">
                        {/* Clickable spot info area -> pans map to spot */}
                        <div
                          onClick={() => onPanToSpot?.(spot.latitude, spot.longitude)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          title="클릭 시 지도 위치로 이동"
                        >
                          {/* Order Badge */}
                          <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-200 group-hover:scale-110 transition-transform">
                            {spot.order}
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-xs text-gray-800 group-hover:text-violet-700 transition-colors truncate">
                              {spot.title}
                            </div>
                            {spot.address && (
                              <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{spot.address}</span>
                              </div>
                            )}
                            {spot.memo && (
                              <div className="text-[10px] text-violet-600 font-medium truncate mt-0.5">
                                💬 {spot.memo}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions: Reorder & Delete */}
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0}
                            title="순서 올리기"
                            className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onMoveDown(index)}
                            disabled={index === plannedSpots.length - 1}
                            title="순서 내리기"
                            className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemoveSpot(spot.id)}
                            title="핀 삭제"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Public Transit Route Card between Spot A and Spot B */}
                      {nextSpot && (
                        <div className="my-1 mx-2 p-2.5 rounded-xl bg-violet-50/80 border border-violet-100 flex items-center justify-between text-xs text-violet-900 shadow-xs animate-in fade-in duration-200">
                          {transit?.routeInfo ? (
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-200">
                                <Bus className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold flex items-center gap-2 text-violet-950 text-[11px]">
                                  <span>⏱️ 약 {transit.routeInfo.totalTime}분 소요</span>
                                  <span className="text-violet-300">|</span>
                                  <span>
                                    💳{" "}
                                    {transit.routeInfo.payment > 0
                                      ? `${transit.routeInfo.payment.toLocaleString()}원`
                                      : "도보 / 무료"}
                                  </span>
                                </div>
                                <div className="text-[10px] text-violet-700 font-medium truncate mt-0.5 flex items-center gap-1">
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
                            <div className="flex items-center gap-2 text-violet-600 text-[11px]">
                              <Bus className="w-3.5 h-3.5 text-violet-500" />
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
          </div>
        )}
      </div>
    </div>
  );
};
