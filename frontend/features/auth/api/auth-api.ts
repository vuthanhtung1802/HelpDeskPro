import { apiRequest } from "@/lib/api/client";
import { bearerHeaders } from "../auth-session";
import type { AuthResult, AuthUser } from "../types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
}

export function login(payload: LoginRequest): Promise<AuthResult> {
  return apiRequest<AuthResult>("/auth/login", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterRequest): Promise<AuthResult> {
  return apiRequest<AuthResult>("/auth/register", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export function logout(): Promise<null> {
  return apiRequest<null>("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function getMe(token: string, signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", {
    headers: bearerHeaders(token),
    signal,
  });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(
  token: string,
  newPassword: string,
): Promise<null> {
  return apiRequest<null>("/auth/reset-password", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ token, newPassword }),
  });
}
