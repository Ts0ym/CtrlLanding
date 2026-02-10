/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  distDir: "output",
  basePath: "/CtrlLanding",
  assetPrefix: "/CtrlLanding/",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/CtrlLanding",
  },
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
