/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_API_KEYS: process.env.GEMINI_API_KEYS,
    },
};

module.exports = nextConfig;
