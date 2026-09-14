"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword, resetPassword } from "./api/auth-api";

function RecoveryLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <Link href="/login" className="flex items-center gap-2 font-bold text-primary">
          <LifeBuoy /> HelpDesk Pro
        </Link>
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {children}
      </section>
    </main>
  );
}

export function ForgotPasswordScreen() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setPending(true);
    setError("");
    try {
      await forgotPassword(email);
      setMessage("Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể gửi yêu cầu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <RecoveryLayout title="Quên mật khẩu" description="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.">
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <Button className="w-full" disabled={pending}>{pending ? "Đang gửi..." : "Gửi hướng dẫn"}</Button>
        <Link href="/login" className="block text-center text-sm font-semibold text-primary hover:underline">Quay lại đăng nhập</Link>
      </form>
    </RecoveryLayout>
  );
}

export function ResetPasswordScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirmPassword") ?? "")) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await resetPassword(token, password);
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <RecoveryLayout title="Đặt lại mật khẩu" description="Tạo mật khẩu mới có chữ hoa, chữ thường, số và ký tự đặc biệt.">
      {!token ? (
        <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Liên kết đặt lại mật khẩu không hợp lệ.</p>
      ) : complete ? (
        <div className="mt-6 space-y-4">
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Mật khẩu đã được cập nhật.</p>
          <Button asChild className="w-full"><Link href="/login">Đăng nhập</Link></Button>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label htmlFor="password">Mật khẩu mới</Label><Input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></div>
          <div className="space-y-2"><Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label><Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <Button className="w-full" disabled={pending}>{pending ? "Đang cập nhật..." : "Đặt lại mật khẩu"}</Button>
        </form>
      )}
    </RecoveryLayout>
  );
}
