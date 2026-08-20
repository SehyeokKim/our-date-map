"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DateSpot } from "@/types/spot";
import { X, Heart, MapPin, Camera, Film, Search } from "lucide-react";

interface SpotListModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: DateSpot[];
  onSelectSpot: (spot: DateSpot) => void;
}

const ALL = "all";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/**
 * 키워드 검색 대상 — 제목·내용·날짜 중 어디에든 걸리면 검색된다.
 * 날짜는 표기 방식이 사람마다 달라 여러 형태를 함께 넣어 둔다.
 * (예: "2026-08-14", "2026년 8월 14일", "2026.8.14", "8월")
 */
const buildSearchIndex = (spot: DateSpot): string => {
  const d = new Date(spot.visited_at);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();

  return [
    spot.title,
    spot.description,
    spot.address,
    spot.visited_at,
    formatDate(spot.visited_at),
    `${y}.${m}.${day}`,
    `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    `${m}월`,
    `${y}년`,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const SpotListModal: React.FC<SpotListModalProps> = ({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
}) => {
  const [year, setYear] = useState<string>(ALL);
  const [month, setMonth] = useState<string>(ALL);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");

  // 다시 열 때는 항상 초기 상태로 시작
  useEffect(() => {
    if (isOpen) {
      setYear(ALL);
      setMonth(ALL);
      setIsSearching(false);
      setKeyword("");
    }
  }, [isOpen]);

  // 최신 추억부터
  const sortedSpots = useMemo(
    () =>
      [...spots].sort(
        (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
      ),
    [spots]
  );

  // 기록이 있는 연도만 노출 (최신순)
  const years = useMemo(() => {
    const set = new Set<number>();
    sortedSpots.forEach((s) => set.add(new Date(s.visited_at).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [sortedSpots]);

  // 선택한 연도 안에서 기록이 있는 월만 노출
  const months = useMemo(() => {
    const set = new Set<number>();
    sortedSpots.forEach((s) => {
      const d = new Date(s.visited_at);
      if (year === ALL || String(d.getFullYear()) === year) {
        set.add(d.getMonth() + 1);
      }
    });
    return [...set].sort((a, b) => a - b);
  }, [sortedSpots, year]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return sortedSpots.filter((s) => {
      const d = new Date(s.visited_at);
      if (year !== ALL && String(d.getFullYear()) !== year) return false;
      if (month !== ALL && String(d.getMonth() + 1) !== month) return false;
      if (kw && !buildSearchIndex(s).includes(kw)) return false;
      return true;
    });
  }, [sortedSpots, year, month, keyword]);

  if (!isOpen) return null;

  const getThumbnail = (spot: DateSpot) => spot.image_urls?.[0] || spot.image_url || null;

  const isFiltered = year !== ALL || month !== ALL || keyword.trim().length > 0;

  const chipClass = (active: boolean) =>
    `shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
      active
        ? "bg-memory text-on-accent border-memory"
        : "bg-surface text-ink-muted border-line hover:bg-memory-tint"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-md bg-surface rounded-3xl shadow-[var(--shadow-sheet)] overflow-hidden flex flex-col border border-line max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-memory text-on-accent flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-on-accent/20 flex items-center justify-center backdrop-blur-xs shrink-0">
              <Heart className="w-4 h-4 text-on-accent fill-current" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm text-on-accent">추억 모아보기</h2>
              <p className="text-[10px] text-on-accent/80 truncate">
                {isFiltered
                  ? `${filtered.length}곳 찾음 · 전체 ${spots.length}곳`
                  : `지도에 기록된 우리의 데이트 장소 ${spots.length}곳`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* 키워드 검색 토글 */}
            <button
              type="button"
              onClick={() => {
                const next = !isSearching;
                setIsSearching(next);
                // 닫을 때는 검색어와 연도·월 선택을 모두 비워 전체 목록으로 되돌린다
                if (!next) {
                  setKeyword("");
                  setYear(ALL);
                  setMonth(ALL);
                }
              }}
              aria-pressed={isSearching}
              aria-label="검색 및 필터"
              title="연도·월 필터와 키워드 검색"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isSearching
                  ? "bg-on-accent/25 text-on-accent"
                  : "hover:bg-on-accent/20 text-on-accent"
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-1.5 rounded-full hover:bg-on-accent/20 text-on-accent transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 돋보기를 눌렀을 때만 열리는 검색·필터 패널 */}
        {isSearching && (
          <div className="p-3 border-b border-line bg-surface-2 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="제목 · 이야기 · 날짜로 검색"
                className="w-full pl-10 pr-9 py-2.5 bg-surface border border-line rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-memory transition-all"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  aria-label="검색어 지우기"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-line text-ink-muted flex items-center justify-center hover:bg-ink-subtle hover:text-surface transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 연도 · 월 필터 */}
            {years.length > 0 && (
            <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="shrink-0 text-[10px] font-bold text-ink-subtle pr-0.5">연도</span>
              <button type="button" onClick={() => { setYear(ALL); setMonth(ALL); }} className={chipClass(year === ALL)}>
                전체
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setYear(String(y)); setMonth(ALL); }}
                  className={chipClass(year === String(y))}
                >
                  {y}년
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="shrink-0 text-[10px] font-bold text-ink-subtle pr-0.5">월</span>
              <button type="button" onClick={() => setMonth(ALL)} className={chipClass(month === ALL)}>
                전체
              </button>
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonth(String(m))}
                  className={chipClass(month === String(m))}
                >
                  {m}월
                </button>
              ))}
            </div>
            </div>
            )}
          </div>
        )}

        {/* Spot List Content */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[65vh]">
          {filtered.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-memory-tint text-memory flex items-center justify-center">
                {isFiltered ? <Search className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
              </div>
              <p className="text-xs font-bold text-ink">
                {isFiltered ? "조건에 맞는 추억이 없습니다" : "아직 기록된 추억이 없습니다"}
              </p>
              <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                {isFiltered
                  ? "다른 연도·월을 고르거나 검색어를 바꿔 보세요."
                  : "지도를 터치해서 우리의 첫 데이트 장소를 기록해 보세요!"}
              </p>
            </div>
          ) : (
            filtered.map((spot) => {
              const thumbnail = getThumbnail(spot);
              return (
                <button
                  key={spot.id}
                  onClick={() => onSelectSpot(spot)}
                  className="w-full flex items-center gap-3 p-2.5 bg-surface border border-line rounded-2xl shadow-xs hover:border-memory-line hover:bg-memory-tint active:scale-[0.98] transition-all cursor-pointer text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-memory-tint flex items-center justify-center">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={spot.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : spot.video_urls && spot.video_urls.length > 0 ? (
                      <Film className="w-5 h-5 text-memory/50" />
                    ) : (
                      <Camera className="w-5 h-5 text-memory/50" />
                    )}
                  </div>

                  {/* Spot Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-ink truncate">{spot.title}</h3>
                    <p className="text-[11px] text-memory font-medium">
                      {formatDate(spot.visited_at)}
                    </p>
                    {spot.description && (
                      <p className="text-[11px] text-ink-muted truncate">
                        {spot.description.split("\n")[0]}
                      </p>
                    )}
                  </div>

                  <MapPin className="w-4 h-4 shrink-0 text-ink-subtle" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
