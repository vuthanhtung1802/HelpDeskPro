import { bearerHeaders } from "@/features/auth/auth-session";
import { apiRequest } from "@/lib/api/client";
import type { RatingRecord } from "@/features/tickets/types";

export function createRating(
  ticketId: string,
  payload: { score: number; comment?: string },
  token: string,
): Promise<RatingRecord> {
  return apiRequest<RatingRecord>(
    `/tickets/${encodeURIComponent(ticketId)}/rating`,
    {
      method: "POST",
      headers: bearerHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}
