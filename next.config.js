/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React StrictMode to prevent double mounting during development
  // This prevents duplicate socket connections
  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
    // Allow images from YouTube
    domains: ['i.ytimg.com', 'img.youtube.com'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;