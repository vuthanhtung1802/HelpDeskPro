const ACCESS_TOKEN_KEY = "helpdesk_access_token";
export const ACCESS_TOKEN_CHANGED_EVENT = "helpdesk:access-token-changed";
let volatileAccessToken: string | null = null;

function announceTokenChange(): void {
  window.dispatchEvent(new Event(ACCESS_TOKEN_CHANGED_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? volatileAccessToken;
  } catch {
    return volatileAccessToken;
  }
}

export function setAccessToken(token: string): void {
  volatileAccessToken = token;
  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Keep the token in memory when browser storage is unavailable.
  }
  announceTokenChange();
}

export function clearAccessToken(): void {
  volatileAccessToken = null;
  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // The in-memory token has already been cleared.
  }
  announceTokenChange();
}

export function bearerHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}
