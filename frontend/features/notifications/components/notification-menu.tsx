"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Role } from "@/features/auth/types";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications-api";
import { connectNotifications } from "../api/notifications-socket";
import {
  ACCESS_TOKEN_CHANGED_EVENT,
  getAccessToken,
} from "@/lib/auth/access-token";
import type { NotificationRecord } from "../types";

const ticketBasePath: Record<Role, string> = {
  customer: "/tickets",
  staff: "/staff/tickets",
  admin: "/admin/tickets",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationMenu({ token, role }: { token: string; role: Role }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadNotifications = () =>
      listNotifications(token, controller.signal)
      .then((items) => {
        setNotifications(items);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError("Không thể tải thông báo.");
      });
    void loadNotifications();

    const socket = connectNotifications(token);
    let socketToken = token;
    socket.on("notifications:changed", () => void loadNotifications());
    const updateSocketToken = () => {
      const currentToken = getAccessToken();
      if (!currentToken) {
        socket.disconnect();
        return;
      }
      if (currentToken === socketToken) return;
      socketToken = currentToken;
      socket.auth = { token: currentToken };
      socket.disconnect().connect();
    };
    window.addEventListener(ACCESS_TOKEN_CHANGED_EVENT, updateSocketToken);

    return () => {
      controller.abort();
      window.removeEventListener(ACCESS_TOKEN_CHANGED_EVENT, updateSocketToken);
      socket.disconnect();
    };
  }, [token]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function readNotification(notification: NotificationRecord) {
    if (notification.isRead) return;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    void markNotificationRead(notification.id, token).catch(() => {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: false } : item,
        ),
      );
    });
  }

  function readAll() {
    const previous = notifications;
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );
    void markAllNotificationsRead(token).catch(() => setNotifications(previous));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}>
          <Bell />
          {unreadCount ? (
            <span className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {Math.min(unreadCount, 99)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">Thông báo</h2>
          {unreadCount ? (
            <Button variant="ghost" size="sm" onClick={readAll}>Đánh dấu đã đọc</Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {error ? (
            <p role="alert" className="p-4 text-sm text-destructive">{error}</p>
          ) : notifications.length ? (
            notifications.map((notification) => {
              const content = (
                <div className={`border-b p-4 text-left hover:bg-muted/60 ${notification.isRead ? "" : "bg-primary/5"}`}>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                  <time className="mt-2 block text-xs text-muted-foreground" dateTime={notification.createdAt}>
                    {formatDate(notification.createdAt)}
                  </time>
                </div>
              );
              return notification.ticket ? (
                <Link
                  key={notification.id}
                  href={`${ticketBasePath[role]}/${notification.ticket.id}`}
                  onClick={() => readNotification(notification)}
                >
                  {content}
                </Link>
              ) : (
                <button key={notification.id} className="block w-full" onClick={() => readNotification(notification)}>
                  {content}
                </button>
              );
            })
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
