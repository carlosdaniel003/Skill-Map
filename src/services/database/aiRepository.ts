// src/services/database/aiRepository.ts
import { supabase } from "./supabaseClient"

// ============================================================
// 1. BUSCA OPERADOR POR NOME (NOVO!)
// ============================================================
export async function searchOperatorByName(nome: string) {
  // Busca o operador na tabela base
  const { data: operators, error: opError } = await supabase
    .from('operators')
    .select('*')
    .ilike('nome', `%${nome}%`)
    .eq('ativo', true)
    .limit(5)

  if (opError) throw new Error(`Erro ao buscar operador: ${opError.message}`)
  if (!operators || operators.length === 0) return { operadores: [], skills: [], attendance: [], experience: [], context360: [] }

  const operatorIds = operators.map(op => op.id)

  // Busca as skills do(s) operador(es) encontrado(s)
  const { data: skills } = await supabase
    .from('operator_skills')
    .select('*, workstations(nome)')
    .in('operator_id', operatorIds)

  // Busca frequência recente (últimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

  const { data: attendance } = await supabase
    .from('operator_attendance')
    .select('*')
    .in('operator_id', operatorIds)
    .gte('data_registro', dateStr)

  // Busca experiência/histórico
  const { data: experience } = await supabase
    .from('operator_experience')
    .select('*')
    .in('operator_id', operatorIds)
    .eq('ativo', true)

  // Busca a view 360 para dados calculados (se existir)
  const { data: context360 } = await supabase
    .from('vw_operator_360_context')
    .select('*')
    .in('operator_id', operatorIds)

  return {
    operadores: operators || [],
    skills: skills || [],
    attendance: attendance || [],
    experience: experience || [],
    context360: context360 || []
  }
}

// ============================================================
// 2. LISTA TODOS OS OPERADORES DE UMA LINHA (NOVO!)
// ============================================================
export async function getOperatorsByLine(linha: string, turno?: string) {
  let query = supabase
    .from('operators')
    .select('id, nome, matricula, posto_atual, linha_atual, turno')
    .eq('linha_atual', linha)
    .eq('ativo', true)
    .order('nome')

  if (turno) {
    query = query.eq('turno', turno)
  }

  const { data, error } = await query
  if (error) throw new Error(`Erro ao buscar operadores da linha: ${error.message}`)
  return data || []
}

// ============================================================
// 3. BUSCA GENÉRICA LIVRE EM QUALQUER TABELA (NOVO!)
// ============================================================
export async function queryDatabase(tabela: string, filtros?: Record<string, string>, limite?: number) {
  // Tabelas permitidas (whitelist de segurança)
  const tabelasPermitidas = [
    'operators', 'operator_skills', 'operator_attendance', 'operator_experience',
    'operator_history', 'production_lines', 'workstations',
    'vw_operator_analytics', 'vw_operator_360_context', 'vw_line_coverage'
  ]

  if (!tabelasPermitidas.includes(tabela)) {
    return { error: `Tabela '${tabela}' não permitida. Tabelas disponíveis: ${tabelasPermitidas.join(', ')}` }
  }

  let query = supabase.from(tabela).select('*')

  if (filtros) {
    Object.entries(filtros).forEach(([coluna, valor]) => {
      query = query.eq(coluna, valor)
    })
  }

  query = query.limit(limite || 50)

  const { data, error } = await query
  if (error) throw new Error(`Erro ao consultar ${tabela}: ${error.message}`)
  return data || []
}

// ============================================================
// 4. RESUMO GERAL DA FÁBRICA (NOVO!)
// ============================================================
export async function getFactorySummary() {
  const { count: totalOperators } = await supabase
    .from('operators')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)

  const { count: totalSkills } = await supabase
    .from('operator_skills')
    .select('*', { count: 'exact', head: true })

  const { data: lines } = await supabase
    .from('production_lines')
    .select('nome, categoria')
    .eq('ativo', true)
    .order('nome')

  const { data: workstations } = await supabase
    .from('workstations')
    .select('nome')
    .eq('ativo', true)
    .order('nome')

  return {
    total_operadores_ativos: totalOperators || 0,
    total_registros_skills: totalSkills || 0,
    linhas: lines || [],
    postos: workstations || [],
    total_linhas: lines?.length || 0,
    total_postos: workstations?.length || 0
  }
}

// ============================================================
// 5. Cobertura da Linha (já existia)
// ============================================================
export async function getLineCoverage(linha: string) {
  const { data, error } = await supabase
    .from('vw_line_coverage')
    .select('*')
    .eq('linha', linha)
  
  if (error) throw new Error(`Erro ao buscar cobertura: ${error.message}`)
  return data
}

// ============================================================
// 6. Risco de Assiduidade (já existia)
// ============================================================
export async function getOperatorRisk(linha?: string) {
  let query = supabase.from('vw_operator_analytics').select('*')
  
  if (linha) {
    query = query.eq('linha_atual', linha)
  }
  
  query = query.order('score_assiduidade', { ascending: true }).limit(20)
  
  const { data, error } = await query
  if (error) throw new Error(`Erro ao buscar risco de operadores: ${error.message}`)
  return data
}

// ============================================================
// 7. Necessidades Críticas de Treinamento (já existia)
// ============================================================
export async function getCriticalTrainingNeeds() {
  const { data, error } = await supabase
    .from('vw_line_coverage')
    .select('*')
    .gt('gap', 0)
    .in('criticidade', ['Alta', 'Média'])
  
  if (error) throw new Error(`Erro ao buscar treinamentos: ${error.message}`)
  return data
}

// ============================================================
// 8. Contexto 360 (já existia)
// ============================================================
export async function getOperatorContext360(linha?: string) {
  let query = supabase.from('vw_operator_360_context').select('*')
  
  if (linha) {
    query = query.eq('linha_atual', linha)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Erro ao buscar contexto 360: ${error.message}`)
  return data
}