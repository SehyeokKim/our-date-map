"use client";

import React from "react";
import { AlertCircle, Heart } from "lucide-react";
import { ToastState } from "@/types/spot";

interface ToastProps {
  toast: ToastState | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="absolute top-20 left-4 right-4 z-50 mx-auto max-w-sm flex justify-center animate-bounce-in">
      <div
        className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-all duration-300 ${
          toast.type === "success"
            ? "bg-rose-50/95 border-rose-100 text-rose-600 shadow-rose-500/10"
            : toast.type === "error"
            ? "bg-amber-50/95 border-amber-100 text-amber-600 shadow-amber-500/10"
            : "bg-white/95 border-gray-100 text-gray-600"
        }`}
      >
        {toast.type === "error" ? (
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <Heart
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              toast.type === "success" ? "fill-rose-500 text-rose-500" : "text-gray-400"
            }`}
          />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
