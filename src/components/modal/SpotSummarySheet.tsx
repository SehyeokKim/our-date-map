"use client";

import React from "react";
import { Heart, X, ChevronRight, MapPin } from "lucide-react";
import { DateSpot } from "@/types/spot";

interface SpotSummarySheetProps {
  spot: DateSpot | null;
  onClose: () => void;
  onOpenDetail: (spot: DateSpot) => void;
}

export const SpotSummarySheet: React.FC<SpotSummarySheetProps> = ({
  spot,
  onClose,
  onOpenDetail,
}) => {
  if (!spot) return null;

  const formattedDate = new Date(spot.visited_at)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");

  const handleTitleClick = () => {
    onOpenDetail(spot);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/30 backdrop-blur-xs p-4 transition-all duration-300">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 z-10 animate-bounce-in flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 cursor-pointer group pr-4" onClick={handleTitleClick}>
            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-rose-50 text-[10px] text-rose-500 font-bold border border-rose-100">
              <Heart className="w-3 h-3 fill-current" />
              {formattedDate}
            </span>
            <h2 className="text-base font-bold text-gray-800 group-hover:text-rose-600 transition-colors flex items-center gap-1 mt-0.5">
              {spot.title}
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
            </h2>
            {spot.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                {spot.address}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {spot.description && (
          <p
            onClick={handleTitleClick}
            className="text-xs font-medium text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100/60 line-clamp-2 cursor-pointer hover:bg-gray-100/60 transition-colors"
          >
            {spot.description}
          </p>
        )}

        <button
          type="button"
          onClick={handleTitleClick}
          className="w-full mt-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/15 active:scale-98 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>자세히 보기</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
