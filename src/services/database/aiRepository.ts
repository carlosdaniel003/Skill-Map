// src/services/database/aiRepository.ts
import { supabase } from "./supabaseClient"

// ============================================================
// 1. BUSCA OPERADOR POR NOME OU MATRÍCULA
// ============================================================
export async function searchOperator(identificador: string) {
  const isMatricula = /^\d+$/.test(identificador.trim())

  let query = supabase
    .from('operators')
    .select('*')
    .eq('ativo', true)

  if (isMatricula) {
    query = query.eq('matricula', identificador.trim())
  } else {
    query = query.ilike('nome', `%${identificador.trim()}%`)
  }

  const { data: operators, error: opError } = await query.limit(5)

  if (opError) throw new Error(`Erro ao buscar operador: ${opError.message}`)
  if (!operators || operators.length === 0) {
    return {
      operadores: [], skills: [], attendance: [], experience: [],
      context360: [], analytics: [],
      _meta: { busca: identificador, tipo_busca: isMatricula ? 'matricula' : 'nome', encontrados: 0 }
    }
  }

  const operatorIds = operators.map(op => op.id)

  // Skills ordenadas por nível (desc) para IA ver TOP skills facilmente
  const { data: skills } = await supabase
    .from('operator_skills')
    .select('*')
    .in('operator_id', operatorIds)
    .order('skill_level', { ascending: false })

  // Frequência últimos 90 dias (mais contexto para explicar a média)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0]

  const { data: attendance } = await supabase
    .from('operator_attendance')
    .select('*')
    .in('operator_id', operatorIds)
    .gte('data_registro', dateStr)
    .order('data_registro', { ascending: false })

  // Experiência/histórico
  const { data: experience } = await supabase
    .from('operator_experience')
    .select('*')
    .in('operator_id', operatorIds)
    .eq('ativo', true)

  // View 360 para dados calculados
  const { data: context360 } = await supabase
    .from('vw_operator_360_context')
    .select('*')
    .in('operator_id', operatorIds)

  // Analytics para score de assiduidade e risco
  const { data: analytics } = await supabase
    .from('vw_operator_analytics')
    .select('*')
    .in('operator_id', operatorIds)

  return {
    operadores: operators || [],
    skills: skills || [],
    attendance: attendance || [],
    experience: experience || [],
    context360: context360 || [],
    analytics: analytics || [],
    _meta: {
      busca: identificador,
      tipo_busca: isMatricula ? 'matricula' : 'nome',
      encontrados: operators.length,
      periodo_frequencia: '90 dias',
      total_registros_frequencia: attendance?.length || 0,
      total_skills: skills?.length || 0
    }
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

// ============================================================
// 9. BUSCA SUBSTITUTOS PARA UM OPERADOR
// ============================================================
export async function findSubstitutes(operatorId: string) {
  // 1. Descobre o operador e seu posto/linha
  const { data: operator } = await supabase
    .from('operators')
    .select('id, nome, matricula, posto_atual, linha_atual, turno')
    .eq('id', operatorId)
    .single()

  if (!operator) return { error: 'Operador não encontrado', substitutos: [] }

  // Se não tem posto ou linha, não há como buscar substitutos
  if (!operator.posto_atual || !operator.linha_atual) {
    return {
      operador_original: operator,
      substitutos: [],
      motivo: 'Operador sem posto ou linha atribuída'
    }
  }

  // 2. Busca outros operadores com skill no MESMO POSTO
  const { data: candidatos } = await supabase
    .from('operator_skills')
    .select('operator_id, skill_level, posto')
    .eq('posto', operator.posto_atual)
    .gte('skill_level', 3)
    .neq('operator_id', operatorId)
    .order('skill_level', { ascending: false })
    .limit(10)

  if (!candidatos || candidatos.length === 0) {
    return {
      operador_original: operator,
      substitutos: [],
      motivo: `Nenhum operador com skill >= 3 no posto ${operator.posto_atual}`
    }
  }

  const candidatoIds = candidatos.map(c => c.operator_id)

  // 3. Busca os dados dos candidatos
  const { data: candidatoOperators } = await supabase
    .from('operators')
    .select('id, nome, matricula, posto_atual, linha_atual, turno')
    .in('id', candidatoIds)
    .eq('ativo', true)

  // 4. Busca analytics dos candidatos (assiduidade)
  const { data: candidatoAnalytics } = await supabase
    .from('vw_operator_analytics')
    .select('operator_id, score_assiduidade, risco_assiduidade')
    .in('operator_id', candidatoIds)

  // 5. Monta a lista enriquecida
  const analyticsMap = new Map((candidatoAnalytics || []).map(a => [a.operator_id, a]))
  const opsMap = new Map((candidatoOperators || []).map(o => [o.id, o]))

  const substitutos = candidatos.map(c => {
    const op = opsMap.get(c.operator_id)
    const an = analyticsMap.get(c.operator_id)
    return {
      operator_id: c.operator_id,
      nome: op?.nome || 'Desconhecido',
      matricula: op?.matricula || '',
      linha_atual: op?.linha_atual || '',
      posto_atual_do_substituto: op?.posto_atual || '',
      turno: op?.turno || '',
      skill_level_no_posto: c.skill_level,
      score_assiduidade: an?.score_assiduidade || null,
      risco_assiduidade: an?.risco_assiduidade || null,
      mesmo_turno: op?.turno === operator.turno,
      mesma_linha: op?.linha_atual === operator.linha_atual,
      justificativa: `Skill ${c.skill_level}/5 no posto ${c.posto}` +
        (op?.linha_atual === operator.linha_atual ? ' • Já está na mesma linha' : ' • Linha diferente') +
        (op?.turno === operator.turno ? ' • Mesmo turno' : ' • Turno diferente') +
        (an ? ` • Assiduidade: ${an.score_assiduidade}% (${an.risco_assiduidade})` : '')
    }
  }).sort((a, b) => {
    // Prioridade: mesmo turno + mesma linha > skill > assiduidade
    if (a.mesmo_turno && !b.mesmo_turno) return -1
    if (!a.mesmo_turno && b.mesmo_turno) return 1
    if (a.mesma_linha && !b.mesma_linha) return -1
    if (!a.mesma_linha && b.mesma_linha) return 1
    if (b.skill_level_no_posto !== a.skill_level_no_posto) return b.skill_level_no_posto - a.skill_level_no_posto
    return (Number(b.score_assiduidade) || 0) - (Number(a.score_assiduidade) || 0)
  })

  return {
    operador_original: operator,
    posto_busca: operator.posto_atual,
    linha_busca: operator.linha_atual,
    total_substitutos: substitutos.length,
    substitutos
  }
}

// ============================================================
// 10. EXPLICAR SCORE DE ASSIDUIDADE
// ============================================================
export async function explainAttendanceScore(operatorId: string) {
  // Frequência dos últimos 90 dias
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0]

  const { data: attendance } = await supabase
    .from('operator_attendance')
    .select('*')
    .eq('operator_id', operatorId)
    .gte('data_registro', dateStr)
    .order('data_registro', { ascending: false })

  const { data: analytics } = await supabase
    .from('vw_operator_analytics')
    .select('*')
    .eq('operator_id', operatorId)

  const { data: operator } = await supabase
    .from('operators')
    .select('nome, matricula, linha_atual, posto_atual, turno')
    .eq('id', operatorId)
    .single()

  const records = attendance || []

  // Calcular breakdown por tipo de status
  const statusBreakdown: Record<string, number> = {}
  records.forEach(r => {
    const s = (r.status || 'SEM_REGISTRO').toUpperCase()
    statusBreakdown[s] = (statusBreakdown[s] || 0) + 1
  })

  const totalRegistros = records.length
  const faltas = (statusBreakdown['F'] || 0) + (statusBreakdown['FALTA'] || 0)
  const atrasos = (statusBreakdown['A'] || 0) + (statusBreakdown['ATRASO'] || 0)
  const presencas = (statusBreakdown['P'] || 0) + (statusBreakdown['PRESENTE'] || 0)
  const atestados = (statusBreakdown['AT'] || 0) + (statusBreakdown['ATESTADO'] || 0)
  const ferias = (statusBreakdown['FE'] || 0) + (statusBreakdown['FERIAS'] || 0) + (statusBreakdown['FÉRIAS'] || 0)

  return {
    operador: operator || {},
    analytics: analytics?.[0] || {},
    periodo: '90 dias',
    total_registros: totalRegistros,
    breakdown: {
      presencas,
      faltas,
      atrasos,
      atestados,
      ferias,
      outros: totalRegistros - presencas - faltas - atrasos - atestados - ferias
    },
    detalhes_recentes: records.slice(0, 15), // últimos 15 registros para contexto
    explicacao_formula: `Score = (Presenças / Dias Úteis Registrados) × 100. Faltas e atrasos reduzem o score. Atestados e férias são neutros na maioria dos cálculos.`
  }
}