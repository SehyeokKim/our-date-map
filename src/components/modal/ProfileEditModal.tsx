import React, { useState, useEffect } from "react";
import { X, Camera, Loader2, User as UserIcon, Heart } from "lucide-react";
import { Profile } from "@/types/spot";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname?: string | null;
  currentAvatarUrl?: string | null;
  currentPartnerId?: string | null;
  fetchAvailablePartners?: () => Promise<Profile[]>;
  onSave: (newNickname: string, imageFile?: File | null, partnerId?: string | null) => Promise<boolean>;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentNickname = "",
  currentAvatarUrl = null,
  currentPartnerId = null,
  fetchAvailablePartners,
  onSave,
}) => {
  const [nickname, setNickname] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>("");
  const [availablePartners, setAvailablePartners] = useState<Profile[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || "");
      setImageFile(null);
      setPreviewUrl(currentAvatarUrl || null);
      setPartnerId(currentPartnerId || "");

      if (fetchAvailablePartners) {
        setIsLoadingPartners(true);
        fetchAvailablePartners().then((partners) => {
          setAvailablePartners(partners);
          setIsLoadingPartners(false);
        });
      }
    }
  }, [isOpen, currentNickname, currentAvatarUrl, currentPartnerId, fetchAvailablePartners]);

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
    const success = await onSave(nickname.trim(), imageFile, partnerId.trim() || null);
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Avatar Upload Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-rose-200 shadow-md group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="프로필 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-400">
                  <UserIcon className="w-9 h-9" />
                </div>
              )}

              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Camera className="w-5 h-5 mb-0.5" />
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

            <label className="mt-1.5 text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1">
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium"
              disabled={isSaving}
              maxLength={20}
            />
          </div>

          {/* Partner Selection Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
              <span>알림 수신 상대방 (커플 파트너)</span>
              <span className="text-[10px] text-rose-500 font-normal flex items-center gap-0.5">
                <Heart className="w-3 h-3 fill-rose-500" />
                <span>찌르기 알림 대상</span>
              </span>
            </label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium text-gray-800"
              disabled={isSaving || isLoadingPartners}
            >
              <option value="">전체 기기 전송 (상대방 지정 안함)</option>
              {availablePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname || "이름 없는 사용자"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-gray-400 leading-tight">
              선택 시 팝캣 알림이 이 상대방 기기로만 전송됩니다.
            </p>
          </div>

          {/* Action Buttons: 취소 & 저장 */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
