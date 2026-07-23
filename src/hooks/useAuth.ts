"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, signInWithKakao, signOut as supabaseSignOut } from "@/lib/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If the browser lands on root (or any path) with OAuth authorization `code`,
    // forward to /auth/callback to perform exchangeCodeForSession.
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const authError = urlParams.get("auth_error");
      const errorDesc = urlParams.get("error_description");

      if (authError) {
        console.error("[useAuth] OAuth callback error detected:", authError, errorDesc || "");
      }

      if (code && !window.location.pathname.startsWith("/auth/callback")) {
        window.location.href = `/auth/callback${window.location.search}`;
        return;
      }
    }

    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithKakao = useCallback(async () => {
    try {
      await signInWithKakao();
    } catch (e) {
      console.error("Kakao Login Error:", e);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabaseSignOut();
      setUser(null);
    } catch (e) {
      console.error("Logout Error:", e);
    }
  }, []);

  const nickname =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : null);

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar_url_https ||
    null;

  return {
    user,
    loading,
    nickname,
    avatarUrl,
    loginWithKakao,
    logout,
  };
}
