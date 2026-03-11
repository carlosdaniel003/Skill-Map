// src/services/auth/authService.ts
import { findUserByUsername } from "./authRepository";
import { User } from "@/core/auth/authTypes";

/**
 * Valida credenciais consultando o Supabase.
 * Retorna os dados do usuário (sem a senha) se for sucesso, ou null se falhar.
 */
export async function authenticate(username: string, password: string): Promise<User | null> {
  
  // 1. Busca o usuário e a senha criptografada/salva no banco
  const user = await findUserByUsername(username);

  // 2. Valida se o usuário existe e se a senha confere
  if (user && user.password === password) {
    
    // 3. Monta o objeto de sessão seguro (Omitindo o password)
    const safeUser: User = {
      id: user.id,
      username: user.username,
      role: user.role,
      allowedPages: user.allowedPages
    };

    return safeUser;
  }
  
  // Credenciais inválidas
  return null; 
}