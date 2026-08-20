"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ColorTheme,
  FontTheme,
  DEFAULT_COLOR_THEME,
  DEFAULT_FONT_THEME,
  THEME_STORAGE_KEY,
  FONT_STORAGE_KEY,
  COLOR_THEME_META,
  isColorTheme,
  isFontTheme,
} from "@/lib/theme";
import { fetchCoupleSettings, saveCoupleTheme } from "@/lib/couple";

// PWA 홈 화면 앱의 상단바 색을 현재 테마 배경과 맞춘다.
const syncStatusBarColor = (theme: ColorTheme) => {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COLOR_THEME_META[theme].barColor);
};

// <html>과 localStorage에 실제로 적용한다. localStorage는 다음 접속의 초기 페인트용 캐시.
const applyToDocument = (theme: ColorTheme, font: FontTheme) => {
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.dataset.font = font;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(FONT_STORAGE_KEY, font);
  syncStatusBarColor(theme);
};

// 테마 변경은 반드시 이 훅만 통과한다.
// 컴포넌트가 document.documentElement를 직접 만지면 상태가 갈라진다.
export function useTheme(userId?: string | null) {
  const [theme, setThemeState] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  const [font, setFontState] = useState<FontTheme>(DEFAULT_FONT_THEME);
  // 커플로 묶여 있으면 설정이 공용이 된다. 없으면 이 기기에만 저장.
  const coupleIdRef = useRef<string | null>(null);
  const [isShared, setIsShared] = useState<boolean>(false);

  // layout.tsx의 블로킹 스크립트가 <html>에 심어둔 값을 읽어 state를 동기화
  useEffect(() => {
    const { theme: savedTheme, font: savedFont } = document.documentElement.dataset;
    if (isColorTheme(savedTheme)) {
      setThemeState(savedTheme);
      syncStatusBarColor(savedTheme);
    }
    if (isFontTheme(savedFont)) {
      setFontState(savedFont);
    }
  }, []);

  // 로그인 상태면 커플 공용 설정을 받아와 덮어쓴다 (상대가 바꾼 테마가 여기에 반영된다)
  useEffect(() => {
    if (!userId) {
      coupleIdRef.current = null;
      setIsShared(false);
      return;
    }

    let cancelled = false;

    fetchCoupleSettings(userId).then((settings) => {
      if (cancelled || !settings) return;
      coupleIdRef.current = settings.id;
      setIsShared(true);
      setThemeState(settings.theme);
      setFontState(settings.font);
      applyToDocument(settings.theme, settings.font);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const applyTheme = useCallback(
    (nextTheme: ColorTheme, nextFont: FontTheme) => {
      applyToDocument(nextTheme, nextFont);
      setThemeState(nextTheme);
      setFontState(nextFont);

      // 커플로 묶여 있으면 상대방도 같은 테마를 쓰도록 공용 설정에 저장한다
      if (coupleIdRef.current) {
        saveCoupleTheme(coupleIdRef.current, userId ?? null, nextTheme, nextFont);
      }
    },
    [userId]
  );

  return { theme, font, applyTheme, isShared };
}
