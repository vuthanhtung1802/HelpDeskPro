import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function StaffDashboardPage() {
  return <WorkspaceRoute allowedRole="AGENT" view="dashboard" />;
}
