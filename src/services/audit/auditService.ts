// src/services/audit/auditService.ts
import { supabase } from "@/services/database/supabaseClient";
import { AuditLog } from "@/core/auth/authTypes";

/**
 * Registra uma nova ação no banco de dados (Supabase)
 */
export async function logAction(username: string, action: string, details?: string): Promise<void> {
  const { error } = await supabase
    .from("audit_logs")
    .insert([{
      username,
      action,
      details: details || ""
    }]);

  if (error) {
    console.error("Erro ao registrar auditoria no Supabase:", error);
  }
}

/**
 * Busca os logs mais recentes
 */
export async function getLogs(limit: number = 50): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar logs de auditoria:", error);
    return [];
  }

  return data || [];
}

/**
 * Limpa todos os logs (Apenas para fins de manutenção)
 */
export async function clearLogs(): Promise<void> {
  // O Supabase exige um filtro para deletar, então dizemos "delete onde ID não é nulo"
  const { error } = await supabase
    .from("audit_logs")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Erro ao limpar logs de auditoria:", error);
  }
}