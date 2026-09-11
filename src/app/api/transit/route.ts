import { NextRequest, NextResponse } from "next/server";
import { TransitRouteInfo, TransitRouteResponse, TransitSubPath } from "@/types/transit";
import { getStraightDistance } from "@/lib/route";

/**
 * 성공한 조회 결과만 1시간 보관한다.
 *
 * 이전에는 fetch에 `next: { revalidate: 3600 }`을 걸었는데, ODsay는 실패해도 HTTP 200에
 * 에러 본문을 담아 주기 때문에 **실패 응답까지 한 시간 동안 캐시**됐다. 그래서 키 인증 오류나
 * 일시적 장애가 한 번 나면 해당 구간이 한 시간 내내 "경로 없음"으로 굳어버렸다.
 * 이제 응답 본문을 확인한 뒤 성공한 것만 직접 캐시한다. (§9 쿼터 보호 요건은 그대로 충족)
 */
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const successCache = new Map<string, { body: TransitRouteResponse; expiresAt: number }>();

const readCache = (key: string): TransitRouteResponse | null => {
  const hit = successCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    successCache.delete(key);
    return null;
  }
  return hit.body;
};

const writeCache = (key: string, body: TransitRouteResponse) => {
  if (successCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = successCache.keys().next().value;
    if (oldest) successCache.delete(oldest);
  }
  successCache.set(key, { body, expiresAt: Date.now() + CACHE_TTL_MS });
};

/** ODsay path 하나를 우리 형식으로 변환 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parsePath = (path: any): TransitRouteInfo => {
  const info = path.info;
  const polylinePath: { lat: number; lng: number }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subpaths: TransitSubPath[] = (path.subPath || []).map((sub: any) => {
    let transportName = "";
    if (sub.trafficType === 1) {
      const laneName = sub.lane?.[0]?.name || "";
      transportName = laneName.includes("호선") ? laneName : `${laneName} 지하철`;
    } else if (sub.trafficType === 2) {
      transportName = sub.lane?.[0]?.busNo || "버스";
    } else {
      transportName = "도보";
    }

    if (sub.passStopList?.stations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sub.passStopList.stations.forEach((st: any) => {
        if (st.y && st.x) {
          polylinePath.push({ lat: parseFloat(st.y), lng: parseFloat(st.x) });
        }
      });
    }

    return {
      trafficType: sub.trafficType as 1 | 2 | 3,
      sectionTime: sub.sectionTime || 0,
      distance: sub.distance || 0,
      transportName,
      startName: sub.startName || "",
      endName: sub.endName || "",
    };
  });

  // 도보 구간(trafficType 3)까지 모두 더한 실제 이동 거리
  const subpathDistance = subpaths.reduce((sum, sp) => sum + sp.distance, 0);

  return {
    totalTime: info.totalTime || 0,
    totalDistance: subpathDistance || info.totalDistance || 0,
    payment: info.payment || 0,
    busTransitCount: info.busTransitCount || 0,
    subwayTransitCount: info.subwayTransitCount || 0,
    firstStartStation: info.firstStartStation || "",
    lastEndStation: info.lastEndStation || "",
    subpaths,
    polylinePath: polylinePath.length > 0 ? polylinePath : undefined,
    isWalkOnly: info.busTransitCount === 0 && info.subwayTransitCount === 0,
  };
};

/** 이동 거리가 가장 짧은 경로. 거리가 같으면 더 빨리 도착하는 쪽을 고른다 */
const pickShortest = (routes: TransitRouteInfo[]): TransitRouteInfo =>
  routes.reduce((best, cur) => {
    const bestDistance = best.totalDistance ?? Infinity;
    const curDistance = cur.totalDistance ?? Infinity;
    if (curDistance !== bestDistance) return curDistance < bestDistance ? cur : best;
    return cur.totalTime < best.totalTime ? cur : best;
  });

/** 도보 속도 (분당 약 67m ≈ 시속 4km) */
const WALK_METERS_PER_MIN = 67;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const SX = searchParams.get("SX");
  const SY = searchParams.get("SY");
  const EX = searchParams.get("EX");
  const EY = searchParams.get("EY");

  if (!SX || !SY || !EX || !EY) {
    return NextResponse.json(
      { error: "필수 파라미터가 누락되었습니다 (SX, SY, EX, EY)." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    console.error("Missing ODSAY_API_KEY in environment variables");
    return NextResponse.json(
      { error: "ODSAY_API_KEY is not configured" },
      { status: 500 }
    );
  }

  // 네트워크로 나가기 전에 캐시부터 확인한다 (좌표 쌍이 키)
  const cacheKey = `${SX},${SY}->${EX},${EY}`;
  const cached = readCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const origin = request.nextUrl.origin || "http://localhost:3000";
    const refererHeader = request.headers.get("referer") || origin;

    // SearchPathType=0: 지하철·버스를 모두 섞은 경로를 한 번에 받는다.
    // 이 응답 하나에서 가장 짧은 경로를 고르므로 구간당 ODsay 호출은 최대 1회다.
    const odsayUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${SX}&SY=${SY}&EX=${EX}&EY=${EY}&SearchPathType=0&apiKey=${encodeURIComponent(
      apiKey
    )}`;

    const res = await fetch(odsayUrl, {
      headers: {
        Accept: "application/json",
        Referer: refererHeader,
      },
      // 에러 본문까지 캐시되지 않도록 프레임워크 캐시는 끄고 위 successCache로 직접 관리한다
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`ODsay API HTTP 오류: ${res.status}`);
    }

    const data = await res.json();

    // Check for ODsay specific error code
    if (data.error) {
      const errCode = data.error[0]?.code || data.error?.code;
      const errMsg = data.error[0]?.message || data.error?.message || "경로를 찾을 수 없습니다.";

      // -98: 출발·도착이 가까워(700m 이내) 걸어가면 된다는 정상 결과이므로 캐시해도 된다.
      // ODsay가 거리를 주지 않으므로 직선 거리와 도보 속도로 기록한다.
      if (errCode === "-98" || errCode === -98) {
        const distance = Math.round(
          getStraightDistance(
            { lat: Number(SY), lng: Number(SX) },
            { lat: Number(EY), lng: Number(EX) }
          )
        );
        const minutes = Math.max(1, Math.round(distance / WALK_METERS_PER_MIN));
        const walkOnly: TransitRouteResponse = {
          route: {
            totalTime: minutes,
            totalDistance: distance,
            payment: 0,
            busTransitCount: 0,
            subwayTransitCount: 0,
            subpaths: [
              {
                trafficType: 3,
                sectionTime: minutes,
                distance,
                transportName: "도보",
                startName: "출발지",
                endName: "도착지",
              },
            ],
            isWalkOnly: true,
          },
        };
        writeCache(cacheKey, walkOnly);
        return NextResponse.json(walkOnly);
      }

      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const paths = data.result?.path;
    if (!paths || paths.length === 0) {
      return NextResponse.json(
        { error: "이동 가능한 대중교통 경로가 없습니다." },
        { status: 404 }
      );
    }

    // ODsay가 돌려준 여러 경로 중 도보를 포함한 이동 거리가 가장 짧은 것 하나만 쓴다
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: TransitRouteResponse = { route: pickShortest((paths as any[]).map(parsePath)) };

    // 성공한 결과만 보관한다 (에러는 캐시하지 않아 다음 요청에서 즉시 다시 시도된다)
    writeCache(cacheKey, body);

    return NextResponse.json(body);
  } catch (err: any) {
    console.error("Transit API Error:", err);
    return NextResponse.json(
      { error: err.message || "대중교통 경로 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
