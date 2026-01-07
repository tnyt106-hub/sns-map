import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "店名が必要です" }, { status: 400 });
    }

    // 修正：NEXT_PUBLIC_ へのフォールバックを削除
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error("Critical: GOOGLE_MAPS_API_KEY is not defined on the server.");
      return NextResponse.json({ error: "サーバー設定エラーが発生しました" }, { status: 500 });
    }
    // デバッグ用ログ（ターミナルに表示されます）
    console.log("--- Request Info ---");
    console.log("Search Name:", name);
    console.log("API Key Status:", apiKey ? "Present" : "Missing");

    const url = "https://places.googleapis.com/v1/places:searchText";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey || "",
        // フィールドマスクを最小限にしてテスト
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
      },
      body: JSON.stringify({
        textQuery: name,
        languageCode: "ja",
        maxResultCount: 1 // 1件だけ取得
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // 【重要】ここのログをターミナルで確認してください
      console.error("--- GOOGLE API ERROR DETAIL ---");
      console.error("Status:", response.status);
      console.error("Message:", JSON.stringify(data, null, 2));
      console.error("-------------------------------");
      
      return NextResponse.json({ 
        error: "Google APIエラーが発生しました。ターミナルのログを確認してください。", 
        details: data 
      }, { status: 400 });
    }

    if (!data.places || data.places.length === 0) {
      return NextResponse.json({ error: "店舗が見つかりませんでした" }, { status: 404 });
    }

    const found = data.places[0];
    return NextResponse.json({
      address: found.formattedAddress,
      lat: found.location?.latitude,
      lng: found.location?.longitude,
      place_id: found.id,
      name: found.displayName?.text,
      full: found
    });

  } catch (error) {
    console.error("[Server Error]:", error);
    return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
  }
}