export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeVideoId } from "@/src/lib/youtube";
/**
 * YouTube Data API v3で動画情報を取得
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "動画URLが必要です" },
        { status: 400 }
      );
    }

    // 動画IDを抽出
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "無効なYouTube動画URLです" },
        { status: 400 }
      );
    }

    // YouTube Data APIキーを取得
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube APIキーが設定されていません" },
        { status: 500 }
      );
    }

    // YouTube Data API v3で動画情報を取得
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`;
    
    const response = await fetch(youtubeApiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData);
      return NextResponse.json(
        { error: "YouTube APIからの情報取得に失敗しました" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "動画が見つかりませんでした" },
        { status: 404 }
      );
    }

    const video = data.items[0];
    const snippet = video.snippet;

    return NextResponse.json({
      videoId,
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
    });
  } catch (error) {
    console.error("Error fetching YouTube video info:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "動画情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
