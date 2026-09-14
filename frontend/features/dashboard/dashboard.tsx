"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { Role } from "@/features/auth/types";
import { getDashboardStats, type DashboardStats } from "./api/dashboard-api";

const dashboardTitles: Record<Role, string> = {
  customer: "Tổng quan của tôi",
  staff: "Tổng quan hỗ trợ",
  admin: "Tổng quan hệ thống",
};

export function Dashboard({
  role,
  token,
  onOpenTickets,
}: {
  role: Role;
  token: string;
  onOpenTickets: () => void;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getDashboardStats(role, token, controller.signal)
      .then((result) => {
        setStats(result);
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
            : "Không thể tải thống kê.",
        );
      });
    return () => controller.abort();
  }, [revision, role, token]);

  const cards = stats
    ? [
        { label: "Tổng ticket", value: stats.totalTickets, icon: FolderKanban },
        { label: "Đang xử lý", value: stats.activeTickets, icon: Activity },
        { label: "Đã giải quyết", value: stats.resolvedTickets, icon: CheckCircle2 },
        { label: "Quá hạn", value: stats.overdueTickets, icon: Clock3 },
      ]
    : [];

  return (
    <>
      <PageHeader
        eyebrow="HelpDesk workspace"
        title={dashboardTitles[role]}
        description="Theo dõi tình hình hỗ trợ mới nhất."
        actions={
          <Button onClick={onOpenTickets} className="w-full sm:w-auto">
            <FolderKanban /> Xem ticket
          </Button>
        }
      />
      {error ? (
        <div role="alert" className="mt-7 rounded-xl bg-destructive/10 p-5 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-3" onClick={() => setRevision((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      ) : !stats ? (
        <div className="mt-7 rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Đang tải thống kê...
        </div>
      ) : (
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-xl border bg-card p-5 shadow-xs">
            <Icon className="size-5 text-primary" />
            <p className="mt-5 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </article>
          ))}
        </section>
      )}
    </>
  );
}
