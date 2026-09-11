"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, signInWithKakao, signOut as supabaseSignOut } from "@/lib/supabase/client";
import { uploadCompressedAvatar } from "@/lib/upload";
import { Profile } from "@/types/spot";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // 상호 연결된 파트너의 프로필. RLS상 서로를 파트너로 지정한 사이에서만 읽힌다
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // 프로필·파트너를 불러오는 중인지 — 끝나기 전에는 커플 연결 안내를 띄우지 않는다
  const [profileLoading, setProfileLoading] = useState<boolean>(true);

  // Fetch user profile (and the linked partner) from public.profiles table
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch user profile:", error);
        return;
      }

      setProfile((data as Profile) ?? null);

      if (data?.partner_id) {
        const { data: partnerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.partner_id)
          .maybeSingle();
        setPartner((partnerData as Profile) ?? null);
      } else {
        setPartner(null);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

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

    const applySession = (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setPartner(null);
        setProfileLoading(false);
      }
      setLoading(false);
    };

    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user ?? null);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
      setProfile(null);
      setPartner(null);
    } catch (e) {
      console.error("Logout Error:", e);
    }
  }, []);

  // 닉네임·프로필 사진만 수정한다. 파트너 연결은 연결 요청·수락으로만 바뀐다 (usePartnerLink)
  const updateProfile = useCallback(
    async (newNickname: string, imageFile?: File | null): Promise<boolean> => {
      if (!user) return false;

      try {
        let avatarUrlToSave = profile?.profile_image_url || null;

        if (imageFile) {
          const uploadedUrl = await uploadCompressedAvatar(user.id, imageFile);
          if (uploadedUrl) {
            avatarUrlToSave = uploadedUrl;
          }
        }

        const { data, error } = await supabase
          .from("profiles")
          .update({
            nickname: newNickname.trim(),
            profile_image_url: avatarUrlToSave,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;
        if (data) setProfile(data as Profile);
        return true;
      } catch (err) {
        console.error("Failed to update profile:", err);
        return false;
      }
    },
    [user, profile]
  );

  // Default Fallback: If profiles table has no custom values, fallback to Kakao OAuth metadata
  const nickname =
    profile?.nickname ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : null);

  const rawAvatarUrl =
    profile?.profile_image_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar_url_https ||
    null;

  const avatarUrl = rawAvatarUrl
    ? rawAvatarUrl.replace(/^http:\/\//i, "https://")
    : null;

  // 서로를 파트너로 지정한 사이여야 커플이다 (한쪽만 지정한 상태는 연결이 아니다)
  const isCoupled = Boolean(user && partner && partner.partner_id === user.id);

  const refetchProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return {
    user,
    profile,
    partner: isCoupled ? partner : null,
    isCoupled,
    loading,
    profileLoading,
    nickname,
    avatarUrl,
    loginWithKakao,
    logout,
    updateProfile,
    refetchProfile,
  };
}
