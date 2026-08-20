import type { Metadata, Viewport } from "next";
import "./globals.css";

// 첫 페인트 전에 저장된 테마/폰트를 <html>에 심어 흰 화면 → 다크 전환 플래시를 방지한다.
const THEME_INIT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("odm-theme");var f=localStorage.getItem("odm-font");d.dataset.theme=(t==="sage"||t==="citrus"||t==="peach")?t:"sage";d.dataset.font=(f==="gowun-noto"||f==="gothic-plex"||f==="gowun-plex")?f:"gowun-noto";}catch(e){}})();`;

export const metadata: Metadata = {
  title: "우리들의 데이트 지도",
  description: "둘만의 프라이빗 데이트 기록 앱",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "데이트지도",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f9f5", // 기본(sage) 배경색 — 테마 변경 시 useTheme이 런타임에 갱신
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 모바일 앱처럼 핀치 줌 방지
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="sage" data-font="gowun-noto" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700;800&family=Gowun+Dodum&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
