import "server-only";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export function getBackendUrl() {
  const configuredUrl = process.env.KREASI_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL;

  try {
    return new URL(configuredUrl).toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      "KREASI_BACKEND_URL harus berupa URL valid, contoh: http://127.0.0.1:8000",
    );
  }
}

export function getBackendApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendUrl()}/api/v1${normalizedPath}`;
}
