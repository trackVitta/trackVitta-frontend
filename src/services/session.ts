import type { LoginResponse } from "../types/auth";

const SESSION_KEY = "tracknest.session";

export function getSession(): LoginResponse | null {
  const value = localStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as LoginResponse;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSession(session: LoginResponse) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
