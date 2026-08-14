"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  X,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ImagePlus,
} from "lucide-react";
import { DateSpot } from "@/types/spot";

export interface SpotUpdates {
  title: string;
  description: string;
  visitedAt: string;
  keptImageUrls: string[];
  newImageFiles: File[];
}

interface SpotDetailSheetProps {
  spot: DateSpot | null;
  onClose: () => void;
  onDelete?: (spot: DateSpot) => Promise<boolean>;
  onUpdate?: (spot: DateSpot, updates: SpotUpdates) => Promise<DateSpot | null>;
  currentUserId?: string | null;
}

export const SpotDetailSheet: React.FC<SpotDetailSheetProps> = ({
  spot,
  onClose,
  onDelete,
  onUpdate,
  currentUserId,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit mode state (title / date / story / photos)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [keptPhotos, setKeptPhotos] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsDeleting(false);
    setIsEditing(false);
    setIsSaving(false);
    setNewFiles([]);
    setNewPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  }, [spot]);

  if (!spot) return null;

  const isOwner = Boolean(
    currentUserId &&
      (spot.user_id === currentUserId || spot.created_by === currentUserId)
  );

  const creatorNickname = spot.profiles?.nickname;
  const rawCreatorAvatar = spot.profiles?.profile_image_url;
  const creatorAvatarUrl = rawCreatorAvatar
    ? rawCreatorAvatar.replace(/^http:\/\//i, "https://")
    : null;

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

  const totalPhotoCount = keptPhotos.length + newFiles.length;

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

  const startEditing = () => {
    setEditTitle(spot.title);
    setEditDate(new Date(spot.visited_at).toISOString().split("T")[0]);
    setEditDescription(spot.description || "");
    setKeptPhotos(photos);
    setNewFiles([]);
    setNewPreviews([]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewFiles([]);
    setNewPreviews([]);
    setIsEditing(false);
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const remaining = Math.max(0, 10 - totalPhotoCount);
    const selected = Array.from(e.target.files).slice(0, remaining);
    setNewFiles((prev) => [...prev, ...selected]);
    setNewPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeKeptPhoto = (index: number) => {
    setKeptPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!onUpdate || isSaving) return;
    setIsSaving(true);
    const updated = await onUpdate(spot, {
      title: editTitle,
      description: editDescription,
      visitedAt: editDate,
      keptImageUrls: keptPhotos,
      newImageFiles: newFiles,
    });
    setIsSaving(false);
    if (updated) {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setNewPreviews([]);
      setCurrentImageIndex(0);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm("이 데이트 핀을 삭제하시겠습니까?\n(삭제 시 휴지통으로 이동하며 30일 동안 보관된 후 영구 삭제됩니다)");
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
              {isEditing ? (
                <>
                  <Pencil className="w-3 h-3" />
                  기록 수정
                </>
              ) : (
                <>
                  <Heart className="w-3 h-3 fill-current" />
                  {formattedDate}
                </>
              )}
            </span>
            {!isEditing && onUpdate && (
              <button
                type="button"
                onClick={startEditing}
                className="w-6 h-6 rounded-full bg-white text-gray-400 flex items-center justify-center hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                aria-label="기록 수정"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
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
          {isEditing ? (
            <>
              {/* Edit: Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">장소 제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>

              {/* Edit: Visited Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">데이트 날짜</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>

              {/* Edit: Photos */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  사진 ({totalPhotoCount}/10)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {keptPhotos.map((url, index) => (
                    <div
                      key={url}
                      className="relative aspect-square rounded-xl overflow-hidden border border-gray-200"
                    >
                      <img src={url} alt={`사진 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeKeptPhoto(index)}
                        disabled={isSaving}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
                        aria-label="사진 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newPreviews.map((url, index) => (
                    <div
                      key={url}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-rose-300"
                    >
                      <img src={url} alt={`새 사진 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        disabled={isSaving}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
                        aria-label="새 사진 제거"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {totalPhotoCount < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:border-rose-300 hover:text-rose-400 cursor-pointer transition-colors">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[9px] font-bold">추가</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddFiles}
                        disabled={isSaving}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Edit: Story */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">우리의 이야기</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Edit: Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editTitle.trim() || !editDate}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Creator Badge & Place Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    📍 장소
                  </span>

                  {/* Creator Info / Ownership Badge */}
                  {(creatorNickname || isOwner) && (
                    <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/80 rounded-full px-2.5 py-0.5 text-[11px] text-amber-900 font-semibold">
                      {creatorAvatarUrl ? (
                        <img
                          src={creatorAvatarUrl}
                          alt={creatorNickname || "작성자"}
                          className="w-4 h-4 rounded-full object-cover border border-amber-300"
                        />
                      ) : (
                        <span className="text-[10px]">✍️</span>
                      )}
                      <span>
                        작성자: {creatorNickname || "카카오 사용자"}
                        {isOwner ? " (내 기록)" : ""}
                      </span>
                    </div>
                  )}
                </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
