import { NextRequest, NextResponse } from "next/server";
import { TransitRouteInfo, TransitSubPath } from "@/types/transit";
import { ODSAY_PATH_TYPE, isTransitMode } from "@/lib/transit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const SX = searchParams.get("SX");
  const SY = searchParams.get("SY");
  const EX = searchParams.get("EX");
  const EY = searchParams.get("EY");
  const modeParam = searchParams.get("mode");
  // 지정이 없으면 지하철+버스(0)로 폭넓게 탐색한다
  const requestedPathType = isTransitMode(modeParam) ? ODSAY_PATH_TYPE[modeParam] : 0;

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

  try {
    const origin = request.nextUrl.origin || "http://localhost:3000";
    const refererHeader = request.headers.get("referer") || origin;

    const callOdsay = async (pathType: number) => {
      const odsayUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${SX}&SY=${SY}&EX=${EX}&EY=${EY}&SearchPathType=${pathType}&apiKey=${encodeURIComponent(
        apiKey
      )}`;

      const res = await fetch(odsayUrl, {
        headers: {
          Accept: "application/json",
          Referer: refererHeader,
        },
        next: { revalidate: 3600 }, // Cache on Next.js server side for 1 hour
      });

      if (!res.ok) {
        throw new Error(`ODsay API HTTP 오류: ${res.status}`);
      }

      return res.json();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasNoPath = (d: any) => Boolean(d?.error) || !d?.result?.path?.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isWalkOnly = (d: any) => {
      const code = d?.error?.[0]?.code ?? d?.error?.code;
      return code === "-98" || code === -98;
    };

    let data = await callOdsay(requestedPathType);
    let fallbackApplied = false;

    // 고른 수단으로는 길이 없을 수 있다 (예: 지하철이 없는 지역).
    // 이때만 지하철+버스로 한 번 더 찾아보고, 대체했음을 응답에 표시한다.
    if (requestedPathType !== 0 && hasNoPath(data) && !isWalkOnly(data)) {
      const retry = await callOdsay(0);
      if (!hasNoPath(retry)) {
        data = retry;
        fallbackApplied = true;
      }
    }

    // Check for ODsay specific error code
    if (data.error) {
      const errCode = data.error[0]?.code || data.error?.code;
      const errMsg = data.error[0]?.message || data.error?.message || "경로를 찾을 수 없습니다.";

      // Handle short distance / walk only error (-98 or similar)
      if (errCode === "-98" || errCode === -98) {
        return NextResponse.json({
          totalTime: 10,
          payment: 0,
          busTransitCount: 0,
          subwayTransitCount: 0,
          subpaths: [
            {
              trafficType: 3,
              sectionTime: 10,
              distance: 500,
              transportName: "도보",
              startName: "출발지",
              endName: "도착지",
            },
          ],
          isWalkOnly: true,
        } as TransitRouteInfo);
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

    // Select the best/recommended path (first path)
    const bestPath = paths[0];
    const info = bestPath.info;

    const polylinePath: { lat: number; lng: number }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subpaths: TransitSubPath[] = (bestPath.subPath || []).map((sub: any) => {
      let transportName = "";
      if (sub.trafficType === 1) {
        // Subway
        const laneName = sub.lane?.[0]?.name || "";
        transportName = laneName.includes("호선") ? laneName : `${laneName} 지하철`;
      } else if (sub.trafficType === 2) {
        // Bus
        transportName = sub.lane?.[0]?.busNo || "버스";
      } else {
        // Walk
        transportName = "도보";
      }

      // Collect station coordinates for polyline path if available
      if (sub.passStopList?.stations) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sub.passStopList.stations.forEach((st: any) => {
          if (st.y && st.x) {
            polylinePath.push({
              lat: parseFloat(st.y),
              lng: parseFloat(st.x),
            });
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

    const routeInfo: TransitRouteInfo = {
      totalTime: info.totalTime || 0,
      payment: info.payment || 0,
      busTransitCount: info.busTransitCount || 0,
      subwayTransitCount: info.subwayTransitCount || 0,
      firstStartStation: info.firstStartStation || "",
      lastEndStation: info.lastEndStation || "",
      subpaths,
      polylinePath: polylinePath.length > 0 ? polylinePath : undefined,
      isWalkOnly: info.busTransitCount === 0 && info.subwayTransitCount === 0,
      fallbackApplied,
    };

    return NextResponse.json(routeInfo);
  } catch (err: any) {
    console.error("Transit API Error:", err);
    return NextResponse.json(
      { error: err.message || "대중교통 경로 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
