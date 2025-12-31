
require('dotenv').config({ path: './.env' });

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: [
                "localhost:3000",
                "*.google.com",
                "*.firebase.app",
                "*.web.app",
            ]
        },
        serverActionsTimeout: 120, // 2 minutes
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com',
            },
             {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
};

module.exports = nextConfig;
