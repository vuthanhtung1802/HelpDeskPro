import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function StaffTicketDetailPage() {
  return <WorkspaceRoute allowedRole="AGENT" view="ticket-detail" />;
}
