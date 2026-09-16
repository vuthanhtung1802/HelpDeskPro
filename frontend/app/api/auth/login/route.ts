import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

interface LoginResponse {
  data?: {
    user?: {
      role?: "USER" | "AGENT" | "ADMIN";
    };
  };
}

const dashboardPaths = {
  USER: "/dashboard",
  AGENT: "/staff/dashboard",
  ADMIN: "/admin/dashboard",
} as const;

export async function POST(request: NextRequest) {
  const requestOrigin =
    request.headers.get("origin") ??
    `${request.headers.get("x-forwarded-proto") ?? "http"}://${
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "localhost:3001"
    }`;
  const form = await request.formData();
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    }),
  });

  const body = (await response.json()) as LoginResponse;
  const role = body.data?.user?.role;
  if (!response.ok || !role) {
    return NextResponse.redirect(new URL("/login?error=invalid", requestOrigin), {
      status: 303,
    });
  }

  const result = NextResponse.redirect(
    new URL(dashboardPaths[role], requestOrigin),
    { status: 303 },
  );
  const refreshCookie = response.headers.get("set-cookie");
  if (refreshCookie) {
    result.headers.append(
      "set-cookie",
      refreshCookie.replace(/Path=\/api\/v1\/auth/i, "Path=/"),
    );
  }
  return result;
}
