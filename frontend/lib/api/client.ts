import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/access-token";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  message?: string | string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorMessage(body: ApiErrorBody, fallback: string): string {
  if (Array.isArray(body.message)) return body.message.join(". ");
  return body.message || fallback;
}

interface RefreshResult {
  accessToken: string;
}

let refreshRequest: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as ApiSuccess<RefreshResult>;
        if (!("data" in body) || !body.data.accessToken) return null;
        setAccessToken(body.data.accessToken);
        return body.data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshRequest = null;
      });
  }

  const token = await refreshRequest;
  if (!token) clearAccessToken();
  return token;
}

function requestHeaders(options: RequestInit, token?: string): Headers {
  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (headers.has("Authorization")) {
    const currentToken = token ?? getAccessToken();
    if (currentToken) headers.set("Authorization", `Bearer ${currentToken}`);
  }
  return headers;
}

export async function apiFileRequest(
  path: string,
  options: RequestInit = {},
): Promise<Blob> {
  const response = await fetchWithSessionRefresh(path, options);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      errorMessage(body, "Không thể tải file."),
      response.status,
    );
  }
  return response.blob();
}

async function fetchWithSessionRefresh(
  path: string,
  options: RequestInit,
): Promise<Response> {
  const authenticated = new Headers(options.headers).has("Authorization");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: requestHeaders(options),
  });

  if (response.status !== 401 || !authenticated) return response;

  const token = await refreshAccessToken();
  if (!token) return response;

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: requestHeaders(options, token),
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetchWithSessionRefresh(path, options);
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok || !("data" in body)) {
    throw new ApiError(
      errorMessage(body, "Yêu cầu không thể hoàn tất."),
      response.status,
    );
  }
  return body.data;
}

export async function apiPaginatedRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T[]; meta: PaginationMeta }> {
  const response = await fetchWithSessionRefresh(path, options);
  const body = (await response.json()) as
    (ApiSuccess<T[]> & { meta: PaginationMeta }) | ApiErrorBody;

  if (!response.ok || !("data" in body) || !("meta" in body)) {
    throw new ApiError(
      errorMessage(body, "Không thể tải danh sách."),
      response.status,
    );
  }
  return { data: body.data, meta: body.meta };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
