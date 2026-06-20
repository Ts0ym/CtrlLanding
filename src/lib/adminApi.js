const DEFAULT_ADMIN_API_BASE = "http://localhost:4000/api";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function normalizeApiBase(value) {
  return value ? value.replace(/\/$/, "") : "";
}

export function getAdminApiBase() {
  const configured = normalizeApiBase(process.env.NEXT_PUBLIC_ADMIN_API_URL);

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    if (hostname && !LOCAL_HOSTNAMES.has(hostname)) {
      return `${protocol}//${hostname}:4000/api`;
    }
  }

  return DEFAULT_ADMIN_API_BASE;
}

export function getAdminApiOrigin() {
  return getAdminApiBase().replace(/\/api$/, "");
}
