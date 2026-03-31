/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // NEXT_PUBLIC_API_URL is set via Railway environment variables at runtime
  // Do not hardcode here as it will be overridden at build time
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['src'],
  },
}

module.exports = nextConfig
