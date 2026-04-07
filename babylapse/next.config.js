/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'babylapse',
  },
}

export default nextConfig
