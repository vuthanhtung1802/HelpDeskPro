import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function AdminTicketDetailPage() {
  return <WorkspaceRoute allowedRole="ADMIN" view="ticket-detail" />;
}
