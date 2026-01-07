import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCcb35I0Dq7e7WUyivS4NBFgTkZ4JR1Pu0",
  authDomain: "shikoku-sns-map.firebaseapp.com",
  projectId: "shikoku-sns-map",
  storageBucket: "shikoku-sns-map.firebasestorage.app",
  messagingSenderId: "449676918606",
  appId: "1:449676918606:web:26a993d8119cf810f4e81f",
  measurementId: "G-CDM436BTG3",
};

// Firebase初期化（既に初期化されている場合は再初期化を避ける）
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firestoreインスタンスを取得
export const db: Firestore = getFirestore(app);

// Firebase Appインスタンスをエクスポート（必要に応じて使用）
export default app;