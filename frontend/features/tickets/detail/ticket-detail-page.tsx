"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CircleUserRound,
  FolderKanban,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuthUser } from "@/features/auth/types";
import { TicketComments } from "@/features/comments/components/ticket-comments";
import { TicketAttachments } from "@/features/attachments/components/ticket-attachments";
import { TicketRating } from "@/features/ratings/components/ticket-rating";
import type {
  Agent,
  TicketHistoryRecord,
  TicketRecord,
  TicketStatus,
} from "@/features/tickets/types";
import {
  assignTicket,
  changeTicketStatus,
  getTicket,
  getTicketHistory,
  listAgents,
  takeTicket,
} from "@/features/tickets/api/tickets-api";
import {
  PriorityBadge,
  StatusBadge,
} from "@/features/tickets/components/ticket-badges";
import {
  TICKET_HISTORY_LABEL,
  TICKET_STATUS_ACTION_LABEL,
} from "@/features/tickets/ticket-meta";

function formatDate(value: string | null): string {
  if (!value) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TicketDetailPage({
  token,
  currentUser,
}: {
  token: string;
  currentUser: AuthUser;
}) {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketRecord | null>(null);
  const [history, setHistory] = useState<TicketHistoryRecord[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getTicket(params.id, token, controller.signal),
      getTicketHistory(params.id, token, controller.signal),
    ])
      .then(([ticketResult, historyResult]) => {
        setTicket(ticketResult);
        setHistory(historyResult);
        setSelectedAgentId(ticketResult.assignee?.id ?? "");
        if (currentUser.role === "ADMIN") {
          return listAgents(token, controller.signal).then(setAgents);
        }
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
            : "Không thể kết nối đến máy chủ.",
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [currentUser.role, params.id, token]);

  async function runAction(
    name: string,
    action: () => Promise<TicketRecord>,
  ) {
    setPendingAction(name);
    setActionError("");
    try {
      const updatedTicket = await action();
      setTicket(updatedTicket);
      setSelectedAgentId(updatedTicket.assignee?.id ?? "");
      setHistory(await getTicketHistory(params.id, token));
    } catch (actionError) {
      setActionError(
        actionError instanceof Error
          ? actionError.message
          : "Không thể cập nhật ticket.",
      );
    } finally {
      setPendingAction("");
    }
  }

  function availableStatuses(): TicketStatus[] {
    if (!ticket || !currentUser) return [];
    if (currentUser.role === "USER" && ticket.creator.id === currentUser.id) {
      if (ticket.status === "OPEN") return ["CANCELLED"];
      if (ticket.status === "RESOLVED") return ["CLOSED", "REOPENED"];
    }
    if (
      currentUser.role === "ADMIN" &&
      ["OPEN", "RESOLVED"].includes(ticket.status)
    ) {
      return ticket.status === "OPEN" ? ["CANCELLED"] : ["CLOSED"];
    }
    if (currentUser.role === "AGENT" && ticket.assignee?.id === currentUser.id) {
      const transitions: Partial<Record<TicketStatus, TicketStatus[]>> = {
        ASSIGNED: ["IN_PROGRESS"],
        IN_PROGRESS: ["WAITING_FOR_USER", "RESOLVED"],
        WAITING_FOR_USER: ["IN_PROGRESS"],
        REOPENED: ["IN_PROGRESS"],
      };
      return transitions[ticket.status] ?? [];
    }
    return [];
  }

  return (
    <div className="mx-auto max-w-[960px]">
        <Link
          href={
            currentUser.role === "ADMIN"
              ? "/admin/tickets"
              : currentUser.role === "AGENT"
                ? "/staff/tickets"
                : "/tickets"
          }
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Đang tải chi tiết ticket...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700"
          >
            <p>{error}</p>
            <Button asChild variant="outline" className="mt-4 rounded-xl">
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </div>
        ) : ticket ? (
          <>
            {actionError && (
              <p
                role="alert"
                className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
              >
                {actionError}
              </p>
            )}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold text-primary">
                    {ticket.code}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                    {ticket.title}
                  </h1>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {ticket.category.name}
                    </span>
                  </div>
                  {currentUser && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      {currentUser.role === "AGENT" &&
                        ticket.status === "OPEN" &&
                        !ticket.assignee && (
                          <Button
                            disabled={Boolean(pendingAction)}
                            onClick={() =>
                              void runAction("take", () =>
                                takeTicket(ticket.id, token),
                              )
                            }
                          >
                            {pendingAction === "take"
                              ? "Đang nhận..."
                              : "Nhận ticket"}
                          </Button>
                        )}
                      {availableStatuses().map((status) => (
                        <Button
                          key={status}
                          variant={status === "CANCELLED" ? "destructive" : "outline"}
                          disabled={Boolean(pendingAction)}
                          onClick={() =>
                            void runAction(status, () =>
                              changeTicketStatus(ticket.id, status, token),
                            )
                          }
                        >
                          {pendingAction === status
                            ? "Đang cập nhật..."
                            : TICKET_STATUS_ACTION_LABEL[status]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500">
                  <p>Cập nhật lần cuối</p>
                  <p className="mt-1 font-semibold text-slate-700">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-7">
                <h2 className="font-bold">Mô tả yêu cầu</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {ticket.description}
                </p>
              </div>
            </section>
            <section className="mt-5 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold">Người liên quan</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <CircleUserRound className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">
                        {ticket.creator.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ticket.creator.email} · Người tạo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserRound className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">
                        {ticket.assignee?.fullName ?? "Chưa phân công"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ticket.assignee?.email ?? "Ticket đang chờ tiếp nhận"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold">Thông tin xử lý</h2>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="size-5 text-primary" />
                    <span>
                      Danh mục: <strong>{ticket.category.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarClock className="size-5 text-primary" />
                    <span>
                      Hạn xử lý: <strong>{formatDate(ticket.dueAt)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarClock className="size-5 text-primary" />
                    <span>
                      Ngày tạo: <strong>{formatDate(ticket.createdAt)}</strong>
                    </span>
                  </div>
                </div>
              </article>
            </section>
            {currentUser?.role === "ADMIN" && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold">Phân công xử lý</h2>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Select
                    value={selectedAgentId}
                    onValueChange={setSelectedAgentId}
                  >
                    <SelectTrigger className="w-full sm:max-w-sm">
                      <SelectValue placeholder="Chọn Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.fullName} · {agent.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={
                      !selectedAgentId ||
                      Boolean(pendingAction) ||
                      selectedAgentId === ticket.assignee?.id ||
                      ["CLOSED", "CANCELLED"].includes(ticket.status)
                    }
                    onClick={() =>
                      void runAction("assign", () =>
                        assignTicket(ticket.id, selectedAgentId, token),
                      )
                    }
                  >
                    {pendingAction === "assign" ? "Đang giao..." : "Phân công"}
                  </Button>
                </div>
              </section>
            )}
            <TicketComments
              ticket={ticket}
              token={token}
              currentUser={currentUser}
            />
            <TicketAttachments
              ticket={ticket}
              token={token}
              currentUser={currentUser}
            />
            <TicketRating
              ticket={ticket}
              token={token}
              currentUser={currentUser}
            />
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Lịch sử ticket</h2>
              {history.length ? (
                <ol className="mt-4 space-y-4 border-l border-slate-200 pl-5">
                  {history.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <p className="font-semibold">
                        {TICKET_HISTORY_LABEL[entry.action] ?? "Đã cập nhật ticket"}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {entry.actor.fullName} · {formatDate(entry.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có lịch sử.</p>
              )}
            </section>
          </>
        ) : null}
    </div>
  );
}
