import { PlannedSpot } from "@/types/planner";

/** 날짜 칩이 끝없이 늘어나지 않도록 둔 상한. 데이트 플랜 기간으로는 충분하다 */
const MAX_PLAN_DAYS = 31;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** `YYYY-MM-DD`를 현지 날짜로 읽는다. `new Date("YYYY-MM-DD")`는 UTC로 읽혀 하루 밀릴 수 있다 */
const parseLocalDate = (value: string): Date | null => {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

/** 플랜 기간의 날짜 목록 (시작일부터 종료일까지) */
export const listPlanDays = (start?: string, end?: string): string[] => {
  const first = start ? parseLocalDate(start) : null;
  if (!first) return [];
  const last = (end && parseLocalDate(end)) || first;
  const days: string[] = [];
  for (const d = new Date(first); d <= last && days.length < MAX_PLAN_DAYS; d.setDate(d.getDate() + 1)) {
    days.push(toDateString(d));
  }
  return days;
};

/** "10월 31일 (금)" */
export const formatDayDate = (value: string) => {
  const date = parseLocalDate(value);
  if (!date) return value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
};

/** "10/31 (금)". 좁은 칩용 */
export const formatDayShort = (value: string) => {
  const date = parseLocalDate(value);
  if (!date) return value;
  return `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`;
};

/**
 * 경유지마다 실제로 보여줄 날짜. 날짜가 없거나 플랜 기간 밖이면 바로 앞 경유지의 날짜를 따르고,
 * 맨 앞이면 첫날로 본다. 날짜를 넣기 전에 만든 플랜은 모두 첫날로 보인다.
 */
export const resolveSpotDates = (spots: Pick<PlannedSpot, "date">[], days: string[]): string[] => {
  const resolved: string[] = [];
  spots.forEach((spot, i) => {
    if (spot.date && days.includes(spot.date)) resolved.push(spot.date);
    else resolved.push(i > 0 ? resolved[i - 1] : days[0] ?? "");
  });
  return resolved;
};
