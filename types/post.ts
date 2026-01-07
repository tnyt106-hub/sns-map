import { Timestamp } from "firebase/firestore";

export type Platform = "youtube"; // Phase 1 は YouTube のみ
export type PostStatus = "auto" | "pending" | "rejected";

export interface Post {
  storeId: string;
  platform: Platform;
  url: string;
  title?: string;
  text?: string;
  status: PostStatus;
  createdAt: Timestamp;
}