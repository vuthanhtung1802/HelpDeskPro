export type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED"
  | "CANCELLED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketUser {
  id?: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface TicketRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  dueAt: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TicketUser;
  assignee: TicketUser | null;
  category: { id?: string; name: string; slug?: string };
  rating: RatingRecord | null;
}

export interface RatingRecord {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  agent: { id: string; fullName: string };
}

export interface Category {
  id: string;
  name: string;
}

export interface Agent {
  id: string;
  fullName: string;
  email: string;
}

export interface TicketHistoryRecord {
  id: string;
  action: string;
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  actor: TicketUser;
}
