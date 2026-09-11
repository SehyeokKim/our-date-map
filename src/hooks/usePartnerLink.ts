"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

/** 대기 중인 커플 연결 요청 — 받은 요청은 보낸 사람의 닉네임·사진을, 보낸 요청은 상대 태그만 담는다 */
export interface PartnerRequest {
  id: string;
  direction: "received" | "sent";
  createdAt: string;
  otherTag: string;
  otherNickname: string | null;
  otherAvatarUrl: string | null;
}

export interface PartnerLinkResult {
  ok: boolean;
  message?: string;
}

type RequestRow = Database["public"]["Functions"]["get_partner_requests"]["Returns"][number];

const toPartnerRequests = (rows: RequestRow[] | null): PartnerRequest[] =>
  (rows ?? []).map((r) => ({
    id: r.id,
    direction: r.direction === "received" ? "received" : "sent",
    createdAt: r.created_at,
    otherTag: r.other_tag,
    otherNickname: r.other_nickname,
    otherAvatarUrl: r.other_avatar_url,
  }));

// 연결 대기 화면에서 상대방의 수락을 알아차리는 주기
const POLL_INTERVAL_MS = 5000;

/**
 * 태그 기반 커플 연결 (요청 → 수락).
 * 연결 상태를 바꾸는 작업은 모두 DB 함수(send/respond/cancel_partner_request, disconnect_partner)로만 한다.
 * @param onLinkChanged 연결이 맺어지거나 끊겼을 때 프로필·기록을 다시 불러오는 콜백
 */
export function usePartnerLink(
  userId: string | null | undefined,
  isCoupled: boolean,
  onLinkChanged: () => Promise<void> | void
) {
  const [loadedRequests, setRequests] = useState<PartnerRequest[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  // 주기 확인 타이머가 항상 최신 콜백을 부르도록 ref에 담아 둔다
  const onLinkChangedRef = useRef(onLinkChanged);
  useEffect(() => {
    onLinkChangedRef.current = onLinkChanged;
  }, [onLinkChanged]);

  // 로그아웃하면 이전 계정의 요청을 보여주지 않는다
  const requests = userId ? loadedRequests : [];

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.rpc("get_partner_requests");
    if (error) {
      console.error("[usePartnerLink] Failed to load requests:", error);
      return;
    }
    setRequests(toPartnerRequests(data));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.rpc("get_partner_requests").then(({ data, error }) => {
      if (!cancelled && !error) setRequests(toPartnerRequests(data));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 아직 연결 전이면 주기적으로 확인한다 — 상대가 요청을 수락하거나 새 요청을 보내면 바로 반영된다
  useEffect(() => {
    if (!userId || isCoupled) return;
    const timer = setInterval(() => {
      refresh();
      onLinkChangedRef.current();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [userId, isCoupled, refresh]);

  const run = useCallback(
    async (
      call: () => PromiseLike<{ error: { message: string } | null }>,
      linkChanged: boolean
    ): Promise<PartnerLinkResult> => {
      setBusy(true);
      try {
        const { error } = await call();
        if (error) return { ok: false, message: error.message };
        if (linkChanged) await onLinkChangedRef.current();
        await refresh();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : String(err) };
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const sendRequest = useCallback(
    (tag: string) => run(() => supabase.rpc("send_partner_request", { p_tag: tag }), false),
    [run]
  );

  const respondRequest = useCallback(
    (requestId: string, accept: boolean) =>
      run(
        () => supabase.rpc("respond_partner_request", { p_request_id: requestId, p_accept: accept }),
        accept
      ),
    [run]
  );

  const cancelRequest = useCallback(
    (requestId: string) =>
      run(() => supabase.rpc("cancel_partner_request", { p_request_id: requestId }), false),
    [run]
  );

  const disconnect = useCallback(() => run(() => supabase.rpc("disconnect_partner"), true), [run]);

  return {
    requests,
    receivedRequests: requests.filter((r) => r.direction === "received"),
    sentRequests: requests.filter((r) => r.direction === "sent"),
    busy,
    refresh,
    sendRequest,
    respondRequest,
    cancelRequest,
    disconnect,
  };
}
