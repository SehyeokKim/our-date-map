"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

// Public VAPID key for web push subscription
const PUBLIC_VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGHbCIRogFs5NrzFmmDiTu9knWXyI08c7MTOZrJQ1yb0Gvih6qmWffTlvQPii02S63qCY4PfLTL9mDOfy3xctcg";

// Helper function to convert VAPID base64 string to Uint8Array required by pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(
  showToast?: (message: string, type?: "success" | "error" | "info") => void,
  userId?: string | null
) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState<boolean>(false);

  // Register Service Worker and Check Push Subscription status on mount
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Load saved toggle preference from localStorage
    const savedPref = localStorage.getItem("our_date_map_push_enabled");
    if (savedPref === "true") {
      setPushEnabled(true);
    }

    // Register /sw.js Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        if (sub) {
          setPushEnabled(true);
          localStorage.setItem("our_date_map_push_enabled", "true");
        } else if (savedPref !== "true") {
          setPushEnabled(false);
        }
      })
      .catch((err) => {
        console.warn("[useWebPush] Service worker registration check error:", err);
      });
  }, []);

  // Save subscription to Supabase DB
  const saveSubscriptionToDb = useCallback(
    async (sub: PushSubscription) => {
      try {
        const keyP256dh = sub.getKey ? sub.getKey("p256dh") : null;
        const keyAuth = sub.getKey ? sub.getKey("auth") : null;

        if (!keyP256dh || !keyAuth) return;

        const p256dhStr = btoa(String.fromCharCode(...new Uint8Array(keyP256dh)));
        const authStr = btoa(String.fromCharCode(...new Uint8Array(keyAuth)));

        let activeUserId = userId;
        if (!activeUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) activeUserId = user.id;
        }

        await supabase.from("push_subscriptions").upsert(
          {
            user_id: activeUserId || null,
            endpoint: sub.endpoint,
            p256dh: p256dhStr,
            auth: authStr,
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" }
        );
      } catch (err) {
        console.error("[useWebPush] Failed saving subscription to DB:", err);
      }
    },
    [userId]
  );

  // Remove subscription from Supabase DB
  const removeSubscriptionFromDb = useCallback(async (endpoint: string) => {
    try {
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    } catch (err) {
      console.error("[useWebPush] Failed deleting subscription from DB:", err);
    }
  }, []);

  // Toggle Web Push Subscription ON/OFF
  const togglePushNotification = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      showToast?.("이 브라우저는 푸시 알림을 지원하지 않습니다.", "error");
      return false;
    }

    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushEnabled) {
        // TURN OFF: Unsubscribe active push subscription
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          await removeSubscriptionFromDb(existingSub.endpoint);
          await existingSub.unsubscribe();
        }
        setPushEnabled(false);
        localStorage.setItem("our_date_map_push_enabled", "false");
        showToast?.("🔔 푸시 알림이 해제되었습니다.", "info");
        return false;
      } else {
        // TURN ON: Request Permission & Subscribe
        const permResult = await Notification.requestPermission();
        setPermission(permResult);

        if (permResult !== "granted") {
          showToast?.("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.", "error");
          return false;
        }

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY) as unknown as BufferSource,
          });
        }

        await saveSubscriptionToDb(sub);
        setPushEnabled(true);
        localStorage.setItem("our_date_map_push_enabled", "true");
        showToast?.("🔔 푸시 알림이 성공적으로 등록되었습니다!", "success");
        return true;
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error("[useWebPush] Error toggling push notification:", err);
      showToast?.(`푸시 알림 설정 중 오류: ${errMessage}`, "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, pushEnabled, saveSubscriptionToDb, removeSubscriptionFromDb, showToast]);

  // Trigger Instant Push Message to Counterpart / Partner
  const sendInstantPushNotification = useCallback(
    async (customTitle?: string, customBody?: string): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: customTitle || "DateMap😘",
            body: customBody || "뽁!",
            url: "/",
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast?.("💌 상대방에게 알림을 성공적으로 보냈습니다!", "success");
          return true;
        } else {
          showToast?.(data.error || "알림 전송 실패", "error");
          return false;
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error("[useWebPush] Error sending instant push:", err);
        showToast?.(`알림 전송 중 오류: ${errMessage}`, "error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  return {
    isSupported,
    pushEnabled,
    permission,
    loading,
    togglePushNotification,
    sendInstantPushNotification,
  };
}
