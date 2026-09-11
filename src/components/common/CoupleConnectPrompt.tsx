"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, Hourglass, Link2, Loader2, LogOut, User as UserIcon, X } from "lucide-react";
import { PartnerLinkResult, PartnerRequest } from "@/hooks/usePartnerLink";

interface CoupleConnectPromptProps {
  myTag?: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  receivedRequests: PartnerRequest[];
  sentRequests: PartnerRequest[];
  busy: boolean;
  onSendRequest: (tag: string) => Promise<PartnerLinkResult>;
  onRespondRequest: (requestId: string, accept: boolean) => Promise<PartnerLinkResult>;
  onCancelRequest: (requestId: string) => Promise<PartnerLinkResult>;
  onLogout: () => void;
}

const Avatar: React.FC<{ url?: string | null; size?: string }> = ({ url, size = "w-10 h-10" }) =>
  url ? (
    <img src={url} alt="" className={`${size} rounded-full object-cover border border-line`} />
  ) : (
    <div className={`${size} rounded-full bg-memory-tint border border-memory-line flex items-center justify-center text-memory`}>
      <UserIcon className="w-1/2 h-1/2" />
    </div>
  );

/**
 * 로그인했지만 아직 커플이 아닐 때 앱 대신 보여주는 연결 화면.
 * 받은 요청 → 수락 화면, 보낸 요청 대기 중 → 기다리는 화면, 둘 다 없으면 → 태그 입력 화면 순으로 보여준다.
 */
export const CoupleConnectPrompt: React.FC<CoupleConnectPromptProps> = ({
  myTag,
  nickname,
  avatarUrl,
  receivedRequests,
  sentRequests,
  busy,
  onSendRequest,
  onRespondRequest,
  onCancelRequest,
  onLogout,
}) => {
  const [tagInput, setTagInput] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const incoming = receivedRequests[0] ?? null;
  const waiting = sentRequests[0] ?? null;

  // 기다리던 요청이 수락 없이 사라졌다면 (거절·취소) 입력 화면에서 알려준다
  const lastWaitingTagRef = useRef<string | null>(null);
  useEffect(() => {
    if (waiting) {
      lastWaitingTagRef.current = waiting.otherTag;
    } else if (lastWaitingTagRef.current) {
      setMessage({
        text: `#${lastWaitingTagRef.current}님에게 보낸 요청이 더 이상 대기 중이 아니에요. 상대방이 거절했을 수 있어요.`,
        tone: "info",
      });
      lastWaitingTagRef.current = null;
    }
  }, [waiting]);

  const copyMyTag = async () => {
    if (!myTag) return;
    try {
      await navigator.clipboard.writeText(`#${myTag}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 화면의 태그를 보고 직접 알려주면 된다
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const result = await onSendRequest(tagInput);
    if (result.ok) {
      setTagInput("");
    } else {
      setMessage({ text: result.message ?? "요청을 보내지 못했어요.", tone: "error" });
    }
  };

  const handleRespond = async (accept: boolean) => {
    if (!incoming) return;
    setMessage(null);
    const result = await onRespondRequest(incoming.id, accept);
    if (!result.ok) setMessage({ text: result.message ?? "요청을 처리하지 못했어요.", tone: "error" });
  };

  const handleCancel = async () => {
    if (!waiting) return;
    lastWaitingTagRef.current = null; // 직접 취소한 경우엔 거절 안내를 띄우지 않는다
    const result = await onCancelRequest(waiting.id);
    if (!result.ok) setMessage({ text: result.message ?? "요청을 취소하지 못했어요.", tone: "error" });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-surface rounded-3xl shadow-[var(--shadow-sheet)] border border-line p-6 flex flex-col gap-5 animate-bounce-in">
        {/* 내 태그 — 상대방이 이 태그로 나에게 요청을 보낸다 */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2 border border-line/70">
          <Avatar url={avatarUrl} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-ink-subtle">내 태그</p>
            <p className="text-sm font-bold text-ink truncate">
              {nickname || "나"}
              <span className="text-memory">#{myTag ?? "····"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={copyMyTag}
            disabled={!myTag}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-line text-[11px] font-bold text-ink-muted hover:text-memory hover:border-memory-line transition-colors cursor-pointer disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "복사됨" : "복사"}
          </button>
        </div>

        {incoming ? (
          /* ① 상대방이 먼저 보낸 요청 — 수락 화면 */
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar url={incoming.otherAvatarUrl} size="w-16 h-16" />
            <div className="space-y-1.5">
              <h2 className="font-display text-lg text-ink">커플 연결 요청이 왔어요</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                <b className="text-ink">
                  {incoming.otherNickname || "상대방"}
                  <span className="text-memory">#{incoming.otherTag}</span>
                </b>
                님이 커플 연결을 요청했어요.
                <br />
                수락하면 서로의 기록을 함께 볼 수 있어요.
              </p>
            </div>
            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => handleRespond(false)}
                disabled={busy}
                className="flex-1 py-3 bg-surface-2 hover:bg-line text-ink-muted rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                거절
              </button>
              <button
                type="button"
                onClick={() => handleRespond(true)}
                disabled={busy}
                className="flex-1 py-3 bg-memory hover:bg-memory-strong text-on-accent rounded-xl font-bold text-sm transition-all shadow-[var(--shadow-card)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                수락
              </button>
            </div>
          </div>
        ) : waiting ? (
          /* ② 내가 보낸 요청 대기 중 — 상대방이 아직 받지 않았다는 화면 */
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-memory-tint border border-memory-line flex items-center justify-center text-memory">
              <Hourglass className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-lg text-ink">상대방이 아직 요청을 받지 않았어요</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                <b className="text-memory">#{waiting.otherTag}</b>님에게 커플 연결을 요청했어요.
                <br />
                상대방이 수락하면 바로 시작돼요.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="w-full py-3 bg-surface-2 hover:bg-line text-ink-muted rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              요청 취소
            </button>
          </div>
        ) : (
          /* ③ 요청이 없을 때 — 상대방 태그 입력 화면 */
          <form onSubmit={handleSend} className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-memory-tint border border-memory-line flex items-center justify-center text-memory">
              <Link2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-lg text-ink">상대방과 연결해 주세요</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                우리들의 데이트 지도는 둘이 함께 쓰는 앱이에요.
                <br />
                상대방의 태그를 입력해 연결을 요청하세요.
              </p>
            </div>
            <div className="w-full flex items-center gap-2 px-4 py-3 bg-surface-2 border border-line rounded-xl focus-within:ring-2 focus-within:ring-memory focus-within:bg-surface transition-all">
              <span className="text-lg font-bold text-memory">#</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0000"
                aria-label="상대방 태그"
                className="flex-1 bg-transparent text-lg font-bold tracking-[0.3em] text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy || tagInput.length !== 4}
              className="w-full py-3 bg-memory hover:bg-memory-strong text-on-accent rounded-xl font-bold text-sm transition-all shadow-[var(--shadow-card)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              연결 요청 보내기
            </button>
          </form>
        )}

        {message && (
          <p
            className={`text-[11px] leading-relaxed text-center font-medium ${
              message.tone === "error" ? "text-warn" : "text-ink-muted"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="self-center flex items-center gap-1 text-[11px] font-semibold text-ink-subtle hover:text-ink-muted transition-colors cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
};
