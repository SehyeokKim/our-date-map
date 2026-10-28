import { NextRequest, NextResponse } from "next/server";
import { RouteOptionsResponse } from "@/types/transit";
import {
  createSuccessCache,
  fetchKakaoRouting,
  parseTransitRoutes,
  readCoordParams,
} from "@/lib/kakaoRoute";

/**
 * 카카오맵 대중교통 경로 조회 프록시.
 * 한 번의 응답에 후보 경로가 모두 들어 있으므로, 화면에서 후보 목록을 열어도 추가 호출이 없다.
 * 성공한 결과만 1시간 보관한다 (일 1,000건 무료 쿼터 보호).
 */
const cache = createSuccessCache(60 * 60 * 1000);

/** 대중교통으로 갈 길이 없다는 정상 결과. 근거리(`NO_RESULTS`)도 여기 해당하며 화면에서 도보로 대신한다 */
const NO_ROUTE_STATUSES = new Set(["NO_RESULTS", "EQUAL_POINTS", "STARTNODES_NULL", "ENDNODES_NULL"]);

export async function GET(request: NextRequest) {
  const coords = readCoordParams(new URL(request.url).searchParams);
  if (!coords) {
    return NextResponse.json(
      { error: "필수 파라미터가 누락되었습니다 (SX, SY, EX, EY)." },
      { status: 400 }
    );
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error("Missing KAKAO_REST_API_KEY in environment variables");
    return NextResponse.json({ error: "KAKAO_REST_API_KEY is not configured" }, { status: 500 });
  }

  const { origin, destination } = coords;
  const cacheKey = `${origin.lng},${origin.lat}->${destination.lng},${destination.lat}`;
  const cached = cache.read(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const data = await fetchKakaoRouting(
      "publictraffic",
      {
        start_x: String(origin.lng),
        start_y: String(origin.lat),
        end_x: String(destination.lng),
        end_y: String(destination.lat),
      },
      apiKey
    );

    if (data.status !== "OK" && !NO_ROUTE_STATUSES.has(data.status)) {
      return NextResponse.json(
        { error: `대중교통 경로를 찾지 못했습니다 (${data.status}).` },
        { status: 400 }
      );
    }

    const body: RouteOptionsResponse = {
      routes: data.status === "OK" ? parseTransitRoutes(data.routes ?? [], origin, destination) : [],
    };
    cache.write(cacheKey, body);
    return NextResponse.json(body);
  } catch (err) {
    console.error("Transit API Error:", err);
    return NextResponse.json(
      { error: "대중교통 경로 조회 중 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
