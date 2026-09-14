"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AuthUser } from "@/features/auth/types";
import type { TicketRecord } from "@/features/tickets/types";
import { createComment, listComments } from "../api/comments-api";
import type { CommentRecord } from "../types";

function formatCommentDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TicketComments({
  ticket,
  token,
  currentUser,
}: {
  ticket: TicketRecord;
  token: string;
  currentUser: AuthUser;
}) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [content, setContent] = useState("");
  const [internal, setInternal] = useState(currentUser.role === "ADMIN");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listComments(ticket.id, token, controller.signal)
      .then((result) => {
        setComments(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải bình luận.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [revision, ticket.id, token]);

  const isOwner =
    currentUser.role === "USER" && ticket.creator.id === currentUser.id;
  const isAssignedAgent =
    currentUser.role === "AGENT" && ticket.assignee?.id === currentUser.id;
  const canSubmit =
    !["CLOSED", "CANCELLED"].includes(ticket.status) &&
    (isOwner || isAssignedAgent || currentUser.role === "ADMIN");

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) {
      setError("Hãy nhập nội dung bình luận.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const created = await createComment(
        ticket.id,
        cleanContent,
        token,
        currentUser.role === "ADMIN" || internal,
      );
      setComments((current) => [...current, created]);
      setContent("");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể gửi bình luận.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-primary" />
        <h2 className="font-bold">Trao đổi</h2>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Đang tải bình luận...</p>
      ) : comments.length ? (
        <ol className="mt-5 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{comment.author.fullName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {comment.isInternal ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                      <LockKeyhole className="size-3" /> Nội bộ
                    </span>
                  ) : null}
                  <time dateTime={comment.createdAt}>
                    {formatCommentDate(comment.createdAt)}
                  </time>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {comment.content}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Chưa có bình luận.</p>
      )}

      {error ? (
        <div role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          <p>{error}</p>
          {loading ? null : (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>
              Tải lại
            </Button>
          )}
        </div>
      ) : null}

      {canSubmit ? (
        <form className="mt-5 border-t border-slate-100 pt-5" onSubmit={submitComment}>
          <label htmlFor="comment-content" className="text-sm font-semibold">
            {currentUser.role === "ADMIN" ? "Thêm ghi chú nội bộ" : "Phản hồi"}
          </label>
          <Textarea
            id="comment-content"
            className="mt-2"
            rows={4}
            maxLength={5000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Nhập nội dung trao đổi..."
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {currentUser.role === "AGENT" ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(event) => setInternal(event.target.checked)}
                />
                Chỉ nhân viên và quản trị viên được xem
              </label>
            ) : <span />}
            <Button disabled={pending || !content.trim()}>
              {pending ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
          {["CLOSED", "CANCELLED"].includes(ticket.status)
            ? "Ticket đã kết thúc nên không thể thêm bình luận."
            : "Bạn chỉ có thể bình luận sau khi ticket được phân công cho mình."}
        </p>
      )}
    </section>
  );
}
