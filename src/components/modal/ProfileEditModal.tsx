import React, { useState, useEffect } from "react";
import { X, Camera, Loader2, User as UserIcon, Heart, LogOut, Copy, Check, Unlink } from "lucide-react";
import { Profile } from "@/types/spot";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname?: string | null;
  currentAvatarUrl?: string | null;
  /** 내 식별 태그 (#0000) */
  myTag?: string;
  /** 서로 연결된 파트너 */
  partner?: Profile | null;
  onSave: (newNickname: string, imageFile?: File | null) => Promise<boolean>;
  /** 커플 연결 해제 — 성공하면 커플 연결 화면으로 돌아간다 */
  onDisconnect?: () => Promise<boolean>;
  onLogout?: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentNickname = "",
  currentAvatarUrl = null,
  myTag,
  partner = null,
  onSave,
  onDisconnect,
  onLogout,
}) => {
  const [nickname, setNickname] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyMyTag = async () => {
    if (!myTag) return;
    try {
      await navigator.clipboard.writeText(`#${myTag}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 화면의 태그를 보고 알려주면 된다
    }
  };

  const handleDisconnect = async () => {
    if (!onDisconnect || !partner) return;
    const confirmed = window.confirm(
      `${partner.nickname || "상대방"}#${partner.tag ?? ""}님과의 커플 연결을 해제할까요?\n\n해제하면 서로의 기록이 보이지 않아요. 기록은 지워지지 않고, 다시 연결하면 보여요.`
    );
    if (!confirmed) return;

    setIsDisconnecting(true);
    const success = await onDisconnect();
    setIsDisconnecting(false);
    if (success) onClose();
  };

  const busy = isSaving || isDisconnecting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-surface rounded-3xl shadow-[var(--shadow-sheet)] animate-bounce-in flex flex-col pointer-events-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-memory-tint">
          <h2 className="font-display text-base text-ink">프로필 수정</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center text-ink-subtle hover:text-ink-muted hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profile Avatar Upload Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-memory-line shadow-md group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="프로필 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-memory-tint flex items-center justify-center text-memory">
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
                  disabled={busy}
                  className="hidden"
                />
              </label>
            </div>

            <label className="mt-1.5 text-xs font-semibold text-memory hover:underline cursor-pointer flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>프로필 사진 선택</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={busy}
                className="hidden"
              />
            </label>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              닉네임 <span className="text-memory">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용할 닉네임을 입력해 주세요"
              className="w-full px-4 py-2.5 bg-surface-2 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-memory focus:bg-surface transition-all font-medium"
              disabled={busy}
              maxLength={20}
            />
          </div>

          {/* 내 태그 — 닉네임은 바뀌어도 태그는 그대로다 */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1">내 태그</label>
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2 border border-line rounded-xl">
              <span className="text-sm font-bold text-memory tracking-wider">#{myTag ?? "····"}</span>
              <button
                type="button"
                onClick={copyMyTag}
                disabled={!myTag}
                className="flex items-center gap-1 text-[11px] font-bold text-ink-muted hover:text-memory transition-colors cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-ink-subtle leading-tight">
              닉네임을 바꿔도 태그는 그대로예요. 상대방은 이 태그로 나를 찾아요.
            </p>
          </div>

          {/* 연결된 커플 파트너 */}
          {partner && (
            <div>
              <label className="block text-xs font-bold text-ink mb-1 flex items-center justify-between">
                <span>커플 파트너</span>
                <span className="text-[10px] text-memory font-normal flex items-center gap-0.5">
                  <Heart className="w-3 h-3 fill-memory" />
                  <span>연결됨</span>
                </span>
              </label>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-surface-2 border border-line rounded-xl">
                {partner.profile_image_url ? (
                  <img
                    src={partner.profile_image_url.replace(/^http:\/\//i, "https://")}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-line"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-memory-tint flex items-center justify-center text-memory">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="flex-1 min-w-0 truncate text-xs font-bold text-ink">
                  {partner.nickname || "상대방"}
                  <span className="text-memory">#{partner.tag}</span>
                </span>
                {onDisconnect && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={busy}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-ink-subtle hover:text-warn hover:bg-warn-tint transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Unlink className="w-3.5 h-3.5" />
                    )}
                    연결 해제
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-ink-subtle leading-tight">
                팝캣 알림은 파트너 기기로만 전송돼요.
              </p>
            </div>
          )}

          {/* Action Buttons: 취소 & 저장 */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-2.5 bg-surface-2 hover:bg-line text-ink-muted rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-2.5 bg-memory hover:bg-memory-strong text-on-accent rounded-xl font-bold text-xs transition-all shadow-[var(--shadow-card)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              disabled={busy}
              className="w-full mt-1 py-2.5 bg-surface hover:bg-memory-tint text-memory border border-memory-line rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
