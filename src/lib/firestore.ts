import { 
  collection, 
  query, 
  getDocs, 
  getDoc, 
  doc, 
  QueryConstraint,
  CollectionReference,
  DocumentReference,
  Firestore
} from "firebase/firestore";
import { db } from "./firebase";
import { Store } from "@/types/store";
import { Post } from "@/types/post";

/**
 * Storesコレクションの参照を取得
 */
export const getStoresCollection = (): CollectionReference<Store> => {
  return collection(db, "stores") as CollectionReference<Store>;
};

/**
 * Postsコレクションの参照を取得
 */
export const getPostsCollection = (): CollectionReference<Post> => {
  return collection(db, "posts") as CollectionReference<Post>;
};

/**
 * 店舗を取得（全件）
 * Phase 1: シンプルなクエリのみ実装
 */
export const getAllStores = async (): Promise<Store[]> => {
  const storesCollection = getStoresCollection();
  const snapshot = await getDocs(storesCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Store & { id: string }));
};

/**
 * 店舗をIDで取得
 */
export const getStoreById = async (storeId: string): Promise<Store | null> => {
  const docRef = doc(db, "stores", storeId) as DocumentReference<Store>;
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Store & { id: string };
  }
  return null;
};

/**
 * 投稿を取得（店舗IDでフィルタ）
 */
export const getPostsByStoreId = async (storeId: string): Promise<Post[]> => {
  const postsCollection = getPostsCollection();
  const q = query(postsCollection, ...([] as QueryConstraint[]));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Post & { id: string }))
    .filter((post) => post.storeId === storeId);
};

/**
 * 四国エリアの店舗を取得（県でフィルタ）
 * Phase 1: シンプルな全件取得、Phase 2でgeohash最適化
 */
export const getStoresByPrefecture = async (
  prefecture: "kagawa" | "ehime" | "kochi" | "tokushima"
): Promise<Store[]> => {
  const allStores = await getAllStores();
  return allStores.filter((store) => store.prefecture === prefecture);
};