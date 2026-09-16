"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LifeBuoy,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { login, register } from "./api/auth-api";
import { setAccessToken } from "./auth-session";
import type { ApiRole, AuthResult } from "./types";

const dashboardPaths: Record<ApiRole, string> = {
  USER: "/dashboard",
  AGENT: "/staff/dashboard",
  ADMIN: "/admin/dashboard",
};

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function authenticate(form: HTMLFormElement) {
    if (pending) return;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (
      mode === "register" &&
      password !== String(data.get("confirmPassword") ?? "")
    ) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result: AuthResult =
        mode === "login"
          ? await login({ email: String(data.get("email") ?? ""), password })
          : await register({
              email: String(data.get("email") ?? ""),
              fullName: String(data.get("fullName") ?? ""),
              password,
            });
      setAccessToken(result.accessToken);
      window.location.assign(dashboardPaths[result.user.role]);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể kết nối đến máy chủ.",
      );
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void authenticate(event.currentTarget);
  }

  return (
    <main className="grid min-h-screen bg-background p-4 lg:grid-cols-2 lg:p-8">
      <section className="auth-panel relative hidden overflow-hidden rounded-2xl bg-primary p-14 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-bold">
          <LifeBuoy /> HelpDesk Pro
        </div>
        <div>
          <p className="text-sm text-primary-foreground/80">
            HỖ TRỢ NHANH · THEO DÕI RÕ RÀNG
          </p>
          <h1 className="mt-5 text-5xl font-bold leading-tight">
            Mọi yêu cầu hỗ trợ,
            <br />
            <span className="text-primary-foreground/75">trong một nơi.</span>
          </h1>
          <p className="mt-5 max-w-lg leading-7 text-white/60">
            Tạo ticket, trao đổi và theo dõi tiến độ cùng đội ngũ hỗ trợ.
          </p>
        </div>
        <p className="text-sm text-white/40">
          HelpDesk Pro · Support workspace
        </p>
      </section>
      <section className="relative flex items-center justify-center p-5">
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 font-bold text-primary lg:hidden">
            <LifeBuoy /> HelpDesk Pro
          </div>
          <p className="text-sm font-semibold text-primary">
            {mode === "login" ? "CHÀO MỪNG TRỞ LẠI" : "TẠO TÀI KHOẢN"}
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {mode === "login" ? "Đăng nhập tài khoản" : "Bắt đầu với HelpDesk"}
          </h2>
          <form
            action="/api/auth/login"
            method="post"
            className="mt-8 space-y-5"
            onSubmit={submit}
          >
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3.5 size-4 text-slate-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    minLength={2}
                    maxLength={100}
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={mode === "login" ? "admin@example.com" : ""}
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  defaultValue={mode === "login" ? "Admin@123" : ""}
                  className="h-11 px-10"
                />
                <button
                  type="button"
                  aria-label="Hiện hoặc ẩn mật khẩu"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-3.5 text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            {mode === "login" && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            )}
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                />
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="h-12 w-full"
            >
              {pending
                ? "Đang xử lý..."
                : mode === "login"
                  ? "Đăng nhập"
                  : "Tạo tài khoản"}
              <ArrowRight />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <Link
              className="font-bold text-primary hover:underline"
              href={mode === "login" ? "/register" : "/login"}
            >
              {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
