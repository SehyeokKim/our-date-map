import { PlannedSpot } from "@/types/planner";
import { RouteOption } from "@/types/transit";
import { ROUTE_COLORS, stepColor } from "@/lib/transit";

/**
 * 코스 경로선(Kakao Mobility)이 어떤 경유지 구성으로 계산됐는지 나타내는 서명.
 * 경로는 경유지의 좌표와 순서로만 결정되므로 둘을 이어 붙인다.
 * 저장된 경로의 서명이 현재 경유지와 다르면 경유지가 추가·삭제·이동된 것이므로 다시 조회해야 한다.
 */
export const getRoutePathKey = (
  spots: Pick<PlannedSpot, "latitude" | "longitude">[]
): string => spots.map((s) => `${s.longitude.toFixed(6)},${s.latitude.toFixed(6)}`).join(";");

/** 두 좌표 사이의 직선 거리(m) — 하버사인 공식 */
export const getStraightDistance = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/**
 * 두 경유지가 사실상 같은 장소인지. 길찾기 API는 이런 구간에 경로를 주지 않으므로(자동차는 5m 이내 오류)
 * 호출하지 않고 "같은 장소"로 안내한다
 */
export const isSamePlace = (
  a: Pick<PlannedSpot, "latitude" | "longitude">,
  b: Pick<PlannedSpot, "latitude" | "longitude">
): boolean =>
  getStraightDistance({ lat: a.latitude, lng: a.longitude }, { lat: b.latitude, lng: b.longitude }) < 10;

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/**
 * 저장 크기를 줄이려고 좌표를 소수 5자리(약 1m)로 줄이고, `minGapMeters`보다 가까운 연속점은 버린다.
 * 끝점은 항상 남긴다. 구간 경로는 `route_summary` JSONB에 그대로 저장되기 때문이다.
 */
export const thinPath = (
  points: { lat: number; lng: number }[],
  minGapMeters = 5
): { lat: number; lng: number }[] => {
  const out: { lat: number; lng: number }[] = [];
  points.forEach((point, i) => {
    const p = { lat: round5(point.lat), lng: round5(point.lng) };
    const last = out[out.length - 1];
    if (!last || i === points.length - 1 || getStraightDistance(last, p) >= minGapMeters) out.push(p);
  });
  return out;
};

/**
 * 지도 경로선 모양. solid는 지하철·버스·자동차, walk는 도보(파란 점), spur는 길과 경유지 사이의 짧은 연결(회색 점),
 * pending은 경로가 아직 없는 구간
 */
export type RouteLineStyle = "solid" | "walk" | "spur" | "pending";

export interface RouteLine {
  path: { lat: number; lng: number }[];
  style: RouteLineStyle;
  color: string;
}

/** 경로 끝과 경유지가 이보다 멀면 회색 연결선을 긋는다 */
const SPUR_MIN_M = 3;

/** 두 도보 선의 양끝이 이 거리 안에서 겹치면 같은 길로 보고 한 번만 그린다 */
const SAME_ENDPOINT_M = 20;

/**
 * 갔다가 되돌아오는 꺾임을 지운다. a→b→c에서 c가 a 근처로 돌아오면 b는 길 끝에서 되돌아온 점이다.
 * 도보 경로는 횡단보도·출구를 거치며 이런 꺾임이 생기고, 점선이 겹쳐 지저분하게 보인다.
 */
export const removeBacktracks = (path: { lat: number; lng: number }[]) => {
  const out = [...path];
  for (let i = 1; i < out.length - 1; ) {
    const ab = getStraightDistance(out[i - 1], out[i]);
    const bc = getStraightDistance(out[i], out[i + 1]);
    const ac = getStraightDistance(out[i - 1], out[i + 1]);
    if (ab > 0 && bc > 0 && ac < Math.min(ab, bc) * 0.5) {
      out.splice(i, 1);
      // 지운 자리 앞뒤로 새 꺾임이 생길 수 있으니 한 칸 물러나 다시 본다
      i = Math.max(1, i - 1);
    } else {
      i += 1;
    }
  }
  return out;
};

/** 양끝이 같은 두 점 근처인지 (방향은 무시) */
const sameEnds = (a: { lat: number; lng: number }[], b: { lat: number; lng: number }[]) => {
  const near = (p: { lat: number; lng: number }, q: { lat: number; lng: number }) =>
    getStraightDistance(p, q) < SAME_ENDPOINT_M;
  const [a0, a1] = [a[0], a[a.length - 1]];
  const [b0, b1] = [b[0], b[b.length - 1]];
  return (near(a0, b0) && near(a1, b1)) || (near(a0, b1) && near(a1, b0));
};

/**
 * 구간마다 고른 경로를 지도에 그릴 선 목록으로 바꾼다. 색은 목록 칩과 같은 `stepColor`를 쓴다.
 * - 길찾기 API의 경로는 경유지에서 가장 가까운 길에서 시작·끝나므로, 경유지와 경로 끝 사이는 회색 점으로 잇는다.
 * - 앞 구간의 하차 후 도보와 다음 구간의 승차 전 도보처럼 같은 두 지점을 잇는 도보는 한 번만 그린다.
 *   점선이 서로 어긋나게 겹치면 점이 다닥다닥 붙어 보이기 때문이다.
 * - 좌표가 없는 구간(아직 조회 전, 예전 저장분)은 두 경유지를 흐린 직선으로 잇는다.
 */
export const buildRouteLines = (
  spots: Pick<PlannedSpot, "id" | "latitude" | "longitude">[],
  routeOf: (fromId: string, toId: string) => RouteOption | null | undefined
): RouteLine[] => {
  const lines = spots.slice(1).flatMap((to, i) => {
    const from = spots[i];
    const origin = { lat: from.latitude, lng: from.longitude };
    const destination = { lat: to.latitude, lng: to.longitude };
    const steps = routeOf(from.id, to.id)?.steps ?? [];
    const stepLines: RouteLine[] = steps.flatMap((s, index) =>
      (s.path?.length ?? 0) >= 2
        ? [
            {
              path: removeBacktracks(s.path!),
              style: s.kind === "walk" ? "walk" : "solid",
              color: stepColor(steps, index),
            } as RouteLine,
          ]
        : []
    );
    if (stepLines.length === 0) {
      return [{ path: [origin, destination], style: "pending", color: ROUTE_COLORS.spur } as RouteLine];
    }

    const first = stepLines[0].path[0];
    const lastPath = stepLines[stepLines.length - 1].path;
    const last = lastPath[lastPath.length - 1];
    const spurs: RouteLine[] = [];
    if (getStraightDistance(origin, first) > SPUR_MIN_M) {
      spurs.push({ path: [origin, first], style: "spur", color: ROUTE_COLORS.spur });
    }
    if (getStraightDistance(last, destination) > SPUR_MIN_M) {
      spurs.push({ path: [last, destination], style: "spur", color: ROUTE_COLORS.spur });
    }
    return [...stepLines, ...spurs];
  });

  // 점선(도보·연결)은 이미 그린 점선과 양끝이 같으면 건너뛴다
  const drawnDots: RouteLine[] = [];
  return lines.filter((line) => {
    if (line.style !== "walk" && line.style !== "spur") return true;
    if (drawnDots.some((d) => d.style === line.style && sameEnds(d.path, line.path))) return false;
    drawnDots.push(line);
    return true;
  });
};
