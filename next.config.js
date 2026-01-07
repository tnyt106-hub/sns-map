/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages対応
  output: 'standalone',
  reactStrictMode: true,
  // 静的エクスポートが必要な場合は以下のコメントを外す
  // output: 'export',
}

module.exports = nextConfig