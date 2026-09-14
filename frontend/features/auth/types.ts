export type ApiRole = "USER" | "AGENT" | "ADMIN";
export type Role = "customer" | "staff" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: ApiRole;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export const roleFromApi: Record<ApiRole, Role> = {
  USER: "customer",
  AGENT: "staff",
  ADMIN: "admin",
};
