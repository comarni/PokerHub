/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['three'],
  webpack: (config) => {
    config.externals = [...(config.externals || [])];
    return config;
  }
};

module.exports = nextConfig;
