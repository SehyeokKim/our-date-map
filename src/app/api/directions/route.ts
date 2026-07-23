import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { origin, destination, waypoints } = body;
        // origin: { lng, lat }
        // destination: { lng, lat }
        // waypoints: [{ lng, lat }, { lng, lat }] (없으면 빈 배열 [])

        if (!origin || !destination) {
            return NextResponse.json({ error: '출발지와 도착지 좌표는 필수입니다.' }, { status: 400 });
        }

        const REST_API_KEY = process.env.KAKAO_REST_API_KEY;

        // 카카오모빌리티 다중 경유지 API 호출 규격에 맞춰 페이로드 구성
        const requestPayload = {
            origin: { x: origin.lng.toString(), y: origin.lat.toString() },
            destination: { x: destination.lng.toString(), y: destination.lat.toString() },
            waypoints: waypoints ? waypoints.map((wp: { lng: number; lat: number }, index: number) => ({
                name: `waypoint_${index}`,
                x: wp.lng.toString(),
                y: wp.lat.toString(),
            })) : [],
            priority: 'RECOMMEND',
        };

        const response = await fetch('https://apis-navi.kakaomobility.com/v1/waypoints/directions', {
            method: 'POST',
            headers: {
                Authorization: `KakaoAK ${REST_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
            throw new Error(`Kakao Mobility API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Waypoints Route Fetch Error:', error);
        return NextResponse.json({ error: '경로 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}