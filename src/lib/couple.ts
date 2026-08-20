import { supabase } from "@/lib/supabase/client";
import { ColorTheme, FontTheme, isColorTheme, isFontTheme } from "@/lib/theme";

export interface CoupleSettings {
  id: string;
  theme: ColorTheme;
  font: FontTheme;
  updatedBy: string | null;
}

/**
 * 두 사람을 같은 커플로 묶는다.
 * - 어느 한쪽에 이미 커플이 있으면 그 커플에 합류시킨다(기존 공용 설정 유지).
 * - 둘 다 없으면 새로 만든다.
 * 파트너를 지정하는 시점에 호출되며, 실패해도 프로필 저장 자체는 막지 않는다.
 */
export async function ensureCouple(
  userId: string,
  partnerId: string
): Promise<string | null> {
  try {
    const { data: rows, error } = await supabase
      .from("profiles")
      .select("id, couple_id")
      .in("id", [userId, partnerId]);

    if (error) throw error;

    const existingCoupleId =
      rows?.map((r) => r.couple_id).find((id): id is string => Boolean(id)) ?? null;

    let coupleId = existingCoupleId;

    if (!coupleId) {
      const { data: created, error: createError } = await supabase
        .from("couples")
        .insert({})
        .select("id")
        .single();

      if (createError) throw createError;
      coupleId = created.id;
    }

    // 아직 연결되지 않은 쪽만 붙인다 (이미 같은 커플이면 no-op)
    const { error: linkError } = await supabase
      .from("profiles")
      .update({ couple_id: coupleId })
      .in("id", [userId, partnerId]);

    if (linkError) throw linkError;

    return coupleId;
  } catch (err) {
    console.error("[couple] Failed to link couple:", err);
    return null;
  }
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
