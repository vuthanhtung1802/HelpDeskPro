import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function DashboardPage() {
  return <WorkspaceRoute allowedRole="USER" view="dashboard" />;
}
