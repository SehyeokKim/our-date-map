"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Calendar, Heart, MapPin, Loader2, Film } from "lucide-react";
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
    videoFiles?: File[];
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
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      const today = new Date().toISOString().split("T")[0];
      setVisitedAt(today);
      setImageFiles([]);
      setPreviewUrls([]);
      setVideoFiles([]);
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

  // Promote a selected photo to the representative thumbnail (first position = image_urls[0])
  const makeThumbnail = (indexToPromote: number) => {
    if (indexToPromote === 0) return;
    setImageFiles((prev) => [prev[indexToPromote], ...prev.filter((_, idx) => idx !== indexToPromote)]);
    setPreviewUrls((prev) => [prev[indexToPromote], ...prev.filter((_, idx) => idx !== indexToPromote)]);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setVideoFiles((prev) => [...prev, ...selected]);
      e.target.value = "";
    }
  };

  const removeVideo = (indexToRemove: number) => {
    setVideoFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatFileSizeMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latLng) return;

    // Soft cap: warn (but do not block) when the estimated upload exceeds 30MB per pin
    const estimatedBytes =
      videoFiles.reduce((sum, f) => sum + f.size, 0) + imageFiles.length * 300 * 1024;
    const estimatedMB = estimatedBytes / (1024 * 1024);
    if (estimatedMB > 30) {
      const proceed = window.confirm(
        `핀당 권장 용량은 30MB입니다.\n지금 약 ${estimatedMB.toFixed(1)}MB를 업로드하려고 합니다. 정말 올릴까요?\n\n(무료 저장 공간(1GB)이 빠르게 소진될 수 있어요)`
      );
      if (!proceed) return;
    }

    // Fallback: If title is left empty, use the extracted road address as default title
    const finalTitle = title.trim() || initialAddress.trim() || "소중한 데이트 장소";

    const success = await onSubmit({
      title: finalTitle,
      description,
      latLng,
      imageFiles,
      videoFiles,
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
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-[var(--shadow-sheet)] overflow-hidden animate-bounce-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-memory-tint">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-memory fill-current" />
            <h2 className="font-display text-lg text-ink">데이트 기록 남기기</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center text-ink-subtle hover:text-ink-muted hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Creator Badge Preview if logged in */}
          {currentUserNickname && (
            <div className="flex items-center gap-2 px-3 py-2 bg-warn-tint border border-warn/25 rounded-xl text-warn text-xs font-semibold">
              {currentUserAvatarUrl ? (
                <img
                  src={currentUserAvatarUrl}
                  alt={currentUserNickname}
                  className="w-5 h-5 rounded-full object-cover border border-warn/30"
                />
              ) : (
                <span>✍️</span>
              )}
              <span>작성자: <strong>{currentUserNickname}</strong> 님으로 기록됩니다</span>
            </div>
          )}

          {/* Extract address preview */}
          {initialAddress && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-memory bg-memory-tint px-3 py-2 rounded-xl border border-memory-line">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{initialAddress}</span>
            </div>
          )}

          {/* Place Title */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              장소 이름 <span className="text-memory">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={initialAddress || "예: 남산서울타워, 성수동 맛집"}
              className="w-full px-4 py-3 bg-surface-2 border border-line rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-memory focus:bg-surface transition-all"
              disabled={isUploading}
            />
          </div>

          {/* Visited Date */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1">데이트 날짜</label>
            <div className="relative">
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-line rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-memory focus:bg-surface transition-all pr-10"
                disabled={isUploading}
              />
              <Calendar className="w-5 h-5 text-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Multiple Image Upload up to 10 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-ink">
                추억 사진 (최대 10장)
              </label>
              <span className="text-[11px] font-bold text-memory">{imageFiles.length} / 10</span>
            </div>

            {/* Photo Previews Slider (tap a photo to set it as the representative thumbnail) */}
            {previewUrls.length > 0 && (
              <>
                <p className="text-[10px] text-ink-subtle mb-1.5 leading-tight">
                  사진을 누르면 대표 사진(썸네일)으로 지정됩니다.
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => !isUploading && makeThumbnail(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 group cursor-pointer transition-all ${
                        idx === 0
                          ? "border-2 border-memory ring-2 ring-memory-line"
                          : "border border-line hover:border-memory-line"
                      }`}
                    >
                      <img src={url} alt={`미리보기 ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        disabled={isUploading}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 ? (
                        <span className="absolute bottom-1 left-1 bg-memory text-on-accent text-[9px] font-bold px-1.5 py-0.5 rounded">
                          ⭐ 대표
                        </span>
                      ) : (
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {imageFiles.length < 10 && (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-line rounded-2xl bg-surface-2 hover:bg-line/60 cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-ink-subtle mb-1" />
                <span className="text-xs text-ink-muted font-semibold">
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

          {/* Video Upload (uploaded as-is, no compression) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-ink">추억 동영상</label>
              {videoFiles.length > 0 && (
                <span className="text-[11px] font-bold text-memory">
                  총 {formatFileSizeMB(videoFiles.reduce((s, f) => s + f.size, 0))}
                </span>
              )}
            </div>

            {videoFiles.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {videoFiles.map((file, idx) => (
                  <div
                    key={`${file.name}_${idx}`}
                    className="flex items-center gap-2.5 px-3 py-2 bg-surface-2 border border-line rounded-xl"
                  >
                    <Film className="w-4 h-4 text-memory shrink-0" />
                    <span className="flex-1 min-w-0 text-xs font-medium text-ink-muted truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] font-bold text-ink-subtle shrink-0">
                      {formatFileSizeMB(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVideo(idx)}
                      disabled={isUploading}
                      className="w-5 h-5 rounded-full bg-line text-ink-muted flex items-center justify-center hover:bg-memory hover:text-on-accent transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-1.5 w-full py-2.5 border-2 border-dashed border-line rounded-2xl bg-surface-2 hover:bg-line/60 cursor-pointer transition-all">
              <Film className="w-4 h-4 text-ink-subtle" />
              <span className="text-xs text-ink-muted font-semibold">동영상 추가하기</span>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <p className="mt-1 text-[10px] text-ink-subtle leading-tight">
              원본 그대로 업로드됩니다. 핀당 권장 용량은 30MB입니다 (초과 시 확인 후 업로드).
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1">우리의 이야기 (메모)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이곳에서 나눈 이야기를 남겨보세요."
              rows={3}
              className="w-full px-4 py-3 bg-surface-2 border border-line rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-memory focus:bg-surface transition-all resize-none"
              disabled={isUploading}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3.5 bg-memory hover:bg-memory-strong text-on-accent rounded-2xl font-extrabold text-sm transition-all shadow-[var(--shadow-card)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
