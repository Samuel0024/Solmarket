/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      "rpc-websockets": false,
      "rpc-websockets/dist/lib/client": false,
    };
    return config;
  },
};

module.exports = nextConfig;
