/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Allow larger bodies for AI image generation
    },
    // Increase the timeout for server actions that may take a while
    // such as AI image generation or complex data processing.
    serverActionsTimeout: 120000, // 2 minutes
  },
};

export default nextConfig;
