"use client";

import { useState } from "react";

export default function AdminPage() {
  const [formData, setFormData] = useState({
    name: "",
    videoUrl: "",
    lat: "",
    lng: "",
    address: "",
    prefecture: "kagawa" as "kagawa" | "ehime" | "kochi" | "tokushima",
    category: "gourmet" as "gourmet" | "tourism" | "onsen" | "spot",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // YouTube動画タイトル取得＆簡易店名抽出のみ実装
  const handleFetchInfo = async () => {
    if (!formData.videoUrl) {
      setMessage({ type: "error", text: "YouTube動画URLを入力してください" });
      return;
    }
    setIsFetching(true);
    setMessage(null);
    try {
      // YouTube Data APIで動画情報を取得
      const videoInfoResponse = await fetch("/api/youtube/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: formData.videoUrl }),
      });
      if (!videoInfoResponse.ok) {
        const error = await videoInfoResponse.json();
        throw new Error(error.error || "動画タイトル取得に失敗しました");
      }
      const videoInfo = await videoInfoResponse.json();
      // タイトルから店名部分のシンプル抽出
      let extractedName = videoInfo.title || "";
      // 一般的な区切り（|, -, :, ～, ：, ＠, 【, 】,  ' ', '】', '」', '(', '[', '『' など）で区切り左側を優先
      extractedName = extractedName.split(/[\|\-\:：〜～@【】（）\[\]『』「」\(\)].*?/)[0]?.trim() || videoInfo.title.trim();
      // もし空ならタイトルそのまま使う
      if (!extractedName) extractedName = videoInfo.title.trim();
      setFormData((prev) => ({ ...prev, name: extractedName }));
      setMessage({ type: "success", text: `✅ 動画タイトル取得: ${videoInfo.title}\n店名候補: ${extractedName}` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "動画タイトル取得に失敗しました" });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // バリデーション
      if (!formData.name || !formData.lat || !formData.lng) {
        throw new Error("店名、緯度、経度は必須項目です");
      }

      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("緯度・経度は数値で入力してください");
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("緯度・経度の範囲が正しくありません");
      }

      const response = await fetch("/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          videoUrl: formData.videoUrl,
          lat,
          lng,
          address: formData.address,
          prefecture: formData.prefecture,
          category: formData.category,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "保存に失敗しました");
      }

      setMessage({ type: "success", text: "店舗データを保存しました！" });
      
      // フォームをリセット
      setFormData({
        name: "",
        videoUrl: "",
        lat: "",
        lng: "",
        address: "",
        prefecture: "kagawa",
        category: "gourmet",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "保存に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            店舗データ登録（管理画面）
          </h1>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 店名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                店名 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.name) {
                      setMessage({ type: "error", text: "店名を入力してください" });
                      return;
                    }
                    setIsFetching(true);
                    setMessage(null);
                    try {
                      const resp = await fetch("/api/googlemaps/place-search", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: formData.name }),
                      });
                      if (!resp.ok) {
                        const err = await resp.json();
                        throw new Error(err.error || "Googleマップ検索で候補が見つかりませんでした");
                      }
                      const data = await resp.json();
                      setFormData((prev) => ({
                        ...prev,
                        address: (data.address || "") + (data.full?.name && !data.address?.includes(data.full.name) ? `（${data.full.name}）` : ""),
                        lat: data.lat ? data.lat.toString() : prev.lat,
                        lng: data.lng ? data.lng.toString() : prev.lng,
                      }));
                      setMessage({ type: "success", text: `✅ 店名からGoogleマップ情報を取得し自動入力\n住所: ${data.address}\n緯度: ${data.lat} 経度: ${data.lng}` });
                    } catch (err) {
                      setMessage({ type: "error", text: err instanceof Error ? err.message : "Googleマップ検索に失敗しました。" });
                    } finally {
                      setIsFetching(false);
                    }
                  }}
                  disabled={isFetching || !formData.name}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isFetching ? "取得中..." : "店名から自動補完"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                店名を入力し「店名から自動補完」でGoogleマップの候補情報を住所・緯度経度に反映できます。
              </p>
            </div>

            {/* YouTube動画URL */}
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube動画URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleFetchInfo}
                  disabled={isFetching || !formData.videoUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isFetching ? "取得中..." : "情報取得"}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                「情報取得」ボタンを押すと、動画情報から店名・住所を自動入力します
              </p>
            </div>

            {/* 緯度・経度 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">
                  緯度 (Lat) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="lat"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="34.3401"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">
                  経度 (Lng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="lng"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="134.0434"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* 地名 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                地名
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="例: 香川県高松市..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 都道府県 */}
            <div>
              <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-1">
                都道府県
              </label>
              <select
                id="prefecture"
                value={formData.prefecture}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prefecture: e.target.value as typeof formData.prefecture,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="kagawa">香川県</option>
                <option value="ehime">愛媛県</option>
                <option value="kochi">高知県</option>
                <option value="tokushima">徳島県</option>
              </select>
            </div>

            {/* カテゴリー */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリー
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as typeof formData.category,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="gourmet">飲食店</option>
                <option value="tourism">観光</option>
                <option value="onsen">温泉</option>
                <option value="spot">スポット</option>
              </select>
            </div>

            {/* 送信ボタン */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "保存中..." : "店舗データを保存"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>注意:</strong> 緯度・経度は自動的にgeohashに変換されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}