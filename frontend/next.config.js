/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Disable static export to prevent prerendering errors with client-side features like Context
  // All routes will be rendered on-demand which is fine for Railway
  staticPageGenerationTimeout: 0,
  // NEXT_PUBLIC_API_URL is set via Railway environment variables at runtime
  // Do not hardcode here as it will be overridden at build time
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['src'],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
