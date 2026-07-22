"use client";

import React from "react";
import { Heart } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="absolute top-4 left-4 right-4 z-10 mx-auto max-w-md bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-lg shadow-black/5 px-5 py-3.5 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-rose-50/80 flex items-center justify-center border border-rose-100">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-800 text-sm tracking-tight">우리들의 데이트 지도</h1>
          <p className="text-[10px] text-gray-500 leading-tight">소중한 순간을 지도 위에 기록해요</p>
        </div>
      </div>
    </header>
  );
};
