import { bearerHeaders } from "@/features/auth/auth-session";
import { apiRequest } from "@/lib/api/client";
import type { NotificationRecord } from "../types";

export function listNotifications(
  token: string,
  signal?: AbortSignal,
): Promise<NotificationRecord[]> {
  return apiRequest<NotificationRecord[]>("/notifications", {
    headers: bearerHeaders(token),
    signal,
  });
}

export function markNotificationRead(
  id: string,
  token: string,
): Promise<NotificationRecord> {
  return apiRequest<NotificationRecord>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH", headers: bearerHeaders(token) },
  );
}

export function markAllNotificationsRead(
  token: string,
): Promise<{ count: number }> {
  return apiRequest<{ count: number }>("/notifications/read-all", {
    method: "PATCH",
    headers: bearerHeaders(token),
  });
}
