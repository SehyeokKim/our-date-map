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
        className={`px-4 py-2.5 rounded-xl shadow-[var(--shadow-card)] border text-xs font-semibold flex items-center gap-2 backdrop-blur-sm transition-all duration-300 ${
          toast.type === "success"
            ? "bg-surface/95 border-memory-line text-memory"
            : toast.type === "error"
            ? "bg-surface/95 border-warn/40 text-warn"
            : "bg-surface/95 border-line text-ink-muted"
        }`}
      >
        {toast.type === "error" ? (
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <Heart
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              toast.type === "success" ? "fill-memory text-memory" : "text-ink-subtle"
            }`}
          />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
