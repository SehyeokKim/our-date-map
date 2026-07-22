"use client";

import React, { useState } from "react";
import { Heart, X, MapPin, Trash2, Loader2 } from "lucide-react";
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
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    if (window.confirm(`"${spot.title}" 데이트 기록을 정말로 삭제하시겠습니까?`)) {
      setIsDeleting(true);
      const success = await onDelete(spot);
      setIsDeleting(false);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="absolute inset-0" onClick={() => !isDeleting && onClose()} />

      <div className="relative w-full max-w-md bg-white rounded-t-[32px] md:rounded-2xl shadow-2xl overflow-hidden z-10 animate-bounce-in max-h-[85vh] flex flex-col">
        {spot.image_url ? (
          <div className="relative w-full h-64 overflow-hidden">
            <img src={spot.image_url} alt={spot.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <button
              onClick={() => !isDeleting && onClose()}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/35 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                <Heart className="w-3 h-3 fill-current" />
                {formattedDate}
              </span>
              <h2 className="text-xl font-bold mt-2 tracking-tight drop-shadow-md">{spot.title}</h2>
              {spot.address && (
                <p className="text-xs text-white/90 flex items-center gap-1 mt-1 font-medium drop-shadow">
                  <MapPin className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
                  {spot.address}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 pb-2 flex items-center justify-between border-b border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full bg-rose-50 text-[10px] text-rose-500 font-bold tracking-wide uppercase border border-rose-100">
                <Heart className="w-3 h-3 fill-current" />
                {formattedDate}
              </span>
              <h2 className="text-lg font-bold text-gray-800 mt-1">{spot.title}</h2>
              {spot.address && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  {spot.address}
                </p>
              )}
            </div>
            <button
              onClick={() => !isDeleting && onClose()}
              className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6 pt-4 flex flex-col gap-4 overflow-y-auto max-h-[40vh]">
          {spot.description ? (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                우리의 이야기
              </label>
              <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100/50 whitespace-pre-wrap">
                {spot.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-6 font-medium italic">
              작성된 데이트 메모가 없습니다.
            </p>
          )}

          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mt-2 pt-4 border-t border-gray-100">
            <span>📍 위도: {spot.latitude.toFixed(6)}</span>
            <span>경도: {spot.longitude.toFixed(6)}</span>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="w-full mt-2 py-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-xs font-semibold active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>기록 삭제 중...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>핀 삭제</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
