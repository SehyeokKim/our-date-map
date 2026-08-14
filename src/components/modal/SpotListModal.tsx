"use client";

import React from "react";
import { DateSpot } from "@/types/spot";
import { X, Heart, MapPin, Camera } from "lucide-react";

interface SpotListModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: DateSpot[];
  onSelectSpot: (spot: DateSpot) => void;
}

export const SpotListModal: React.FC<SpotListModalProps> = ({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
}) => {
  if (!isOpen) return null;

  // Newest memories first
  const sortedSpots = [...spots].sort(
    (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getThumbnail = (spot: DateSpot) =>
    spot.image_urls?.[0] || spot.image_url || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/60 max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Heart className="w-4 h-4 text-white fill-current" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">추억 모아보기</h2>
              <p className="text-[10px] text-rose-100">
                지도에 기록된 우리의 데이트 장소 {spots.length}곳
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spot List Content */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[65vh]">
          {sortedSpots.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-400 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-700">아직 기록된 추억이 없습니다</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                지도를 터치해서 우리의 첫 데이트 장소를 기록해 보세요!
              </p>
            </div>
          ) : (
            sortedSpots.map((spot) => {
              const thumbnail = getThumbnail(spot);
              return (
                <button
                  key={spot.id}
                  onClick={() => onSelectSpot(spot)}
                  className="w-full flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:border-rose-200 hover:bg-rose-50/50 active:scale-[0.98] transition-all cursor-pointer text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-rose-50 flex items-center justify-center">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={spot.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-rose-300" />
                    )}
                  </div>

                  {/* Spot Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-800 truncate">{spot.title}</h3>
                    <p className="text-[11px] text-rose-500 font-medium">
                      {formatDate(spot.visited_at)}
                    </p>
                    {spot.description && (
                      <p className="text-[11px] text-gray-500 truncate">
                        {spot.description.split("\n")[0]}
                      </p>
                    )}
                  </div>

                  <MapPin className="w-4 h-4 shrink-0 text-gray-300" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
