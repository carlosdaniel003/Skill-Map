// src/services/auth/sessionService.ts
import { User } from "@/core/auth/authTypes";

const SESSION_KEY = "skillmap_session";

// REGRA 4: Tempo de expiração de 30 minutos
export const SESSION_DURATION_MS = 30 * 60 * 1000; 

export interface SessionData {
  user: User;
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

// NOVA FUNÇÃO: Renova a sessão do usuário por mais 30 minutos sem deslogar
export function renewSession(): void {
  const data = getSessionData();
  if (data) {
    saveSession(data.user); // saveSession já recalcula o tempo no futuro
  }
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