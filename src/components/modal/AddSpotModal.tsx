"use client";

import React, { useState } from "react";
import { Heart, X, Camera, AlertCircle, Loader2 } from "lucide-react";
import { LatLng } from "@/types/spot";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  latLng: LatLng | null;
  onSubmit: (params: {
    title: string;
    description: string;
    latLng: LatLng;
    imageFile: File | null;
    visitedAt: string;
  }) => Promise<boolean>;
  isUploading: boolean;
}

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  isOpen,
  onClose,
  latLng,
  onSubmit,
  isUploading,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visitedAt, setVisitedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latLng) return;

    const success = await onSubmit({
      title,
      description,
      latLng,
      imageFile,
      visitedAt,
    });

    if (success) {
      setTitle("");
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="absolute inset-0" onClick={() => !isUploading && onClose()} />

      <div className="relative w-full max-w-md bg-white rounded-t-[32px] md:rounded-2xl shadow-2xl p-6 z-10 animate-bounce-in max-h-[85vh] overflow-y-auto flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            데이트 기록 남기기
          </h2>
          <button
            type="button"
            onClick={() => !isUploading && onClose()}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">데이트 사진</label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden group border border-gray-100">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-black/75 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-rose-50/10 hover:border-rose-300 transition-all duration-200">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-rose-50/80 flex items-center justify-center border border-rose-100">
                    <Camera className="w-5 h-5 text-rose-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 mt-1">이곳을 눌러 사진 추가</p>
                  <p className="text-[10px] text-gray-400">최대 10MB (자동 압축 업로드)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-xs font-semibold text-gray-500">
              장소/제목
            </label>
            <input
              id="title"
              type="text"
              placeholder="어디서 데이트를 하셨나요?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 transition-all duration-200 placeholder:text-gray-400 font-medium"
              required
              disabled={isUploading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="date" className="text-xs font-semibold text-gray-500">
              방문 날짜
            </label>
            <input
              id="date"
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 transition-all duration-200 font-medium"
              required
              disabled={isUploading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-xs font-semibold text-gray-500">
              데이트 메모
            </label>
            <textarea
              id="description"
              placeholder="이 장소에서의 달콤한 이야기를 적어보세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 transition-all duration-200 placeholder:text-gray-400 font-medium resize-none"
              disabled={isUploading}
            />
          </div>

          <div className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-rose-800 leading-relaxed font-medium">
              <p className="font-bold mb-0.5">📍 위치 지정 완료</p>
              지도를 터치하면 등록할 위치를 자유롭게 이동할 수 있습니다.
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full mt-2 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-rose-500/20 active:scale-98 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>기록 올리는 중...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-current" />
                <span>추억 기록하기</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
