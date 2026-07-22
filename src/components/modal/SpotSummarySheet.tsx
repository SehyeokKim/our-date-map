"use client";

import React from "react";
import { Heart, X, ExternalLink, MapPin, Image as ImageIcon } from "lucide-react";
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

  // Representative photo (first photo in array or fallback single image_url)
  const representativePhoto =
    spot.image_urls && spot.image_urls.length > 0
      ? spot.image_urls[0]
      : spot.image_url;

  const photoCount =
    spot.image_urls && spot.image_urls.length > 0
      ? spot.image_urls.length
      : spot.image_url
      ? 1
      : 0;

  const handleTitleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onOpenDetail(spot);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-xs p-4 transition-all duration-300 pointer-events-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 z-10 animate-bounce-in flex flex-col gap-3 pointer-events-auto">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 pr-4">
            <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-rose-50 text-[10px] text-rose-500 font-bold border border-rose-100">
              <Heart className="w-3 h-3 fill-current" />
              {formattedDate}
            </span>

            {/* Clickable Title (📍 장소) -> Opens Full Detail View Popup */}
            <div className="mt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                📍 장소
              </span>
              <h2
                onClick={handleTitleClick}
                onTouchEnd={handleTitleClick}
                title="클릭하여 자세히 보기 창 열기"
                className="text-base font-bold text-gray-900 hover:text-rose-600 cursor-pointer transition-all duration-150 flex items-center gap-1.5 mt-0.5 group underline-offset-4 hover:underline touch-manipulation"
              >
                <span>{spot.title}</span>
                <ExternalLink className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform flex-shrink-0" />
              </h2>
            </div>

            {spot.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                {spot.address}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Representative Single Photo Preview (if present) */}
        {representativePhoto && (
          <div
            onClick={handleTitleClick}
            onTouchEnd={handleTitleClick}
            className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-100 group cursor-pointer touch-manipulation"
          >
            <img
              src={representativePhoto}
              alt={spot.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {photoCount > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                +{photoCount - 1}장 더보기
              </span>
            )}
          </div>
        )}

        {/* First Line of '우리의 이야기' */}
        {spot.description && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
              우리의 이야기
            </span>
            <p
              onClick={handleTitleClick}
              onTouchEnd={handleTitleClick}
              className="text-xs font-medium text-gray-600 bg-gray-50 rounded-xl p-2.5 border border-gray-100/60 line-clamp-1 cursor-pointer hover:bg-rose-50/20 hover:border-rose-100 transition-colors leading-relaxed touch-manipulation"
            >
              {spot.description.split("\n")[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
