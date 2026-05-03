/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/inec',
  assetPrefix: '/inec/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/inec',
  },
}
module.exports = nextConfig
