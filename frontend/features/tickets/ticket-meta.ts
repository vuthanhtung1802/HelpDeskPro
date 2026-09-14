import type { TicketPriority, TicketStatus } from "./types";

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  OPEN: { label: "Mới mở", className: "bg-ticket-open-bg text-ticket-open-fg" },
  ASSIGNED: {
    label: "Đã phân công",
    className: "bg-ticket-assigned-bg text-ticket-assigned-fg",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    className: "bg-ticket-progress-bg text-ticket-progress-fg",
  },
  WAITING_FOR_USER: {
    label: "Chờ phản hồi",
    className: "bg-ticket-waiting-bg text-ticket-waiting-fg",
  },
  RESOLVED: {
    label: "Đã giải quyết",
    className: "bg-ticket-resolved-bg text-ticket-resolved-fg",
  },
  REOPENED: {
    label: "Đã mở lại",
    className: "bg-ticket-reopened-bg text-ticket-reopened-fg",
  },
  CLOSED: { label: "Đã đóng", className: "bg-ticket-closed-bg text-ticket-closed-fg" },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-ticket-cancelled-bg text-ticket-cancelled-fg",
  },
};

export const TICKET_PRIORITY_META: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  LOW: { label: "Thấp", className: "bg-muted text-muted-foreground" },
  MEDIUM: { label: "Trung bình", className: "bg-primary/10 text-primary" },
  HIGH: { label: "Cao", className: "bg-orange-50 text-orange-700" },
  URGENT: { label: "Khẩn cấp", className: "bg-destructive/10 text-destructive" },
};

export const TICKET_STATUS_ACTION_LABEL: Record<TicketStatus, string> = {
  OPEN: "Mở ticket",
  ASSIGNED: "Phân công",
  IN_PROGRESS: "Bắt đầu xử lý",
  WAITING_FOR_USER: "Chờ khách hàng phản hồi",
  RESOLVED: "Đánh dấu đã giải quyết",
  REOPENED: "Mở lại ticket",
  CLOSED: "Đóng ticket",
  CANCELLED: "Hủy ticket",
};

export const TICKET_HISTORY_LABEL: Record<string, string> = {
  CREATED: "Đã tạo ticket",
  UPDATED: "Đã cập nhật ticket",
  ASSIGNED: "Đã phân công người xử lý",
  STATUS_UPDATED: "Đã thay đổi trạng thái",
  DELETED: "Đã xóa ticket",
};
