import { apiRequest } from "@/lib/api/client";
import { bearerHeaders } from "@/features/auth/auth-session";
import type { ChatAnswer, ChatMessage } from "../types";

export function askChatbot(
  token: string,
  messages: ChatMessage[],
): Promise<ChatAnswer> {
  return apiRequest<ChatAnswer>("/ai-chat/ask", {
    method: "POST",
    headers: bearerHeaders(token),
    body: JSON.stringify({
      messages: messages
        .filter((message) => message.id !== "welcome")
        .slice(-10)
        .map(({ role, content }) => ({ role, content })),
    }),
  });
}
