import { bearerHeaders } from "@/features/auth/auth-session";
import {
  apiPaginatedRequest,
  apiRequest,
  type PaginationMeta,
} from "@/lib/api/client";
import type { ApiRole } from "@/features/auth/types";
import type { UserRecord, UserStatus } from "../types";

export function listUsers(
  filters: {
    page: number;
    limit: number;
    search?: string;
    role?: ApiRole;
    status?: UserStatus;
  },
  token: string,
  signal?: AbortSignal,
): Promise<{ data: UserRecord[]; meta: PaginationMeta }> {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search) query.set("search", filters.search);
  if (filters.role) query.set("role", filters.role);
  if (filters.status) query.set("status", filters.status);
  return apiPaginatedRequest<UserRecord>(`/users?${query}`, {
    headers: bearerHeaders(token),
    signal,
  });
}

export function updateUserRole(
  id: string,
  role: ApiRole,
  token: string,
): Promise<UserRecord> {
  return apiRequest<UserRecord>(`/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify({ role }),
  });
}

export function updateUserStatus(
  id: string,
  status: UserStatus,
  token: string,
): Promise<UserRecord> {
  return apiRequest<UserRecord>(`/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify({ status }),
  });
}
