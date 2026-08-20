"use client";

import { useCallback, useEffect, useState } from "react";
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

// PWA 홈 화면 앱의 상단바 색을 현재 테마 배경과 맞춘다.
const syncStatusBarColor = (theme: ColorTheme) => {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COLOR_THEME_META[theme].barColor);
};

// 테마 변경은 반드시 이 훅만 통과한다.
// 컴포넌트가 document.documentElement를 직접 만지면 상태가 갈라진다.
export function useTheme() {
  const [theme, setThemeState] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  const [font, setFontState] = useState<FontTheme>(DEFAULT_FONT_THEME);

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

  const applyTheme = useCallback((nextTheme: ColorTheme, nextFont: FontTheme) => {
    const el = document.documentElement;
    el.dataset.theme = nextTheme;
    el.dataset.font = nextFont;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    localStorage.setItem(FONT_STORAGE_KEY, nextFont);
    syncStatusBarColor(nextTheme);
    setThemeState(nextTheme);
    setFontState(nextFont);
  }, []);

  return { theme, font, applyTheme };
}
