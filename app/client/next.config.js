/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        domains: ["127.0.0.1", "localhost"],
        unoptimized: true,
    },
};

module.exports = nextConfig;