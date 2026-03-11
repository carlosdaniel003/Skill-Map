// src/core/auth/authTypes.ts

/**
 * Representa o usuário logado e os dados que trafegam na interface (UI).
 * Nota: A senha FOI REMOVIDA por questões de segurança.
 */
export interface User {
  id: string;
  username: string;
  role: 'master' | 'admin' | 'user' | string;
  allowedPages: string[];
}

/**
 * Tipo estendido usado APENAS internamente nos repositórios 
 * na hora de criar um usuário ou fazer login.
 */
export interface AuthUser extends User {
  password?: string;
}

/**
 * Representa a estrutura de um Log de Auditoria no banco.
 */
export interface AuditLog {
  id?: string;
  username: string;
  action: string;
  details: string;
  created_at?: string;
}