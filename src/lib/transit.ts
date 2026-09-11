import { PlannedSpot } from "@/types/planner";
import { TransitMode } from "@/types/transit";

export const TRANSIT_MODES: TransitMode[] = ["transit", "car"];

export const TRANSIT_MODE_META: Record<TransitMode, { label: string }> = {
  transit: { label: "대중교통" },
  car: { label: "자동차" },
};

/**
 * 구간(경유지 i → i+1)에 적용할 이동수단. 선택값은 도착 경유지에 저장된다.
 * 고르지 않았거나 예전 값("subway" | "bus" | "both")이 저장된 경우는 모두 대중교통으로 본다.
 */
export const resolveTransitMode = (to: Pick<PlannedSpot, "transitMode">): TransitMode =>
  to.transitMode === "car" ? "car" : "transit";
