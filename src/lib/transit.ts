import { TransitMode } from "@/types/transit";

export const TRANSIT_MODES: TransitMode[] = ["subway", "bus", "both"];

export const TRANSIT_MODE_META: Record<TransitMode, { label: string }> = {
  subway: { label: "지하철" },
  bus: { label: "버스" },
  both: { label: "지하철+버스" },
};

/** ODsay searchPubTransPathT의 SearchPathType (0: 지하철+버스, 1: 지하철, 2: 버스) */
export const ODSAY_PATH_TYPE: Record<TransitMode, 0 | 1 | 2> = {
  both: 0,
  subway: 1,
  bus: 2,
};

export const isTransitMode = (value: unknown): value is TransitMode =>
  value === "subway" || value === "bus" || value === "both";

/**
 * 수도권 전철이 닿는 대략적인 범위.
 * 서울·인천·경기 전역과 1호선 남단(천안·아산), 경춘선(춘천), 경강선(여주)까지 포함하도록 잡았다.
 * 좌표 사각형 근사라 경계 부근은 부정확할 수 있지만, 어디까지나 "기본값"이며
 * 사용자가 구간별로 언제든 바꿀 수 있다.
 */
const METRO_BOUNDS = {
  minLat: 36.7, // 천안·아산
  maxLat: 38.3, // 연천·소요산
  minLng: 126.3, // 인천·강화 방면
  maxLng: 127.95, // 춘천·여주 방면
};

export const isSeoulMetroArea = (lat: number, lng: number): boolean =>
  lat >= METRO_BOUNDS.minLat &&
  lat <= METRO_BOUNDS.maxLat &&
  lng >= METRO_BOUNDS.minLng &&
  lng <= METRO_BOUNDS.maxLng;

/**
 * 사용자가 따로 고르지 않았을 때 쓸 기본 이동수단.
 * 출발·도착이 모두 수도권 전철권이면 지하철, 아니면 지하철+버스로 폭넓게 탐색한다.
 */
export const getDefaultTransitMode = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): TransitMode =>
  isSeoulMetroArea(from.latitude, from.longitude) &&
  isSeoulMetroArea(to.latitude, to.longitude)
    ? "subway"
    : "both";
