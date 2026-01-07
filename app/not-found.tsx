export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">404 - ページが見つかりません</h2>
      <a href="/" className="text-blue-600 hover:underline">
        ホームに戻る
      </a>
    </div>
  );
}