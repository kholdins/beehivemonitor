/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["recharts"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
