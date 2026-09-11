"use client";

import React from "react";
import { Heart, Lock, MessageSquare } from "lucide-react";

interface LoginPromptProps {
  onLoginWithKakao: () => void;
}

// 기록은 서로를 파트너로 지정한 커플만 읽을 수 있어서, 로그인하지 않으면 지도에 아무것도 보이지 않는다.
// 빈 지도만 보고 헤매지 않도록 로그인을 먼저 안내한다.
export const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginWithKakao }) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/30 backdrop-blur-xs">
    <div className="w-full max-w-sm bg-surface rounded-3xl shadow-[var(--shadow-sheet)] border border-line p-6 flex flex-col items-center text-center gap-4 animate-bounce-in">
      <div className="w-14 h-14 rounded-full bg-memory-tint border border-memory-line flex items-center justify-center text-memory">
        <Heart className="w-6 h-6 fill-memory" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-display text-lg text-ink">우리 둘만의 데이트 지도</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          기록은 서로를 파트너로 지정한 커플만 볼 수 있어요.
          <br />
          로그인하면 함께 남긴 추억이 지도에 나타나요.
        </p>
      </div>

      <button
        type="button"
        onClick={onLoginWithKakao}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        <MessageSquare className="w-4 h-4 fill-[#191919]" />
        <span>카카오로 3초 로그인</span>
      </button>

      <p className="flex items-center gap-1 text-[10px] text-ink-subtle">
        <Lock className="w-3 h-3" />
        닉네임과 프로필 사진만 받아요
      </p>
    </div>
  </div>
);
