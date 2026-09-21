import { WorkspaceRoute } from "@/features/workspace/workspace-route";

export default function ChatbotPage() {
  return <WorkspaceRoute allowedRole="USER" view="ai-chat" />;
}
