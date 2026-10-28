import React from "react";
import { RouteOption } from "@/types/transit";
import { ROUTE_COLORS, stepColor } from "@/lib/transit";

/** 막대 높이(px). 점 지름과 차량 구간의 두께가 같아 한 줄로 읽힌다 */
const HEIGHT = { sm: 6, md: 8 } as const;

/** 점 하나가 차지하는 칸 폭 (점 지름 대비). 1이면 점끼리 붙는다 */
const DOT_PITCH = 1.4;

/**
 * 지도 도보 선과 같은 원 무늬. `round`로 반복해 칸 폭에 정수 개의 점이 들어가도록 칸 간격을 늘리거나 줄인다.
 * 점은 반지름을 px로 고정해 간격이 바뀌어도 원 모양을 유지한다.
 * `space`는 점이 하나만 들어가는 좁은 칸(짧은 도보)에서 점을 왼쪽에 붙이고 나머지를 비워 두므로 쓰지 않는다.
 */
const walkDots = (size: number): React.CSSProperties => ({
  backgroundImage: `radial-gradient(circle, ${ROUTE_COLORS.walk} 0 ${size / 2 - 0.5}px, transparent ${size / 2}px)`,
  backgroundSize: `${size * DOT_PITCH}px ${size}px`,
  backgroundRepeat: "round no-repeat",
  backgroundPosition: "0 50%",
  minWidth: size * DOT_PITCH,
});

/** 단계별 소요시간 비율 막대. 차량은 지도 경로선과 같은 색의 둥근 막대, 도보는 원 무늬 */
export const RouteDurationBar = ({
  route,
  size = "md",
  className = "",
}: {
  route: RouteOption;
  size?: keyof typeof HEIGHT;
  className?: string;
}) => {
  const height = HEIGHT[size];
  return (
    <div className={`flex w-full items-center gap-1 ${className}`} style={{ height }} aria-hidden>
      {route.steps.map((step, i) => (
        <div
          key={i}
          className="h-full rounded-full"
          style={{
            flexGrow: Math.max(step.duration, 30),
            flexBasis: 0,
            ...(step.kind === "walk"
              ? walkDots(height)
              : { backgroundColor: stepColor(route.steps, i), minWidth: height }),
          }}
        />
      ))}
    </div>
  );
};
