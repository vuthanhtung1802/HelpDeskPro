const ACCESS_TOKEN_KEY = "helpdesk_access_token";
export const ACCESS_TOKEN_CHANGED_EVENT = "helpdesk:access-token-changed";

function announceTokenChange(): void {
  window.dispatchEvent(new Event(ACCESS_TOKEN_CHANGED_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  announceTokenChange();
}

export function clearAccessToken(): void {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  announceTokenChange();
}

export function bearerHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}
