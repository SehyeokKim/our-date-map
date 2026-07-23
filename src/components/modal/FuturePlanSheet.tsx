"use client";

import React, { useState } from "react";
import { PlannedSpot } from "@/types/planner";
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
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

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

          <div className="flex items-center gap-2">
            {plannedSpots.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                title="플랜 전체 삭제"
                className="p-1.5 rounded-full hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button className="p-1 text-gray-400 hover:text-gray-600">
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
                <div className="flex items-center gap-1 text-[10px] text-violet-600 bg-white px-2 py-0.5 rounded-full font-semibold border border-violet-200">
                  <Navigation className="w-3 h-3 fill-violet-600" />
                  <span>카카오 네비</span>
                </div>
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
                {plannedSpots.map((spot, index) => (
                  <div
                    key={spot.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Order Badge */}
                      <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-200">
                        {spot.order}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-gray-800 truncate">
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
                        className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onMoveDown(index)}
                        disabled={index === plannedSpots.length - 1}
                        title="순서 내리기"
                        className="p-1 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveSpot(spot.id)}
                        title="핀 삭제"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
