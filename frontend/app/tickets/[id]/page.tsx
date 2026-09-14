import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function Page() {
  return <WorkspaceRoute allowedRole="USER" view="ticket-detail" />;
}
