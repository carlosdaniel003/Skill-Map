// src/services/auth/authRepository.ts
import { supabase } from "@/services/database/supabaseClient";
import { User, AuthUser } from "@/core/auth/authTypes";

/**
 * Busca todos os usuários (Oculta a senha por segurança)
 */
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role, allowed_pages")
    .order("username");
  
  if (error) {
    console.error("Erro ao buscar usuários no Supabase:", error);
    return [];
  }
  
  // Mapeia o array do banco (allowed_pages) para a propriedade do frontend (allowedPages)
  return data.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    allowedPages: u.allowed_pages || []
  }));
}

/**
 * Busca um usuário específico pelo username (Traz a senha para validação no Login)
 */
export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    password: data.password, // Usado apenas no momento do login
    role: data.role,
    allowedPages: data.allowed_pages || []
  };
}

/**
 * Cria um novo usuário
 */
export async function createUser(user: Partial<AuthUser>): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .insert([{
      username: user.username,
      password: user.password,
      role: user.role || 'user',
      allowed_pages: user.allowedPages || []
    }]);
  
  if (error) {
    console.error("Erro ao criar usuário:", error);
    return false;
  }
  return true;
}

/**
 * Atualiza a senha de um usuário
 */
export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ password: newPassword })
    .eq("id", id);
    
  if (error) console.error("Erro ao atualizar senha:", error);
  return !error;
}

/**
 * Atualiza as páginas permitidas (permissões) de um usuário
 */
export async function updateUserPermissions(id: string, pages: string[]): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ allowed_pages: pages })
    .eq("id", id);
    
  if (error) console.error("Erro ao atualizar permissões:", error);
  return !error;
}

/**
 * Deleta um usuário do banco
 */
export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);
    
  if (error) console.error("Erro ao remover usuário:", error);
  return !error;
}

// Adicione esta função no final do seu src/services/auth/authRepository.ts

/**
 * Atualiza o cargo (role) de um usuário (Apenas Master deve usar isso)
 */
export async function updateUserRole(id: string, newRole: string): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", id);
    
  if (error) console.error("Erro ao atualizar cargo do usuário:", error);
  return !error;
}