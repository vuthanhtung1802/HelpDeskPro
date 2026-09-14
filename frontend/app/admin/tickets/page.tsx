import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function AdminTicketsPage() {
  return <WorkspaceRoute allowedRole="ADMIN" view="tickets" />;
}
