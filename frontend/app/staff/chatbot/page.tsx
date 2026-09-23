import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function StaffChatbotPage() {
  return <WorkspaceRoute allowedRole="AGENT" view="ai-chat" />;
}
