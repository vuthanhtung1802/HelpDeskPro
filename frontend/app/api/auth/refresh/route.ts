import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export async function POST(request: NextRequest) {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  const result = new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
  const refreshCookie = response.headers.get("set-cookie");
  if (refreshCookie) {
    result.headers.append(
      "set-cookie",
      refreshCookie.replace(/Path=\/api\/v1\/auth/i, "Path=/"),
    );
  }
  return result;
}
