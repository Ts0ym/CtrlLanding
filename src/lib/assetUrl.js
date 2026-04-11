export function getAssetUrl(path) {
  if (!path) return path;

  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  const uploadsOrigin =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:4000/api").replace(
          /\/api$/,
          "",
        )
      : "";

  if (path.startsWith("/uploads/")) {
    return `${uploadsOrigin}${path}`;
  }

  const base =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BASE_PATH || "" : "";

  return base + path;
}
