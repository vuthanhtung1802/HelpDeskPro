import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function AdminCategoriesPage() {
  return <WorkspaceRoute allowedRole="ADMIN" view="categories" />;
}
