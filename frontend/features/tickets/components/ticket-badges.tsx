import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TICKET_PRIORITY_META, TICKET_STATUS_META } from "../ticket-meta";
import type { TicketPriority, TicketStatus } from "../types";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const meta = TICKET_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const meta = TICKET_PRIORITY_META[priority];
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", meta.className)}>
      {meta.label}
    </Badge>
  );
}
