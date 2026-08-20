// 테마 시스템 상수 — 색상 테마와 폰트 페어링은 독립된 축으로 관리한다.
// 실제 토큰 값은 src/app/globals.css의 [data-theme] / [data-font] 블록이 정의한다.

export const COLOR_THEMES = ["sage", "citrus", "peach"] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];

export const FONT_THEMES = ["gowun-noto", "gothic-plex", "gowun-plex"] as const;
export type FontTheme = (typeof FONT_THEMES)[number];

export const DEFAULT_COLOR_THEME: ColorTheme = "sage";
export const DEFAULT_FONT_THEME: FontTheme = "gowun-noto";

// layout.tsx의 블로킹 초기화 스크립트(THEME_INIT)와 반드시 같은 키를 사용해야 한다.
export const THEME_STORAGE_KEY = "odm-theme";
export const FONT_STORAGE_KEY = "odm-font";

export interface ColorThemeMeta {
  label: string;
  description: string;
  /** PWA 상단바(meta theme-color)에 쓰는 배경색 */
  barColor: string;
  /** 설정 UI 색상 스와치용 대표색 */
  swatch: { bg: string; memory: string; plan: string };
}

export const COLOR_THEME_META: Record<ColorTheme, ColorThemeMeta> = {
  sage: {
    label: "세이지",
    description: "차분한 그린과 로즈",
    barColor: "#f8f9f5",
    swatch: { bg: "#f8f9f5", memory: "#c25e73", plan: "#4f7a6a" },
  },
  citrus: {
    label: "시트러스",
    description: "화사한 오렌지와 틸",
    barColor: "#fffaf3",
    swatch: { bg: "#fffaf3", memory: "#f2761b", plan: "#0f766e" },
  },
  peach: {
    label: "나이트 피치",
    description: "따뜻한 다크 모드",
    barColor: "#1d1714",
    swatch: { bg: "#1d1714", memory: "#ff9e7d", plan: "#c9a7ff" },
  },
};

export interface FontThemeMeta {
  label: string;
  description: string;
  /** 설정 UI에서 옵션 자체를 해당 폰트로 렌더링하기 위한 CSS 값 */
  displayFamily: string;
  displayWeight: number;
  bodyFamily: string;
}

export const FONT_THEME_META: Record<FontTheme, FontThemeMeta> = {
  "gowun-noto": {
    label: "고운돋움 · 노토산스",
    description: "포근한 기본 조합",
    displayFamily: "'Gowun Dodum', sans-serif",
    displayWeight: 400,
    bodyFamily: "'Noto Sans KR', sans-serif",
  },
  "gothic-plex": {
    label: "고딕 A1 · 플렉스",
    description: "또렷하고 힘 있는 제목",
    displayFamily: "'Gothic A1', sans-serif",
    displayWeight: 800,
    bodyFamily: "'IBM Plex Sans KR', sans-serif",
  },
  "gowun-plex": {
    label: "고운돋움 · 플렉스",
    description: "감성 제목과 모던 본문",
    displayFamily: "'Gowun Dodum', sans-serif",
    displayWeight: 400,
    bodyFamily: "'IBM Plex Sans KR', sans-serif",
  },
};

export const isColorTheme = (value: string | undefined | null): value is ColorTheme =>
  COLOR_THEMES.includes(value as ColorTheme);

export const isFontTheme = (value: string | undefined | null): value is FontTheme =>
  FONT_THEMES.includes(value as FontTheme);
