"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Download, File, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/features/auth/types";
import type { TicketRecord } from "@/features/tickets/types";
import {
  deleteAttachment,
  downloadAttachment,
  listAttachments,
  uploadAttachment,
} from "../api/attachments-api";
import type { AttachmentRecord } from "../types";

const MAX_SIZE = 10 * 1024 * 1024;

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function TicketAttachments({
  ticket,
  token,
  currentUser,
}: {
  ticket: TicketRecord;
  token: string;
  currentUser: AuthUser;
}) {
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listAttachments(ticket.id, token, controller.signal)
      .then(setAttachments)
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError("Không thể tải file đính kèm.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [ticket.id, token]);

  const canUpload =
    !["CLOSED", "CANCELLED"].includes(ticket.status) &&
    (currentUser.role === "ADMIN" ||
      (currentUser.role === "USER" && ticket.creator.id === currentUser.id) ||
      (currentUser.role === "AGENT" && ticket.assignee?.id === currentUser.id));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;
    if (selectedFile.size > MAX_SIZE) {
      setError("File không được lớn hơn 10 MB.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const created = await uploadAttachment(ticket.id, selectedFile, token);
      setAttachments((current) => [...current, created]);
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error ? requestError.message : "Không thể tải file lên.",
      );
    } finally {
      setPending(false);
    }
  }

  async function download(attachment: AttachmentRecord) {
    setError("");
    try {
      const blob = await downloadAttachment(attachment.id, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.originalName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải file.");
    }
  }

  async function remove(attachment: AttachmentRecord) {
    if (!window.confirm(`Xóa file “${attachment.originalName}”?`)) return;
    setError("");
    try {
      await deleteAttachment(attachment.id, token);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Không thể xóa file.");
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Paperclip className="size-5 text-primary" />
        <h2 className="font-bold">File đính kèm</h2>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Đang tải file...</p>
      ) : attachments.length ? (
        <ul className="mt-4 space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center">
              <File className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{attachment.originalName}</p>
                <p className="text-xs text-slate-500">{formatSize(attachment.size)} · {attachment.uploader.fullName}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void download(attachment)}>
                  <Download /> Tải xuống
                </Button>
                {(currentUser.role === "ADMIN" || attachment.uploader.id === currentUser.id) ? (
                  <Button size="icon-sm" variant="ghost" aria-label={`Xóa ${attachment.originalName}`} onClick={() => void remove(attachment)}>
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Chưa có file đính kèm.</p>
      )}
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      {canUpload ? (
        <form className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end" onSubmit={submit}>
          <div className="flex-1">
            <label htmlFor="ticket-attachment" className="text-sm font-semibold">Chọn file</label>
            <Input
              id="ticket-attachment"
              className="mt-2"
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.docx,.xlsx,.zip"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-slate-500">Ảnh, PDF, TXT, DOCX, XLSX hoặc ZIP; tối đa 10 MB.</p>
          </div>
          <Button disabled={!selectedFile || pending}>{pending ? "Đang tải lên..." : "Đính kèm"}</Button>
        </form>
      ) : null}
    </section>
  );
}
