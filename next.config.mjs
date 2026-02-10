/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  distDir: "output",
  basePath: "/CtrlLanding",
  assetPrefix: "/CtrlLanding/",
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
