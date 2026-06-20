/** @type {import('next').NextConfig} */
//basePath: "/CtrlLanding",
//assetPrefix: "/CtrlLanding",
//NEXT_PUBLIC_BASE_PATH: "/CtrlLanding",
const nextConfig = {
  allowedDevOrigins: ["192.168.1.222"],
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
