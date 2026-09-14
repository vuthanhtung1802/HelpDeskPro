import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function AdminUsersPage() {
  return <WorkspaceRoute allowedRole="ADMIN" view="users" />;
}
