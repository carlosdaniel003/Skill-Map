// src/services/auth/sessionService.ts
import { User } from "@/core/auth/authTypes";

const SESSION_KEY = "skillmap_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas de sessão

export interface SessionData {
  user: User; // Agora o User nunca carrega a senha
  expiresAt: number;
}

export function saveSession(user: User): void {
  const session: SessionData = {
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSessionData(): SessionData | null {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;

  try {
    const session: SessionData = JSON.parse(data);
    
    // Verifica se a sessão já expirou
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    
    return session;
  } catch (e) {
    clearSession();
    return null;
  }
}

export function getSession(): User | null {
  const data = getSessionData();
  return data ? data.user : null;
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function logout(): void {
  clearSession();
  window.location.href = "/login";
}