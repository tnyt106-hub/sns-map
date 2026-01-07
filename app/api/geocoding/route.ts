export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
/**
 * Google Maps Geocoding APIで住所から緯度・経度を取得
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    // 修正：サーバーサイド専用キーのみを使用
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Critical: GOOGLE_MAPS_API_KEY is not defined on the server.");
      return NextResponse.json({ error: "サーバー設定エラーが発生しました" }, { status: 500 });
    }

    // Geocoding APIで住所を緯度・経度に変換
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}&language=ja&region=jp`;

    const response = await fetch(geocodingUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding APIからの情報取得に失敗しました" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        { error: "住所が見つかりませんでした" },
        { status: 404 }
      );
    }

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: `Geocoding API エラー: ${data.status}` },
        { status: 500 }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // 都道府県を抽出
    let prefecture: "kagawa" | "ehime" | "kochi" | "tokushima" | null = null;
    for (const component of result.address_components) {
      if (component.types.includes("administrative_area_level_1")) {
        const prefectureName = component.long_name;
        if (prefectureName.includes("香川")) prefecture = "kagawa";
        else if (prefectureName.includes("愛媛")) prefecture = "ehime";
        else if (prefectureName.includes("高知")) prefecture = "kochi";
        else if (prefectureName.includes("徳島")) prefecture = "tokushima";
        break;
      }
    }

    return NextResponse.json({
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
      prefecture: prefecture,
    });
  } catch (error) {
    console.error("Error geocoding:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ジオコーディングに失敗しました",
      },
      { status: 500 }
    );
  }
}
