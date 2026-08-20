"use client";

import React, { useState } from "react";
import { DeletedDateSpot } from "@/types/spot";
import { X, Trash2, Camera, RotateCcw, Loader2 } from "lucide-react";

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedSpots: DeletedDateSpot[];
  isLoading: boolean;
  onRestore: (originalSpotId: string) => Promise<boolean>;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  deletedSpots,
  isLoading,
  onRestore,
}) => {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getThumbnail = (deleted: DeletedDateSpot) =>
    deleted.spot_data?.image_urls?.[0] || deleted.spot_data?.image_url || null;

  const handleRestore = async (deleted: DeletedDateSpot) => {
    if (restoringId) return;
    setRestoringId(deleted.original_spot_id);
    await onRestore(deleted.original_spot_id);
    setRestoringId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-[var(--shadow-sheet)] overflow-hidden flex flex-col border border-line max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-surface-2 text-ink flex items-center justify-between shadow-sm border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-line/60 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-ink-muted" />
            </div>
            <div>
              <h2 className="font-display text-sm text-ink">휴지통</h2>
              <p className="text-[10px] text-ink-muted">
                삭제된 핀은 30일 동안 보관된 후 영구 삭제됩니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-line text-ink-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deleted Spot List */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[65vh]">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-ink-subtle">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs font-medium">휴지통을 불러오는 중...</p>
            </div>
          ) : deletedSpots.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-2 text-ink-subtle flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-ink">휴지통이 비어 있습니다</p>
              <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                실수로 핀을 삭제해도 30일 안에는 여기서 복구할 수 있어요
              </p>
            </div>
          ) : (
            deletedSpots.map((deleted) => {
              const thumbnail = getThumbnail(deleted);
              const isRestoring = restoringId === deleted.original_spot_id;
              return (
                <div
                  key={deleted.id}
                  className="flex items-center gap-3 p-2.5 bg-surface border border-line rounded-2xl shadow-xs"
                >
                  {/* Thumbnail (grayscale to signal deleted state) */}
                  <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={deleted.spot_data?.title || "삭제된 핀"}
                        className="w-full h-full object-cover grayscale opacity-80"
                        loading="lazy"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-ink-subtle" />
                    )}
                  </div>

                  {/* Spot Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-ink truncate">
                      {deleted.spot_data?.title || "(제목 없음)"}
                    </h3>
                    {deleted.spot_data?.visited_at && (
                      <p className="text-[11px] text-ink-subtle">
                        데이트: {formatDate(deleted.spot_data.visited_at)}
                      </p>
                    )}
                    <p className="text-[11px] text-warn font-medium">
                      삭제: {formatDate(deleted.deleted_at)}
                    </p>
                  </div>

                  {/* Restore Button */}
                  <button
                    onClick={() => handleRestore(deleted)}
                    disabled={Boolean(restoringId)}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-memory-tint hover:bg-memory-line text-memory rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    복원
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
