/** @type {import('next').NextConfig} */
//basePath: "/CtrlLanding",
//assetPrefix: "/CtrlLanding/",
const nextConfig = {
  output: "export",
  distDir: "output",
  basePath: "",
  assetPrefix: "",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: "",
  },
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
