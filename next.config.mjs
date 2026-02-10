/** @type {import('next').NextConfig} */

// GitHub Pages: site is at https://username.github.io/REPO_NAME/
const isGitHubPages = process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY;
const repoName = isGitHubPages ? process.env.GITHUB_REPOSITORY.split("/")[1] : "";
const basePath = repoName ? `/${repoName}` : "";
const assetPrefix = basePath ? `${basePath}/` : "";

const nextConfig = {
  output: "export",
  distDir: "output",
  basePath,
  assetPrefix,
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
