import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      't.alcy.cc', // 添加您要允许的图片域名
      // 如果还有其他外部图片域名，也在这里添加
      // 例如: 'example.com', 'another-image-host.net'
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // 忽略 eslint 检查
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TypeScript 检查
  },
  async headers() {
    return [
      {
        source: '/slidev/:uuid*', // Apply to the slidev dynamic route
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
