import { bearerHeaders } from "@/features/auth/auth-session";
import { apiRequest } from "@/lib/api/client";
import type { CommentRecord } from "../types";

export function listComments(
  ticketId: string,
  token: string,
  signal?: AbortSignal,
): Promise<CommentRecord[]> {
  return apiRequest<CommentRecord[]>(
    `/tickets/${encodeURIComponent(ticketId)}/comments`,
    { headers: bearerHeaders(token), signal },
  );
}

export function createComment(
  ticketId: string,
  content: string,
  token: string,
  isInternal: boolean,
): Promise<CommentRecord> {
  const endpoint = isInternal ? "internal-notes" : "comments";
  return apiRequest<CommentRecord>(
    `/tickets/${encodeURIComponent(ticketId)}/${endpoint}`,
    {
      method: "POST",
      headers: bearerHeaders(token),
      body: JSON.stringify({ content }),
    },
  );
}
