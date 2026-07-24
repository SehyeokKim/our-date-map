"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Calendar, Heart, MapPin, Loader2 } from "lucide-react";
import { LatLng } from "@/types/spot";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  latLng: LatLng | null;
  initialAddress?: string;
  onSubmit: (data: {
    title: string;
    description: string;
    latLng: LatLng;
    imageFiles?: File[];
    visitedAt: string;
    address?: string;
    userId?: string | null;
    createdBy?: string | null;
  }) => Promise<boolean>;

  isUploading: boolean;
  currentUserId?: string | null;
  currentUserNickname?: string | null;
  currentUserAvatarUrl?: string | null;
}

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  isOpen,
  onClose,
  latLng,
  initialAddress = "",
  onSubmit,
  isUploading,
  currentUserId,
  currentUserNickname,
  currentUserAvatarUrl,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      const today = new Date().toISOString().split("T")[0];
      setVisitedAt(today);
      setImageFiles([]);
      setPreviewUrls([]);
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      if (imageFiles.length + selectedFiles.length > 10) {
        alert("사진은 최대 10장까지 업로드할 수 있습니다.");
      }

      const combinedFiles = [...imageFiles, ...selectedFiles].slice(0, 10);
      setImageFiles(combinedFiles);

      // Revoke old previews
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // Generate new preview URLs
      const newUrls = combinedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(newUrls);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedFiles = imageFiles.filter((_, idx) => idx !== indexToRemove);
    setImageFiles(updatedFiles);

    URL.revokeObjectURL(previewUrls[indexToRemove]);
    const updatedUrls = previewUrls.filter((_, idx) => idx !== indexToRemove);
    setPreviewUrls(updatedUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latLng) return;

    // Fallback: If title is left empty, use the extracted road address as default title
    const finalTitle = title.trim() || initialAddress.trim() || "소중한 데이트 장소";

    const success = await onSubmit({
      title: finalTitle,
      description,
      latLng,
      imageFiles,
      visitedAt,
      address: initialAddress,
      userId: currentUserId || null,
      createdBy: currentUserId || null,
    });

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-bounce-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
            <h2 className="text-lg font-bold text-gray-900">데이트 기록 남기기</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Creator Badge Preview if logged in */}
          {currentUserNickname && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-900 text-xs font-semibold">
              {currentUserAvatarUrl ? (
                <img
                  src={currentUserAvatarUrl}
                  alt={currentUserNickname}
                  className="w-5 h-5 rounded-full object-cover border border-amber-200"
                />
              ) : (
                <span>✍️</span>
              )}
              <span>작성자: <strong>{currentUserNickname}</strong> 님으로 기록됩니다</span>
            </div>
          )}

          {/* Extract address preview */}
          {initialAddress && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50/80 px-3 py-2 rounded-xl border border-rose-100">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{initialAddress}</span>
            </div>
          )}

          {/* Place Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              장소 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={initialAddress || "예: 남산서울타워, 성수동 맛집"}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              disabled={isUploading}
            />
          </div>

          {/* Visited Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">데이트 날짜</label>
            <div className="relative">
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all pr-10"
                disabled={isUploading}
              />
              <Calendar className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Multiple Image Upload up to 10 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                추억 사진 (최대 10장)
              </label>
              <span className="text-[11px] font-bold text-rose-500">{imageFiles.length} / 10</span>
            </div>

            {/* Photo Previews Slider */}
            {previewUrls.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 group"
                  >
                    <img src={url} alt={`미리보기 ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={isUploading}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {imageFiles.length < 10 && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100/80 cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 font-semibold">
                  {imageFiles.length === 0 ? "사진 추가하기 (최대 10장)" : "사진 추가하기"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">우리의 이야기 (메모)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이곳에서 나눈 이야기를 남겨보세요."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
              disabled={isUploading}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-extrabold text-sm transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>소중한 추억을 등록하는 중...</span>
                </>
              ) : (
                <span>데이트 기록 저장하기 💖</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
