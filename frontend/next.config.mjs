/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
        // Disable concurrent features to avoid hydration issues
        concurrentFeatures: false,
    },
};

export default nextConfig; 