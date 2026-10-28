import React from "react";
import { formatDayShort } from "@/lib/planDates";

interface PlanDayPickerProps {
  days: string[];
  value: string;
  onChange: (day: string) => void;
}

/** 여러 날짜 플랜에서 경유지의 날짜를 고르는 칩. 날짜가 많으면 가로로 넘긴다 */
export const PlanDayPicker: React.FC<PlanDayPickerProps> = ({ days, value, onChange }) => (
  <div role="radiogroup" aria-label="방문 날짜" className="flex gap-1.5 overflow-x-auto">
    {days.map((day, i) => {
      const isSelected = day === value;
      return (
        <button
          key={day}
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={() => onChange(day)}
          className={`min-h-11 shrink-0 px-3 rounded-xl border text-[11px] leading-tight transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plan ${
            isSelected
              ? "bg-plan text-on-accent border-plan"
              : "bg-surface-2 text-ink-muted border-line hover:bg-plan-tint"
          }`}
        >
          <span className="block font-bold">{i + 1}일차</span>
          <span className="block">{formatDayShort(day)}</span>
        </button>
      );
    })}
  </div>
);
