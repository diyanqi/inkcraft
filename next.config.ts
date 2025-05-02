import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      't.alcy.cc', // 添加您要允许的图片域名
      // 如果还有其他外部图片域名，也在这里添加
      // 例如: 'example.com', 'another-image-host.net'
    ],
  },
};

export default nextConfig;
