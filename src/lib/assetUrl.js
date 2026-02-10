/** Путь к статике с учётом basePath (GitHub Pages). */
export function getAssetUrl(path) {
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BASE_PATH || "" : "";
  return base + path;
}
