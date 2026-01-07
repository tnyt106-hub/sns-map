"use client";

import dynamic from "next/dynamic";
import { Store } from "@/types/store";
import { Post } from "@/types/post";

interface StoreWithId extends Store {
  id: string;
}

interface LazyMapProps {
  stores: (StoreWithId & {
    createdAt: number;
    updatedAt: number;
    lastScrapedAt: number;
  })[];
  posts: (Post & { id: string })[];
}

// 動的インポートで遅延読み込み（SSR無効化）
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">地図を読み込んでいます...</p>
      </div>
    </div>
  ),
});

export default function LazyMap(props: LazyMapProps) {
  return <Map {...props} />;
}
