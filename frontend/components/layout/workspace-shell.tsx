"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/features/auth/types";
import { NotificationMenu } from "@/features/notifications/components/notification-menu";

const roleLabels: Record<Role, string> = {
  customer: "Khách hàng",
  staff: "Nhân viên hỗ trợ",
  admin: "Quản trị viên",
};

const navigation: Record<
  Role,
  { href: string; label: string; icon: typeof LayoutDashboard }[]
> = {
  customer: [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/tickets", label: "Ticket của tôi", icon: FolderKanban },
    { href: "/chatbot", label: "Trợ lý hỏi đáp", icon: Bot },
  ],
  staff: [
    { href: "/staff/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/staff/tickets", label: "Hàng đợi xử lý", icon: FolderKanban },
    { href: "/staff/chatbot", label: "Trợ lý hỏi đáp", icon: Bot },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/admin/tickets", label: "Quản lý ticket", icon: FolderKanban },
    { href: "/admin/users", label: "Người dùng", icon: UsersRound },
    { href: "/admin/categories", label: "Danh mục", icon: SlidersHorizontal },
  ],
};

export function WorkspaceShell({
  role,
  token,
  onLogout,
  children,
}: {
  role: Role;
  token: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Chuyển đến nội dung chính
      </a>
      {mobileOpen && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar p-5 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-primary">
            <LifeBuoy /> HelpDesk Pro
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Đóng menu điều hướng"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </Button>
        </div>
        <nav aria-label="Điều hướng chính" className="mt-9 space-y-1">
          {navigation[role].map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Mở menu điều hướng"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationMenu token={token} role={role} />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {roleLabels[role]}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đăng xuất"
              title="Đăng xuất"
              onClick={onLogout}
            >
              <LogOut />
            </Button>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
