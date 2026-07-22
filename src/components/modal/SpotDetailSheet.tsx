"use client";

import React, { useState, useEffect } from "react";
import { Heart, X, MapPin, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { DateSpot } from "@/types/spot";

interface SpotDetailSheetProps {
  spot: DateSpot | null;
  onClose: () => void;
  onDelete?: (spot: DateSpot) => Promise<boolean>;
}

export const SpotDetailSheet: React.FC<SpotDetailSheetProps> = ({
  spot,
  onClose,
  onDelete,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsDeleting(false);
  }, [spot]);

  if (!spot) return null;

  const photos: string[] =
    spot.image_urls && spot.image_urls.length > 0
      ? spot.image_urls
      : spot.image_url
      ? [spot.image_url]
      : [];

  const formattedDate = new Date(spot.visited_at)
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm("이 데이트 핀을 삭제하시겠습니까?\n(삭제 시 3일 동안 보관된 후 영구 삭제됩니다)");
    if (!confirmed) return;

    setIsDeleting(true);
    const success = await onDelete(spot);
    setIsDeleting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-4 transition-all duration-300 pointer-events-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-bounce-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-[11px] text-white font-bold shadow-xs">
              <Heart className="w-3 h-3 fill-current" />
              {formattedDate}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Place Title & Address */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              📍 장소
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 mt-0.5 leading-snug">
              {spot.title}
            </h2>
            {spot.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                {spot.address}
              </p>
            )}
          </div>

          {/* Full Gallery Photo Carousel (Up to 10 photos) */}
          {photos.length > 0 && (
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border border-gray-100 bg-gray-900 group shadow-sm">
              <img
                src={photos[currentImageIndex]}
                alt={`${spot.title} 사진 ${currentImageIndex + 1}`}
                className="w-full h-full object-contain bg-black/90 transition-all duration-300"
              />

              {/* Navigation Controls if multiple photos */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Photo Index Counter */}
                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {currentImageIndex + 1} / {photos.length}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Complete Full Text of '우리의 이야기' */}
          {spot.description && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                우리의 이야기
              </span>
              <div className="text-sm font-medium text-gray-700 bg-rose-50/20 rounded-2xl p-4 border border-rose-100/60 leading-relaxed whitespace-pre-wrap">
                {spot.description}
              </div>
            </div>
          )}

          {/* Coordinates Info */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>위도: {spot.latitude.toFixed(6)}</span>
            <span>경도: {spot.longitude.toFixed(6)}</span>
          </div>

          {/* '핀 삭제' (Delete Pin) Button at bottom of detail view */}
          {onDelete && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "핀 삭제 처리 중..." : "핀 삭제"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
