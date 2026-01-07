import { NextRequest, NextResponse } from "next/server";

/**
 * Gemini APIを使って動画情報から店名・住所を推測
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title && !description) {
      return NextResponse.json(
        { error: "タイトルまたは説明文が必要です" },
        { status: 400 }
      );
    }

    // Gemini APIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Gemini APIキーがない場合、正規表現でフォールバック
      return extractWithRegex(title, description);
    }

    try {
      // Gemini APIを使用して情報抽出
      const prompt = `以下のYouTube動画のタイトルと説明文から、四国（香川県、愛媛県、高知県、徳島県）の店舗情報を抽出してください。

タイトル: ${title || "なし"}
説明文: ${description || "なし"}

以下のJSON形式で回答してください。情報が不明な場合はnullを返してください。
{
  "storeName": "店名または施設名",
  "address": "都道府県から始まる完全な住所",
  "prefecture": "kagawa"または"ehime"または"kochi"または"tokushima"またはnull,
  "category": "gourmet"または"tourism"または"onsen"または"spot"またはnull
}`;

      // Gemini API v1beta を使用
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Gemini API呼び出しに失敗しました");
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // JSONを抽出（コードブロックを除去）
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return NextResponse.json(extracted);
      }

      // JSONが見つからない場合は正規表現でフォールバック
      return extractWithRegex(title, description);
    } catch (geminiError) {
      console.error("Gemini API Error:", geminiError);
      // Gemini APIエラー時は正規表現でフォールバック
      return extractWithRegex(title, description);
    }
  } catch (error) {
    console.error("Error extracting location:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "情報の抽出に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * 正規表現を使って店名・住所を抽出（フォールバック）
 */
function extractWithRegex(title: string = "", description: string = "") {
  const text = `${title} ${description}`;

  // 都道府県を検出
  const prefectureMap: Record<string, "kagawa" | "ehime" | "kochi" | "tokushima"> = {
    香川: "kagawa",
    愛媛: "ehime",
    高知: "kochi",
    徳島: "tokushima",
  };

  let prefecture: "kagawa" | "ehime" | "kochi" | "tokushima" | null = null;
  for (const [key, value] of Object.entries(prefectureMap)) {
    if (text.includes(key)) {
      prefecture = value;
      break;
    }
  }

  // 住所パターンを検出（都道府県名 + 市区町村名など）
  const addressPattern = /([都道府県][^\s]*[市区町村][^\s]*(?:[0-9-]+[号地番]*)?)/;
  const addressMatch = text.match(addressPattern);
  const address = addressMatch ? addressMatch[1] : null;

  // カテゴリーを推測
  let category: "gourmet" | "tourism" | "onsen" | "spot" | null = null;
  if (text.match(/うどん|ラーメン|居酒屋|レストラン|カフェ|食堂|料理|グルメ|食事|食べ/)) {
    category = "gourmet";
  } else if (text.match(/温泉|湯|お風呂/)) {
    category = "onsen";
  } else if (text.match(/観光|名所|見学|散策|巡り/)) {
    category = "tourism";
  }

  // 店名を推測（タイトルから）
  let storeName = title.split("】")[1] || title.split("]")[1] || title;
  storeName = storeName.trim().substring(0, 50); // 長すぎる場合は切り詰め

  return NextResponse.json({
    storeName: storeName || null,
    address: address,
    prefecture: prefecture,
    category: category,
  });
}
