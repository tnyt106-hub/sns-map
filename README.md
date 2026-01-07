# 四国SNS飲食店マップ

SNS投稿を起点に、四国の飲食店・観光スポットを地図上に可視化するWebアプリケーション。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **スタイリング**: Tailwind CSS
- **デプロイ**: Cloudflare Pages
- **データベース**: Firebase Firestore ✅
- **地図**: Google Maps JavaScript API ✅
- **API**: YouTube Data API, Gemini API (予定)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

管理画面は [http://localhost:3000/admin](http://localhost:3000/admin) でアクセスできます。

### 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**重要**: `.env.local` ファイルは `.gitignore` に含まれているため、Gitにはコミットされません。

### 3. ビルド

```bash
npm run build
```

### 4. Cloudflare Pages へのデプロイ準備

```bash
npm run pages:build
```

## プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── stores/
│   │   │   └── route.ts  # 店舗データAPI ✅
│   │   └── posts/
│   │       └── route.ts  # 投稿データAPI ✅
│   ├── admin/
│   │   └── page.tsx      # 管理画面 ✅
│   ├── layout.tsx        # ルートレイアウト
│   ├── page.tsx          # ホームページ（地図表示） ✅
│   ├── globals.css       # グローバルスタイル
│   └── not-found.tsx     # 404ページ
├── components/
│   ├── Map.tsx           # Google Mapsコンポーネント ✅
│   └── LazyMap.tsx       # 遅延読み込みラッパー ✅
├── src/
│   └── lib/
│       ├── firebase.ts   # Firebase初期化設定 ✅
│       └── firestore.ts  # Firestore操作ヘルパー ✅
├── types/                # TypeScript型定義
│   ├── store.ts          # Store型定義 ✅
│   └── post.ts           # Post型定義 ✅
└── public/               # 静的ファイル
```

## Phase 1 (MVP) 実装状況

- [x] Firebase Firestore の設定 ✅
- [x] 管理画面（/admin）で店舗データ登録 ✅
- [x] geohash自動生成機能 ✅
- [x] Google Maps JavaScript API の統合（遅延読み込み） ✅
- [x] 店舗データの表示 ✅
- [x] 地図上でのピン表示 ✅
- [x] ピンクリックで店名・YouTubeリンク表示 ✅
- [ ] YouTube Data API の統合
- [ ] Gemini API の統合

## ライセンス

Private