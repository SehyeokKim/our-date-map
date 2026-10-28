import { NextRequest, NextResponse } from "next/server";
import { RouteOptionsResponse } from "@/types/transit";
import {
  createSuccessCache,
  fetchKakaoRouting,
  parseWalkRoute,
  readCoordParams,
} from "@/lib/kakaoRoute";

/**
 * 카카오맵 도보 경로 조회 프록시. 결과는 경로 하나(`routes` 길이 0 또는 1)다.
 * 성공한 결과만 1시간 보관한다 (일 1,000건 무료 쿼터 보호).
 */
const cache = createSuccessCache(60 * 60 * 1000);

/** 걸어서 갈 길이 없다는 정상 결과 */
const NO_ROUTE_STATUSES = new Set([
  "SAME_POINT",
  "TOO_FAR_AWAY",
  "START_LINK_NOT_FOUND",
  "END_LINK_NOT_FOUND",
  "ROUTE_RESULT_NOT_FOUND",
]);

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
      "walk",
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
        { error: `도보 경로를 찾지 못했습니다 (${data.status}).` },
        { status: 400 }
      );
    }

    const body: RouteOptionsResponse = {
      routes: data.status === "OK" && data.route ? [parseWalkRoute(data.route)] : [],
    };
    cache.write(cacheKey, body);
    return NextResponse.json(body);
  } catch (err) {
    console.error("Walk API Error:", err);
    return NextResponse.json({ error: "도보 경로 조회 중 오류가 발생했습니다." }, { status: 502 });
  }
}
