"use client";

import React, { useState, useEffect } from "react";
import { X, MessageSquare, Sparkles, Check } from "lucide-react";

interface CustomPushMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle?: string;
  currentBody?: string;
  defaultNickname?: string | null;
  onSave: (title: string, body: string) => void;
}

const PRESET_MESSAGES = [
  "지금 뭐해? 🤔",
  "보고 싶어 💖",
  "어디쯤 왔어? 📍",
  "오늘 데이트 할까? ☕",
  "콕 찔렀어요! 🐾",
  "사랑해 💖",
];

export const CustomPushMessageModal: React.FC<CustomPushMessageModalProps> = ({
  isOpen,
  onClose,
  currentTitle = "DateMap😘",
  currentBody = "",
  defaultNickname,
  onSave,
}) => {
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle || "DateMap😘");
      setBody(currentBody || "뽁!");
    }
  }, [isOpen, currentTitle, currentBody, defaultNickname]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || "DateMap😘";
    const finalBody = body.trim() || "뽁!";

    onSave(finalTitle, finalBody);
    onClose();
  };

  const handleSelectPreset = (presetText: string) => {
    setBody(presetText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col pointer-events-auto border border-white/60">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">
                푸시 알림 문구 설정
              </h2>
              <p className="text-[10px] text-gray-500">
                상대방에게 전달될 찌르기 메시지
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              알림 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="DateMap😘"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium"
              maxLength={30}
            />
          </div>

          {/* Body Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              알림 내용 <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="뽁!"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium resize-none h-20"
              maxLength={100}
            />
          </div>

          {/* Preset Chips */}
          <div>
            <div className="flex items-center gap-1 mb-1.5 text-[11px] font-semibold text-gray-500">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>빠른 문구 선택</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MESSAGES.map((preset, idx) => {
                const isSelected = body === preset;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${isSelected
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-rose-200 cursor-pointer"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
