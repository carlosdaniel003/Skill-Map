// src/services/database/attendanceRepository.ts
import { supabase } from "./supabaseClient"

export interface AttendanceRecord {
  operator_id: string
  data_registro: string
  status: string
}

export async function getProductionLinesWithOperators() {
  const { data: lines, error: linesError } = await supabase
    .from("production_lines")
    .select("nome")
    .eq("ativo", true)
    .order("nome")

  const { data: operators, error: opsError } = await supabase
    .from("operators")
    .select("linha_atual")
    .eq("ativo", true)

  if (linesError || opsError) {
    console.error("Erro ao buscar linhas ou operadores:", linesError || opsError)
    return []
  }

  const linhasComOperador = new Set(
    operators.map(op => op.linha_atual).filter(Boolean)
  )

  return lines
    .map(l => l.nome)
    .filter(nome => linhasComOperador.has(nome))
}

export async function getOperatorsByLine(linha: string) {
  const { data, error } = await supabase
    .from("operators")
    // 🆕 AQUI ESTÁ A CORREÇÃO: O turno foi adicionado na listagem de colunas que vêm do banco
    .select("id, matricula, nome, posto_atual, linha_atual, turno") 
    .eq("linha_atual", linha)
    .eq("ativo", true)
    .order("nome")

  if (error) {
    console.error("Erro ao buscar operadores:", error)
    return []
  }
  return data || []
}

export async function getAttendanceData(operatorIds: string[], firstDay: string, lastDay: string) {
  if (operatorIds.length === 0) return {}

  const { data, error } = await supabase
    .from("operator_attendance")
    .select("operator_id, data_registro, status")
    .in("operator_id", operatorIds)
    .gte("data_registro", firstDay)
    .lte("data_registro", lastDay)

  if (error) {
    console.error("Erro ao buscar frequências:", error)
    return {}
  }

  const map: Record<string, string> = {}
  if (data) {
    data.forEach(row => {
      map[`${row.operator_id}_${row.data_registro}`] = row.status
    })
  }
  return map
}

export async function saveAttendance(operatorId: string, dateStr: string, status: string) {
  const upperStatus = status.trim().toUpperCase()

  if (!upperStatus) {
    const { error } = await supabase
      .from("operator_attendance")
      .delete()
      .match({ operator_id: operatorId, data_registro: dateStr })
    
    if (error) console.error("Erro ao deletar frequência:", error)
    return
  }

  // Abordagem à prova de falhas: Verifica se já existe antes de salvar
  const { data: existing } = await supabase
    .from("operator_attendance")
    .select("id")
    .eq("operator_id", operatorId)
    .eq("data_registro", dateStr)
    .maybeSingle()

  if (existing) {
    // Se achou, apenas atualiza
    const { error: updateError } = await supabase
      .from("operator_attendance")
      .update({ status: upperStatus })
      .eq("id", existing.id)
      
    if (updateError) console.error("Erro no update:", updateError)
  } else {
    // Se não achou, insere um novo
    const { error: insertError } = await supabase
      .from("operator_attendance")
      .insert({
        operator_id: operatorId,
        data_registro: dateStr,
        status: upperStatus
      })
      
    if (insertError) console.error("Erro no insert:", insertError)
  }
}