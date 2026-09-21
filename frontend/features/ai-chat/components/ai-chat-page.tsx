"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Send, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ApiRole } from "@/features/auth/types";
import { askChatbot } from "../api/ai-chat-api";
import type { ChatMessage } from "../types";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý hỏi đáp của HelpDesk Pro. Bạn cần hỗ trợ vấn đề gì?",
};

export function AiChatPage({
  token,
  role,
}: {
  token: string;
  role: ApiRole;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = question.trim();
    if (!content || pending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setPending(true);

    try {
      const result = await askChatbot(token, nextMessages);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
        },
      ]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể nhận câu trả lời từ chatbot.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">TRỢ LÝ AI</p>
          <h1 className="mt-1 text-2xl font-bold">Hỏi đáp HelpDesk Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {role === "AGENT"
              ? "Hỏi về quy trình hỗ trợ và cách xử lý tình huống thường gặp."
              : "Hỏi cách sử dụng hệ thống hoặc cách xử lý vấn đề thường gặp."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMessages([welcomeMessage]);
            setError("");
          }}
          disabled={pending || messages.length === 1}
        >
          <Trash2 /> Xóa hội thoại
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-5 text-primary" /> Chatbot hỏi đáp
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="h-[min(58vh,560px)] space-y-5 overflow-y-auto p-4 md:p-6"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-full ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                >
                  {message.role === "user" ? (
                    <UserRound className="size-4" />
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
                <div
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
                Đang soạn câu trả lời...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="border-t p-4 md:p-6">
            {error && (
              <p role="alert" className="mb-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex items-end gap-3">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Nhập câu hỏi của bạn..."
                aria-label="Câu hỏi cho chatbot"
                maxLength={4000}
                rows={2}
                disabled={pending}
                className="min-h-12 resize-none"
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0"
                disabled={pending || !question.trim()}
                aria-label="Gửi câu hỏi"
              >
                <Send />
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              AI có thể trả lời chưa chính xác. Không nhập mật khẩu, mã xác thực
              hoặc API key.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
