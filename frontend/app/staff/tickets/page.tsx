import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function StaffTicketsPage() {
  return <WorkspaceRoute allowedRole="AGENT" view="tickets" />;
}
