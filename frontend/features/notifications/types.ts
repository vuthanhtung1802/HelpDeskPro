export type NotificationType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_STATUS_UPDATED"
  | "COMMENT_CREATED";

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticket: { id: string; code: string; title: string } | null;
  actor: { id: string; fullName: string } | null;
}
