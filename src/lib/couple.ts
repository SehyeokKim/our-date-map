import { supabase } from "@/lib/supabase/client";
import { ColorTheme, FontTheme, isColorTheme, isFontTheme } from "@/lib/theme";

export interface CoupleSettings {
  id: string;
  theme: ColorTheme;
  font: FontTheme;
  updatedBy: string | null;
}

/** 내 프로필에 연결된 커플의 공용 설정을 읽는다 */
export async function fetchCoupleSettings(
  userId: string
): Promise<CoupleSettings | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.couple_id) return null;

    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .select("id, theme, font, updated_by")
      .eq("id", profile.couple_id)
      .maybeSingle();

    if (coupleError) throw coupleError;
    if (!couple) return null;

    return {
      id: couple.id,
      theme: isColorTheme(couple.theme) ? couple.theme : "sage",
      font: isFontTheme(couple.font) ? couple.font : "gowun-noto",
      updatedBy: couple.updated_by,
    };
  } catch (err) {
    console.error("[couple] Failed to fetch couple settings:", err);
    return null;
  }
}

/** 공용 테마 설정을 저장해 상대방과 공유한다 */
export async function saveCoupleTheme(
  coupleId: string,
  userId: string | null,
  theme: ColorTheme,
  font: FontTheme
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("couples")
      .update({
        theme,
        font,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coupleId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[couple] Failed to save couple theme:", err);
    return false;
  }
}
