/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/inec',
  assetPrefix: '/inec/',
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ensure all internal links use basePath automatically
  env: {
    NEXT_PUBLIC_BASE_PATH: '/inec',
  },
}

module.exports = nextConfig
