// src/services/auth/routeGuard.ts
import { getSession } from "./sessionService"

export function canAccess(path: string): boolean {
  const user = getSession()

  if (!user) return false

  // Administradores ou Master têm acesso liberado a tudo
  if (user.role === 'admin' || user.role === 'master') {
    return true;
  }

  // Verifica se o usuário tem a permissão específica da rota
  return user.allowedPages.includes(path)
}