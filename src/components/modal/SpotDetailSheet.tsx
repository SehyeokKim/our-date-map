"use client";

import React, { useState } from "react";
import { Heart, X, MapPin, Trash2, Loader2, Calendar } from "lucide-react";
import { DateSpot } from "@/types/spot";

interface SpotDetailSheetProps {
  spot: DateSpot | null;
  onClose: () => void;
  onDelete?: (spot: DateSpot) => Promise<boolean>;
}

export const SpotDetailSheet: React.FC<SpotDetailSheetProps> = ({ spot, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!spot) return null;

  const formattedDate = new Date(spot.visited_at)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    if (window.confirm(`"${spot.title}" 데이트 기록을 정말로 삭제하시겠습니까?\n사진과 모든 메모가 데이터베이스에서 함께 완전 제거됩니다.`)) {
      setIsDeleting(true);
      const success = await onDelete(spot);
      setIsDeleting(false);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="absolute inset-0" onClick={() => !isDeleting && onClose()} />

      <div className="relative w-full max-w-md bg-white rounded-t-[32px] md:rounded-2xl shadow-2xl overflow-hidden z-10 animate-bounce-in max-h-[90vh] flex flex-col">
        {/* Header with Title & Close Button */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-gray-100 bg-white">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full bg-rose-50 text-[11px] text-rose-500 font-bold border border-rose-100">
              <Calendar className="w-3 h-3 text-rose-500" />
              {formattedDate}
            </span>
            <div className="mt-0.5">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                📍 장소
              </span>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{spot.title}</h2>
            </div>
            {spot.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                {spot.address}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !isDeleting && onClose()}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          {/* Full Uploaded Photo (Un-cropped preview display) */}
          {spot.image_url && (
            <div className="relative w-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-100 shadow-md">
              <img
                src={spot.image_url}
                alt={spot.title}
                className="w-full max-h-80 object-contain bg-black/90"
              />
            </div>
          )}

          {/* Full Text of '우리의 이야기' */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-current" />
              우리의 이야기 (전문)
            </label>
            {spot.description ? (
              <p className="text-sm font-medium text-gray-700 leading-relaxed bg-rose-50/30 rounded-2xl p-4 border border-rose-100/50 whitespace-pre-wrap">
                {spot.description}
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6 font-medium italic bg-gray-50 rounded-2xl border border-gray-100">
                작성된 데이트 메모가 없습니다.
              </p>
            )}
          </div>

          {/* Location Coordinates */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold pt-3 border-t border-gray-100">
            <span>📍 위도: {spot.latitude.toFixed(6)}</span>
            <span>경도: {spot.longitude.toFixed(6)}</span>
          </div>

          {/* Delete Pin Button */}
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="w-full mt-2 py-3.5 bg-red-50 hover:bg-red-100 border border-red-200/60 text-red-600 rounded-xl text-xs font-bold active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>기록 삭제 중...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>핀 삭제 (데이트 기록 완전 제거)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
