"use client";

import React, { useState, useEffect } from "react";
import { X, Camera, Loader2, User as UserIcon } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname?: string | null;
  currentAvatarUrl?: string | null;
  onSave: (newNickname: string, imageFile?: File | null) => Promise<boolean>;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentNickname = "",
  currentAvatarUrl = null,
  onSave,
}) => {
  const [nickname, setNickname] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || "");
      setImageFile(null);
      setPreviewUrl(currentAvatarUrl || null);
    }
  }, [isOpen, currentNickname, currentAvatarUrl]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    const success = await onSave(nickname.trim(), imageFile);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-bounce-in flex flex-col pointer-events-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-rose-50/50">
          <h2 className="text-base font-bold text-gray-900">프로필 수정</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Profile Avatar Upload Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-rose-200 shadow-md group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="프로필 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-400">
                  <UserIcon className="w-10 h-10" />
                </div>
              )}

              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Camera className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-bold">사진 변경</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSaving}
                  className="hidden"
                />
              </label>
            </div>

            <label className="mt-2 text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>프로필 사진 선택</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSaving}
                className="hidden"
              />
            </label>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              닉네임 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용할 닉네임을 입력해 주세요"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium"
              disabled={isSaving}
              maxLength={20}
            />
          </div>

          {/* Action Buttons: 취소 & 저장 */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-xs transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <span>저장</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
