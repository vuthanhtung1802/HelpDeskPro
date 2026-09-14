import type { ApiRole } from "@/features/auth/types";

export interface CommentRecord {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: ApiRole;
  };
}
