"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { ApiRole } from "@/features/auth/types";
import type { PaginationMeta } from "@/lib/api/client";
import { listUsers, updateUserRole, updateUserStatus } from "../api/users-api";
import type { UserRecord, UserStatus } from "../types";

const roleLabels: Record<ApiRole, string> = {
  USER: "Khách hàng",
  AGENT: "Nhân viên hỗ trợ",
  ADMIN: "Quản trị viên",
};

export function UsersPage({
  token,
  currentUserId,
}: {
  token: string;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listUsers(
      {
        page,
        limit: 10,
        search: search || undefined,
        role: role === "all" ? undefined : (role as ApiRole),
        status: status === "all" ? undefined : (status as UserStatus),
      },
      token,
      controller.signal,
    )
      .then((result) => {
        setUsers(result.data);
        setMeta(result.meta);
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
            : "Không thể tải người dùng.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page, revision, role, search, status, token]);

  function applyFilter(setter: (value: string) => void, value: string) {
    setLoading(true);
    setPage(1);
    setter(value);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilter(setSearch, searchInput.trim());
  }

  async function changeRole(user: UserRecord, nextRole: ApiRole) {
    if (nextRole === user.role) return;
    setPendingUserId(user.id);
    setActionError("");
    try {
      const updated = await updateUserRole(user.id, nextRole, token);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể đổi vai trò người dùng.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function toggleStatus(user: UserRecord) {
    if (
      user.status === "ACTIVE" &&
      !window.confirm(
        `Khóa tài khoản ${user.fullName}? Các phiên đăng nhập hiện tại sẽ bị thu hồi.`,
      )
    )
      return;
    setPendingUserId(user.id);
    setActionError("");
    try {
      const updated = await updateUserStatus(
        user.id,
        user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
        token,
      );
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật trạng thái người dùng.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Người dùng"
        description="Quản lý tài khoản và quyền truy cập."
      />
      <form
        className="mt-6 flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row"
        onSubmit={submitSearch}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Tìm người dùng"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
            placeholder="Tìm theo tên hoặc email..."
          />
        </div>
        <Select value={role} onValueChange={(value) => applyFilter(setRole, value)}>
          <SelectTrigger aria-label="Lọc theo vai trò" className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi vai trò</SelectItem>
            {Object.entries(roleLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => applyFilter(setStatus, value)}>
          <SelectTrigger aria-label="Lọc theo trạng thái" className="w-full md:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
            <SelectItem value="BLOCKED">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">Tìm kiếm</Button>
      </form>

      {actionError ? (
        <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Đang tải danh sách người dùng...
        </div>
      ) : error ? (
        <div role="alert" className="mt-4 rounded-xl bg-destructive/10 p-5 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-3" onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>
            Thử lại
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="mt-4 rounded-xl border bg-card p-10 text-center">
          <UsersRound className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">Không tìm thấy người dùng</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hãy thay đổi từ khóa hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={pendingUserId === user.id || user.id === currentUserId}
                      onValueChange={(value) => void changeRole(user, value as ApiRole)}
                    >
                      <SelectTrigger aria-label={`Vai trò của ${user.fullName}`} className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={user.status === "ACTIVE" ? "border-transparent bg-success/10 text-success" : "border-transparent bg-destructive/10 text-destructive"}>
                      {user.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("vi-VN").format(new Date(user.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={user.status === "ACTIVE" ? "destructive" : "outline"}
                      disabled={pendingUserId === user.id || user.id === currentUserId}
                      onClick={() => void toggleStatus(user)}
                    >
                      {pendingUserId === user.id
                        ? "Đang cập nhật..."
                        : user.status === "ACTIVE"
                          ? "Khóa"
                          : "Mở khóa"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Trang {meta.page}/{Math.max(meta.totalPages, 1)} · {meta.total} người dùng</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Trước</Button>
          <Button variant="outline" disabled={loading || page >= meta.totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Sau</Button>
        </div>
      </div>
    </>
  );
}
