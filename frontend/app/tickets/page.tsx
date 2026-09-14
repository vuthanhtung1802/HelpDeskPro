import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function TicketsPage() {
  return <WorkspaceRoute allowedRole="USER" view="tickets" />;
}
