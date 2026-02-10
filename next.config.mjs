/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'output',
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
