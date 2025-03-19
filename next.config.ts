import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OCR_SPACE_API_KEY: process.env.OCR_SPACE_API_KEY,
  },
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable image optimization for Heroku
  images: {
    unoptimized: true,
  },
  // Set the base path if deploying to a subfolder
  // basePath: '/utility-ai-nextjs',
};

export default nextConfig;
