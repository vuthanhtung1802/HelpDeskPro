import { bearerHeaders } from "@/features/auth/auth-session";
import type { Role } from "@/features/auth/types";
import { apiRequest } from "@/lib/api/client";

export interface DashboardStats {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
}

const endpointByRole: Record<Role, string> = {
  customer: "/dashboard/user",
  staff: "/dashboard/agent",
  admin: "/dashboard/admin",
};

export function getDashboardStats(
  role: Role,
  token: string,
  signal?: AbortSignal,
): Promise<DashboardStats> {
  return apiRequest<DashboardStats>(endpointByRole[role], {
    headers: bearerHeaders(token),
    signal,
  });
}
