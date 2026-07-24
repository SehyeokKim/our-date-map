"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, signInWithKakao, signOut as supabaseSignOut } from "@/lib/supabase/client";
import { uploadCompressedAvatar } from "@/lib/upload";
import { Profile } from "@/types/spot";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user profile from public.profiles table
  const fetchProfile = useCallback(async (userId: string) => {
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

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
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

    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
    } catch (e) {
      console.error("Logout Error:", e);
    }
  }, []);

  // Update profile nickname, profile image, and partner_id in Supabase
  const updateProfile = useCallback(
    async (
      newNickname: string,
      imageFile?: File | null,
      partnerId?: string | null
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        let avatarUrlToSave = profile?.profile_image_url || null;

        if (imageFile) {
          const uploadedUrl = await uploadCompressedAvatar(user.id, imageFile);
          if (uploadedUrl) {
            avatarUrlToSave = uploadedUrl;
          }
        }

        const nowIso = new Date().toISOString();
        const finalPartnerId =
          partnerId !== undefined ? partnerId : profile?.partner_id || null;

        const payload = {
          id: user.id,
          nickname: newNickname.trim(),
          profile_image_url: avatarUrlToSave,
          partner_id: finalPartnerId,
          updated_at: nowIso,
        };

        const { data, error } = await supabase
          .from("profiles")
          .upsert(payload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data as Profile);
          if (finalPartnerId) {
            localStorage.setItem("our_date_map_target_partner_id", finalPartnerId);
          } else {
            localStorage.removeItem("our_date_map_target_partner_id");
          }
        }
        return true;
      } catch (err) {
        console.error("Failed to update profile:", err);
        return false;
      }
    },
    [user, profile]
  );

  // Fetch all registered partner profiles except the logged in user
  const fetchAvailablePartners = useCallback(async (): Promise<Profile[]> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("nickname", { ascending: true });

      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }

      return ((data as Profile[]) || []).filter((p) => p.id !== user?.id);
    } catch (err) {
      console.error("Failed to fetch available partners:", err);
      return [];
    }
  }, [user?.id]);

  // Default Fallback: If profiles table has no custom values, fallback to Kakao OAuth metadata
  const nickname =
    profile?.nickname ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : null);

  const avatarUrl =
    profile?.profile_image_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar_url_https ||
    null;

  return {
    user,
    profile,
    loading,
    nickname,
    avatarUrl,
    loginWithKakao,
    logout,
    updateProfile,
    fetchAvailablePartners,
    refetchProfile: () => user && fetchProfile(user.id),
  };
}
