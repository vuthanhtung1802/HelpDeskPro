import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api/client";

function socketOrigin(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  return new URL(API_URL).origin;
}

export function connectNotifications(token: string): Socket {
  return io(`${socketOrigin()}/notifications`, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
}
