"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/features/auth/types";
import type { PaginationMeta } from "@/lib/api/client";
import { createTicket, listCategories, listTickets } from "./api/tickets-api";
import { PriorityBadge, StatusBadge } from "./components/ticket-badges";
import { TICKET_PRIORITY_META, TICKET_STATUS_META } from "./ticket-meta";
import type {
  Category,
  TicketPriority,
  TicketRecord,
  TicketStatus,
} from "./types";

const statuses: TicketStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "REOPENED",
  "CLOSED",
  "CANCELLED",
];
const priorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function NewTicketDialog({
  token,
  onCreated,
}: {
  token: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || categories.length) return;
    const controller = new AbortController();
    listCategories(token, controller.signal)
      .then((items) => {
        setCategories(items);
        setCategoryId(items[0]?.id ?? "");
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Không thể tải danh mục.",
        ),
      );
    return () => controller.abort();
  }, [categories.length, open, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      await createTicket(
        {
          title: String(data.get("title") ?? ""),
          description: String(data.get("description") ?? ""),
          categoryId,
          priority,
        },
        token,
      );
      form.reset();
      setOpen(false);
      onCreated();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tạo ticket.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Tạo ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu hỗ trợ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <div>
              <Label htmlFor="ticket-title">Tiêu đề</Label>
              <Input
                id="ticket-title"
                name="title"
                required
                minLength={5}
                maxLength={200}
                className="mt-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Danh mục</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ưu tiên</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as TicketPriority)
                  }
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="ticket-description">Mô tả</Label>
              <Textarea
                id="ticket-description"
                name="description"
                required
                minLength={10}
                maxLength={5000}
                className="mt-2 min-h-28"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button disabled={pending || !categoryId}>
              {pending ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TicketsPage({ role, token }: { role: Role; token: string }) {
  const ticketBasePath =
    role === "admin"
      ? "/admin/tickets"
      : role === "staff"
        ? "/staff/tickets"
        : "/tickets";
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  function reload() {
    setLoading(true);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    const [sortBy, order] = sort.split(":") as [
      "createdAt" | "updatedAt" | "dueAt",
      "asc" | "desc",
    ];
    listTickets(
      {
        page,
        limit: 10,
        search: search || undefined,
        status: status === "all" ? undefined : (status as TicketStatus),
        priority: priority === "all" ? undefined : (priority as TicketPriority),
        sortBy,
        order,
      },
      token,
      controller.signal,
    )
      .then((result) => {
        setTickets(result.data);
        setMeta(result.meta);
        setError("");
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setError(
          reason instanceof Error ? reason.message : "Không thể tải ticket.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page, priority, revision, search, sort, status, token]);

  function changeFilter(setter: (value: string) => void, value: string) {
    setLoading(true);
    setPage(1);
    setter(value);
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Tickets"
        title={
          role === "customer"
            ? "Ticket của tôi"
            : role === "staff"
              ? "Hàng đợi xử lý"
              : "Quản lý ticket"
        }
        description="Tìm kiếm, theo dõi và xử lý các yêu cầu hỗ trợ."
        actions={
          role === "customer" ? (
            <NewTicketDialog token={token} onCreated={reload} />
          ) : undefined
        }
      />
      <form
        className="mt-7 flex flex-col gap-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          changeFilter(setSearch, searchInput.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
            placeholder="Tìm mã hoặc tiêu đề..."
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => changeFilter(setStatus, value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi trạng thái</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {TICKET_STATUS_META[item].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(value) => changeFilter(setPriority, value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi ưu tiên</SelectItem>
            {priorities.map((item) => (
              <SelectItem key={item} value={item}>
                {TICKET_PRIORITY_META[item].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => changeFilter(setSort, value)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Sắp xếp ticket">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Mới tạo trước</SelectItem>
            <SelectItem value="createdAt:asc">Cũ nhất trước</SelectItem>
            <SelectItem value="updatedAt:desc">Mới cập nhật</SelectItem>
            <SelectItem value="dueAt:asc">Sắp đến hạn</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Tìm kiếm
        </Button>
      </form>
      {loading ? (
        <div className="mt-4 rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Đang tải ticket...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-rose-50 p-5 text-rose-700"
        >
          {error}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>Người xử lý</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-muted/35">
                  <TableCell>
                    <Link
                      href={`${ticketBasePath}/${ticket.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {ticket.title}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {ticket.code} · {ticket.category.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    {ticket.assignee?.fullName ?? "Chưa phân công"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Trang {meta.page}/{Math.max(meta.totalPages, 1)} · {meta.total} ticket
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => {
              setLoading(true);
              setPage((value) => value - 1);
            }}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={loading || page >= meta.totalPages}
            onClick={() => {
              setLoading(true);
              setPage((value) => value + 1);
            }}
          >
            Sau
          </Button>
        </div>
      </div>
    </>
  );
}
