"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Sparkles } from "lucide-react";

interface AddPlannedSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  latLng: { lat: number; lng: number } | null;
  initialAddress?: string;
  onSubmit: (title: string, memo: string | undefined, lat: number, lng: number, address?: string) => void;
}

export const AddPlannedSpotModal: React.FC<AddPlannedSpotModalProps> = ({
  isOpen,
  onClose,
  latLng,
  initialAddress = "",
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setMemo("");
    }
  }, [isOpen]);

  if (!isOpen || !latLng) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit(title, memo || undefined, latLng.lat, latLng.lng, initialAddress);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">미래 데이트 플랜 추가</h3>
              <p className="text-xs text-gray-500">방문하고 싶은 장소를 코스에 추가해요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Address preview */}
        {initialAddress && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-violet-50/60 rounded-xl text-violet-700 text-xs font-medium border border-violet-100">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{initialAddress}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              장소 / 목적지 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 성수동 온량, 남산타워 산책, 한강 공원 픽닉"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              계획 메모 (선택)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 오후 2시 예약완료, 창가 자리 요청하기"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md shadow-violet-200"
            >
              플랜 코스에 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
