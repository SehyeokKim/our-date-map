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
  }) => Promise<boolean>;
  isUploading: boolean;
}

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  isOpen,
  onClose,
  latLng,
  initialAddress = "",
  onSubmit,
  isUploading,
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
          {/* Consolidated Single Field: 📍 장소 (Place Input) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <span>📍 장소</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={initialAddress || "예: 서울특별시 마포구 독막로 123 예쁜 카페"}
              disabled={isUploading}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
            />
            {initialAddress && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 font-medium pl-1 mt-1">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                자동 감지된 위치: {initialAddress}
              </p>
            )}
          </div>

          {/* Visit Date Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>방문한 날짜</span>
            </label>
            <input
              type="date"
              required
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
            />
          </div>

          {/* Multiple Photo Upload (Up to 10 photos) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5 text-rose-500" />
                <span>추억 사진 (최대 10장)</span>
              </label>
              <span className="text-[11px] font-semibold text-rose-500">
                {imageFiles.length} / 10
              </span>
            </div>

            {/* Thumbnail Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img
                      src={url}
                      alt={`미리보기 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={isUploading}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-rose-500 text-[9px] font-bold text-white text-center py-0.5">
                        대표
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {imageFiles.length < 10 && (
              <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-rose-50/30 hover:border-rose-200 transition-all cursor-pointer">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 font-medium">
                  사진 추가 선택하기 (최대 10장)
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  자동 압축 저장 (JPG, PNG)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Description Story Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <span>우리의 이야기</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이곳에서 함께한 소중한 추억을 적어주세요..."
              disabled={isUploading}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>기록 저장 중...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-current" />
                <span>데이트 기록 저장하기</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
