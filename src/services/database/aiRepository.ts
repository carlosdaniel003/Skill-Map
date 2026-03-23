// src/services/database/aiRepository.ts
import { supabase } from "./supabaseClient"

// 1. Busca a situação da linha (Buracos e Sobras)
export async function getLineCoverage(linha: string) {
  const { data, error } = await supabase
    .from('vw_line_coverage')
    .select('*')
    .eq('linha', linha)
  
  if (error) throw new Error(`Erro ao buscar cobertura: ${error.message}`)
  return data
}

// 2. Busca o Risco de Assiduidade dos operadores (Geral ou por linha)
export async function getOperatorRisk(linha?: string) {
  let query = supabase.from('vw_operator_analytics').select('*')
  
  if (linha) {
    query = query.eq('linha_atual', linha)
  }
  
  // Traz os 20 em maior risco para a IA avaliar
  query = query.order('score_assiduidade', { ascending: true }).limit(20)
  
  const { data, error } = await query
  if (error) throw new Error(`Erro ao buscar risco de operadores: ${error.message}`)
  return data
}

// 3. Descobre o que precisa de treinamento URGENTE na fábrica inteira
export async function getCriticalTrainingNeeds() {
  const { data, error } = await supabase
    .from('vw_line_coverage')
    .select('*')
    .gt('gap', 0) // Só traz o que está com buraco de pessoas
    .in('criticidade', ['Alta', 'Média'])
  
  if (error) throw new Error(`Erro ao buscar treinamentos: ${error.message}`)
  return data
}

// 4. Busca o contexto de habilidades e "ferrugem" dos operadores na fábrica inteira ou linha
export async function getOperatorContext360(linha?: string) {
  let query = supabase.from('vw_operator_360_context').select('*')
  
  if (linha) {
    query = query.eq('linha_atual', linha)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Erro ao buscar contexto 360: ${error.message}`)
  return data
}