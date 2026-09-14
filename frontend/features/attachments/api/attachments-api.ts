import { bearerHeaders } from "@/features/auth/auth-session";
import { apiFileRequest, apiRequest } from "@/lib/api/client";
import type { AttachmentRecord } from "../types";

export function listAttachments(
  ticketId: string,
  token: string,
  signal?: AbortSignal,
): Promise<AttachmentRecord[]> {
  return apiRequest<AttachmentRecord[]>(
    `/tickets/${encodeURIComponent(ticketId)}/attachments`,
    { headers: bearerHeaders(token), signal },
  );
}

export function uploadAttachment(
  ticketId: string,
  file: File,
  token: string,
): Promise<AttachmentRecord> {
  const body = new FormData();
  body.set("file", file);
  return apiRequest<AttachmentRecord>(
    `/tickets/${encodeURIComponent(ticketId)}/attachments`,
    { method: "POST", headers: bearerHeaders(token), body },
  );
}

export function downloadAttachment(
  id: string,
  token: string,
): Promise<Blob> {
  return apiFileRequest(`/attachments/${encodeURIComponent(id)}/download`, {
    headers: bearerHeaders(token),
  });
}

export function deleteAttachment(id: string, token: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/attachments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
}
