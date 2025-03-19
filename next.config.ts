import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OCR_SPACE_API_KEY: process.env.OCR_SPACE_API_KEY,
  },
  // Configure for GitHub Pages
  output: 'export',
  // Disable image optimization since it's not supported in static exports
  images: {
    unoptimized: true,
  },
  // Set the base path if deploying to a subfolder
  // basePath: '/utility-ai-nextjs',
};

export default nextConfig;
