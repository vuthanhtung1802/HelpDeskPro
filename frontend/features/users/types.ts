import type { ApiRole } from "@/features/auth/types";

export type UserStatus = "ACTIVE" | "BLOCKED";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: ApiRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
