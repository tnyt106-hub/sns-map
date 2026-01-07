import { NextResponse } from "next/server";
import { db } from "@/src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Post } from "@/types/post";

// GET: 全投稿データを取得
export async function GET() {
  try {
    const postsCollection = collection(db, "posts");
    const snapshot = await getDocs(postsCollection);
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Post & { id: string })[];

    // TimestampをJSONに変換
    const postsWithJsonTimestamps = posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toMillis(),
    }));

    return NextResponse.json({ posts: postsWithJsonTimestamps }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "投稿データの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
