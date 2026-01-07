"use client";

import { useEffect, useRef, useState } from "react";
import { Store } from "@/types/store";
import { Post } from "@/types/post";
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "@/src/lib/youtube";
import { getGoogleMapsNavigationUrl } from "@/src/lib/google-maps";

interface StoreWithId extends Store {
  id: string;
}

interface MapProps {
  stores: (StoreWithId & {
    createdAt: number;
    updatedAt: number;
    lastScrapedAt: number;
  })[];
  posts: (Post & { id: string })[];
}

export default function Map({ stores, posts }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Google Maps APIの遅延読み込み
  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is not set");
      return;
    }

    // 既にスクリプトが読み込まれているか確認
    if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    // スクリプトが既に読み込まれているか確認
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }

    // スクリプトを動的に読み込む
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Failed to load Google Maps script");
    document.head.appendChild(script);

    return () => {
      // クリーンアップ
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 地図の初期化
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const center = { lat: 33.8415, lng: 133.9336 }; // 四国の中心あたり

    const googleMap = new google.maps.Map(mapRef.current, {
      zoom: 9,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(googleMap);
    setInfoWindow(new google.maps.InfoWindow());
  }, [isLoaded, map]);

  // マーカーの作成
  useEffect(() => {
    if (!map || !infoWindow) return;

    // 既存のマーカーをクリア
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    stores.forEach((store) => {
      // ピンサイズを投稿数に応じて変更（Phase 1: シンプルな実装）
      const pinSize = store.postCount > 0 ? "normal" : "small";

      // マーカーを作成
      const marker = new google.maps.Marker({
        position: { lat: store.lat, lng: store.lng },
        map,
        title: store.name,
        animation: google.maps.Animation.DROP,
      });

      // 投稿を取得（この店舗に関連する投稿）
      const storePosts = posts.filter((post) => post.storeId === store.id);
      const youtubePosts = storePosts.filter((post) => post.platform === "youtube");

      // クリックイベント
      marker.addListener("click", () => {
        // YouTube動画の最初の1件を取得
        const firstYouTubePost = youtubePosts.length > 0 ? youtubePosts[0] : null;
        const videoId = firstYouTubePost ? extractYouTubeVideoId(firstYouTubePost.url) : null;

        // GoogleマップのナビゲーションURLを生成
        const navigationUrl = getGoogleMapsNavigationUrl(store.lat, store.lng, store.name);

        // InfoWindowの内容を作成
        let content = `
          <div style="padding: 0; min-width: 320px; max-width: 560px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <!-- ヘッダー部分 -->
            <div style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;">
              <h3 style="margin: 0; font-size: 20px; font-weight: bold; line-height: 1.4;">
                ${store.name}
              </h3>
              <div style="margin-top: 8px; font-size: 13px; opacity: 0.9;">
                📍 投稿数: ${store.postCount}件
              </div>
            </div>

            <!-- ナビゲーションボタン -->
            <div style="padding: 12px 16px; background: #fff; border-bottom: 1px solid #e9ecef;">
              <a 
                href="${navigationUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  padding: 10px 16px;
                  background: #4285f4;
                  color: #fff;
                  text-decoration: none;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: 500;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  cursor: pointer;
                  width: 100%;
                  box-sizing: border-box;
                "
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; flex-shrink: 0;">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>Googleマップでナビを開始</span>
              </a>
            </div>
        `;

        // YouTube動画を埋め込み表示
        if (videoId) {
          const embedUrl = getYouTubeEmbedUrl(videoId);
          content += `
            <!-- YouTube動画セクション -->
            <div style="padding: 16px; background: #fff;">
              <div style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #495057;">
                🎥 関連動画
              </div>
              <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <iframe
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
                  src="${embedUrl}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  loading="lazy"
                ></iframe>
              </div>
              ${youtubePosts.length > 1 ? `
                <div style="margin-top: 12px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #6c757d; text-align: center;">
                  他 ${youtubePosts.length - 1} 件の動画があります
                </div>
              ` : ""}
            </div>
          `;
        } else {
          content += `
            <!-- 動画なしメッセージ -->
            <div style="padding: 32px 16px; text-align: center; background: #f8f9fa;">
              <div style="font-size: 48px; margin-bottom: 12px;">📹</div>
              <p style="margin: 0; font-size: 14px; color: #6c757d;">
                YouTube動画はまだ登録されていません
              </p>
            </div>
          `;
        }

        content += `</div>`;

        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // 全マーカーが表示されるようにビューポートを調整
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach((marker) => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, infoWindow, stores, posts]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
