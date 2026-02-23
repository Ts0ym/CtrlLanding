/** @type {import('next').NextConfig} */
//basePath: "/CtrlLanding",
//assetPrefix: "/CtrlLanding",
//NEXT_PUBLIC_BASE_PATH: "/CtrlLanding",
const nextConfig = {
  output: "export",
  distDir: "output",
  basePath: "/CtrlLanding",
  assetPrefix: "/CtrlLanding",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: "/CtrlLanding",
  },
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
