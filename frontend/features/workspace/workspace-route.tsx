"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getMe, logout } from "@/features/auth/api/auth-api";
import { clearAccessToken, getAccessToken } from "@/features/auth/auth-session";
import {
  roleFromApi,
  type ApiRole,
  type AuthUser,
} from "@/features/auth/types";
import { CategoriesPage } from "@/features/categories/components/categories-page";
import { Dashboard } from "@/features/dashboard/dashboard";
import { TicketDetailPage } from "@/features/tickets/detail/ticket-detail-page";
import { TicketsPage } from "@/features/tickets/tickets-page";
import { UsersPage } from "@/features/users/components/users-page";

type WorkspaceView =
  | "dashboard"
  | "tickets"
  | "ticket-detail"
  | "users"
  | "categories";

const dashboardPaths: Record<ApiRole, string> = {
  USER: "/dashboard",
  AGENT: "/staff/dashboard",
  ADMIN: "/admin/dashboard",
};

const ticketPaths: Record<ApiRole, string> = {
  USER: "/tickets",
  AGENT: "/staff/tickets",
  ADMIN: "/admin/tickets",
};

export function WorkspaceRoute({
  allowedRole,
  view,
}: {
  allowedRole: ApiRole;
  view: WorkspaceView;
}) {
  const router = useRouter();
  const [session, setSession] = useState<{
    token: string;
    user: AuthUser;
  } | null>(null);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    getMe(token, controller.signal)
      .then((user) => {
        if (user.role !== allowedRole) {
          router.replace(dashboardPaths[user.role]);
          return;
        }
        setSession({ token, user });
      })
      .catch(() => {
        clearAccessToken();
        setSessionError("Phiên đăng nhập đã hết hạn.");
        router.replace("/login");
      });
    return () => controller.abort();
  }, [allowedRole, router]);

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-sm text-muted-foreground">
        {sessionError || "Đang xác thực phiên đăng nhập..."}
      </main>
    );
  }

  const role = roleFromApi[session.user.role];
  function handleLogout() {
    void logout().finally(() => {
      clearAccessToken();
      router.replace("/login");
    });
  }

  return (
    <WorkspaceShell role={role} token={session.token} onLogout={handleLogout}>
      {view === "dashboard" ? (
        <Dashboard
          role={role}
          token={session.token}
          onOpenTickets={() => router.push(ticketPaths[session.user.role])}
        />
      ) : view === "tickets" ? (
        <TicketsPage role={role} token={session.token} />
      ) : view === "ticket-detail" ? (
        <TicketDetailPage token={session.token} currentUser={session.user} />
      ) : view === "users" ? (
        <UsersPage token={session.token} currentUserId={session.user.id} />
      ) : (
        <CategoriesPage token={session.token} />
      )}
    </WorkspaceShell>
  );
}
