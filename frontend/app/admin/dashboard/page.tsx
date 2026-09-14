import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function AdminDashboardPage() {
  return <WorkspaceRoute allowedRole="ADMIN" view="dashboard" />;
}
