/**
 * Typed HTTP client for the FastAPI backend.
 *
 * Every backend call in the frontend should go through `apiFetch` so that the
 * base URL, error handling and JSON parsing stay in one place.
 *
 * Configuration:
 *   NEXT_PUBLIC_API_URL  Base URL of the backend (see .env.example).
 *
 * Usage:
 *   const health = await getBackendHealth();
 *   const items  = await apiFetch<Item[]>("/items");
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

/** Raised for transport failures and non-2xx responses. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Fetch JSON from the backend.
 *
 * - Prefixes `NEXT_PUBLIC_API_URL`.
 * - Sends/accepts JSON.
 * - Throws `ApiError` on network failure or a non-2xx status so callers can
 *   branch on `error.status` (use `0` for "backend unreachable").
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`Cannot reach the backend at ${API_BASE_URL}`, 0);
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

/** Shape returned by the backend's `/health` endpoint. */
export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  time: string;
}

/** Check backend liveness. */
export function getBackendHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health");
}

export { API_BASE_URL };
