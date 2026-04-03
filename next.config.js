/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // 移除默认的 X-Powered-By 响应头，减少信息泄露
  poweredByHeader: false,
};

module.exports = nextConfig;
