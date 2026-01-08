/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pagesでは standalone は不要（またはエラーの原因）なので削除します
  reactStrictMode: true,
  
  // もし特定のCloudflare設定が必要な場合はここに追加しますが、
  // 基本的には標準の設定で動作します。
}

module.exports = nextConfig