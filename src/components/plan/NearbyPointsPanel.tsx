import React from "react";
import { PlannedSpot } from "@/types/planner";
import { Check, Loader2, MapPin, MapPinPlus, Pencil, Trash2 } from "lucide-react";

interface NearbyPointsPanelProps {
  spot: PlannedSpot;
  isEditing: boolean;
  isSaving: boolean;
  onToggleEdit?: () => void;
  onPanTo?: (lat: number, lng: number) => void;
  onAdd?: () => void;
  onRemove?: (pointId: string) => void;
}

/** 경유지 하나의 주변 갈 곳 목록. 순서가 없어 번호 없이 추가한 순서대로 보여준다 */
export const NearbyPointsPanel: React.FC<NearbyPointsPanelProps> = ({
  spot,
  isEditing,
  isSaving,
  onToggleEdit,
  onPanTo,
  onAdd,
  onRemove,
}) => {
  const points = spot.nearby ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-2 bg-plan-tint rounded-2xl pl-3 pr-2 py-2 border border-plan-line">
        <button
          type="button"
          onClick={() => onPanTo?.(spot.latitude, spot.longitude)}
          className="flex items-center gap-2 min-w-0 text-xs text-plan-strong font-medium cursor-pointer"
          title="경유지 위치로 이동"
        >
          <span className="w-5 h-5 rounded-full bg-plan text-on-accent font-bold text-[10px] flex items-center justify-center shrink-0">
            {spot.order}
          </span>
          <span className="truncate">{spot.address || spot.title}</span>
        </button>

        <button
          type="button"
          onClick={onToggleEdit}
          disabled={isSaving}
          aria-pressed={isEditing}
          title={isEditing ? "변경사항 저장하고 편집 종료" : "주변 갈 곳 수정"}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60 ${
            isEditing
              ? "bg-plan text-on-accent"
              : "bg-surface text-plan-strong border border-plan-line hover:bg-surface-2"
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isEditing ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Pencil className="w-3.5 h-3.5" />
          )}
          <span>{isSaving ? "저장 중" : isEditing ? "완료" : "수정"}</span>
        </button>
      </div>

      {points.length === 0 ? (
        <div className="py-6 text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-full bg-plan-tint text-plan flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-ink">아직 주변 갈 곳이 없어요</p>
          <p className="text-[11px] text-ink-muted">
            {isEditing
              ? "아래 버튼으로 근처에 들를 곳을 찍어 두세요"
              : "수정을 누르면 근처에 들를 곳을 찍어 둘 수 있어요"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {points.map((point) => (
            <li
              key={point.id}
              className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface-2 border border-line hover:border-plan-line hover:bg-plan-tint transition-colors"
            >
              <button
                type="button"
                onClick={() => onPanTo?.(point.latitude, point.longitude)}
                title="지도 위치로 이동"
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-surface border-2 border-plan flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-plan" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-xs text-ink truncate">{point.title}</span>
                  {point.address && (
                    <span className="block text-[10px] text-ink-subtle truncate mt-0.5">
                      {point.address}
                    </span>
                  )}
                  {point.memo && (
                    <span className="block text-[10px] text-plan-strong whitespace-pre-wrap break-words mt-0.5">
                      {point.memo}
                    </span>
                  )}
                </span>
              </button>
              {isEditing && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(point.id)}
                  title="주변 갈 곳 삭제"
                  aria-label={`${point.title} 삭제`}
                  className="p-1.5 rounded-lg hover:bg-warn-tint text-ink-subtle hover:text-warn transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isEditing && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-dashed border-plan-line text-plan-strong text-xs font-bold hover:bg-plan-tint active:scale-[0.99] transition-all cursor-pointer"
        >
          <MapPinPlus className="w-4 h-4" />
          <span>주변 갈 곳 추가</span>
        </button>
      )}
    </>
  );
};
