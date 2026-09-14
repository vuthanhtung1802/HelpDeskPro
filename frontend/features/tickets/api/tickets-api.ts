import { bearerHeaders } from "@/features/auth/auth-session";
import {
  apiPaginatedRequest,
  apiRequest,
  type PaginationMeta,
} from "@/lib/api/client";
import type {
  Category,
  Agent,
  TicketPriority,
  TicketRecord,
  TicketHistoryRecord,
  TicketStatus,
} from "../types";

export interface TicketFilters {
  page: number;
  limit: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  sortBy?: "createdAt" | "updatedAt" | "dueAt";
  order?: "asc" | "desc";
}

export function listAgents(
  token: string,
  signal?: AbortSignal,
): Promise<Agent[]> {
  return apiPaginatedRequest<Agent>("/users/agents?page=1&limit=100", {
    headers: bearerHeaders(token),
    signal,
  }).then((result) => result.data);
}

export function assignTicket(
  id: string,
  agentId: string,
  token: string,
): Promise<TicketRecord> {
  return apiRequest<TicketRecord>(`/tickets/${encodeURIComponent(id)}/assign`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify({ agentId }),
  });
}

export function takeTicket(id: string, token: string): Promise<TicketRecord> {
  return apiRequest<TicketRecord>(`/tickets/${encodeURIComponent(id)}/take`, {
    method: "PATCH",
    headers: bearerHeaders(token),
  });
}

export function changeTicketStatus(
  id: string,
  status: TicketStatus,
  token: string,
): Promise<TicketRecord> {
  return apiRequest<TicketRecord>(`/tickets/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: bearerHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export function getTicketHistory(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<TicketHistoryRecord[]> {
  return apiRequest<TicketHistoryRecord[]>(
    `/tickets/${encodeURIComponent(id)}/history`,
    { headers: bearerHeaders(token), signal },
  );
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: string;
  priority: TicketPriority;
}

export function listTickets(
  filters: TicketFilters,
  token: string,
  signal?: AbortSignal,
): Promise<{ data: TicketRecord[]; meta: PaginationMeta }> {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.priority) query.set("priority", filters.priority);
  if (filters.sortBy) query.set("sortBy", filters.sortBy);
  if (filters.order) query.set("order", filters.order);
  return apiPaginatedRequest<TicketRecord>(`/tickets?${query}`, {
    headers: bearerHeaders(token),
    signal,
  });
}

export function getTicket(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<TicketRecord> {
  return apiRequest<TicketRecord>(`/tickets/${encodeURIComponent(id)}`, {
    headers: bearerHeaders(token),
    signal,
  });
}

export function createTicket(
  payload: CreateTicketRequest,
  token: string,
): Promise<TicketRecord> {
  return apiRequest<TicketRecord>("/tickets", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function listCategories(
  token: string,
  signal?: AbortSignal,
): Promise<Category[]> {
  return apiRequest<Category[]>("/categories", {
    headers: bearerHeaders(token),
    signal,
  });
}
