// src/app/(system)/attendance/hooks/useAttendance.ts
import { useEffect, useState } from "react"
import { 
  getProductionLinesWithOperators, 
  getOperatorsByLine 
} from "@/services/database/attendanceRepository"
import { supabase } from "@/services/database/supabaseClient"

export interface AttendanceRecord {
  status: string
  observacao: string
}

export function useAttendance() {
  const dataAtual = new Date()
  
  const [selectedMonth, setSelectedMonth] = useState(dataAtual.getMonth())
  const [selectedYear, setSelectedYear] = useState(dataAtual.getFullYear())
  const [selectedLine, setSelectedLine] = useState("")
  const [selectedTurno, setSelectedTurno] = useState("") 
  const [searchQuery, setSearchQuery] = useState("")
  const [allOperators, setAllOperators] = useState<any[]>([])

  const [lines, setLines] = useState<string[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [daysInMonth, setDaysInMonth] = useState<{ day: number, isWeekend: boolean, dateStr: string }[]>([])
  
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({})
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)

  // ============================================================================
  // ESTADOS DO DASHBOARD DE GESTÃO DO TURNO (TÁTICO)
  // ============================================================================
  const [loadingShift, setLoadingShift] = useState(false)
  const [shiftMetrics, setShiftMetrics] = useState({
    totalAlocados: 0,
    totalNecessario: 0,
    gapTotal: 0,
    operadoresEmRisco: 0,
    prontidao: 0,
    radarList: [] as any[]
  })

  useEffect(() => {
    async function loadInitialData() {
      const linesData = await getProductionLinesWithOperators()
      setLines(linesData)

      const { data: allOps } = await supabase
        .from("operators")
        .select("id, matricula, nome, turno, linha_atual, posto_atual") 
        .eq("ativo", true)
      
      setAllOperators(allOps || [])
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    const numDays = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const days = []
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(selectedYear, selectedMonth, i)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({ day: i, isWeekend, dateStr })
    }
    setDaysInMonth(days)
  }, [selectedMonth, selectedYear])

  // Carrega Operadores da Tabela Mensal
  useEffect(() => {
    async function loadOps() {
      if (selectedLine) {
        const opsData = await getOperatorsByLine(selectedLine)
        setOperators(opsData)
      } else {
        setOperators([])
        setAttendanceData({})
      }
    }
    loadOps()
  }, [selectedLine])

  // ============================================================================
  // MOTOR DE DADOS: GESTÃO DO TURNO (CRUZAMENTO DE RISCO E GAP COM NOVA MATEMÁTICA)
  // ============================================================================
  useEffect(() => {
    async function loadShiftData() {
      if (!selectedLine) return
      setLoadingShift(true)

      try {
        // 1. Busca a View de Cobertura (GAP)
        let queryCoverage = supabase
          .from('vw_line_coverage')
          .select('*')
          .eq('linha', selectedLine)

        // Se escolheu turno, traz as metas e a ocupação DELE. 
        if (selectedTurno) {
           queryCoverage = queryCoverage.eq('turno_alocado', selectedTurno)
        }

        const { data: coverage } = await queryCoverage

        // 2. Busca o Risco de Assiduidade
        let queryAnalytics = supabase
          .from('vw_operator_analytics')
          .select('*')
          .eq('linha_atual', selectedLine)
        
        if (selectedTurno) {
          queryAnalytics = queryAnalytics.eq('turno', selectedTurno)
        }

        const { data: analytics } = await queryAnalytics

        const cov = coverage || []
        const an = analytics || []

        let totalNec = 0
        let totalAloc = 0
        let gap = 0

        // 3. MATEMÁTICA CORRIGIDA: Agrupa por Posto para a Meta não ficar distorcida (0/0)
        // Isso impede que postos vazios, ou com metas múltiplas quebrem o indicador
        const postosUnicos = new Map()

        cov.forEach(c => {
           if (!postosUnicos.has(c.posto)) {
              // Primeira vez que achou o posto, grava a meta dele
              postosUnicos.set(c.posto, { nec: c.quantidade_necessaria || 0, aloc: 0 })
           }
           const p = postosUnicos.get(c.posto)
           p.aloc += (c.alocados || 0) // Soma as pessoas que já estão trabalhando nele
        })

        // 4. Soma final dos Cards
        postosUnicos.forEach(p => {
           totalNec += p.nec
           totalAloc += p.aloc
           const falta = p.nec - p.aloc
           if (falta > 0) gap += falta
        })

        const vermelhos = an.filter(o => o.risco_assiduidade === 'Vermelho')
        const amarelos = an.filter(o => o.risco_assiduidade === 'Amarelo')

        // Usa o totalAloc (pessoas achadas no turno atual) para não conflitar com a tela.
        const alocadosTurno = selectedTurno ? an.length : totalAloc; 
        
        // Prontidão: Alocados - Operadores de Alto Risco / Necessário. Mínimo zero, máximo cem.
        const alocadosSeguros = Math.max(0, alocadosTurno - vermelhos.length)
        const prontidao = totalNec > 0 ? Math.round((alocadosSeguros / totalNec) * 100) : 100

        // 🆕 LISTA TODOS OS OPERADORES NO RADAR ORDENADOS POR COR E SCORE
        const ordemCores: Record<string, number> = { 'Vermelho': 1, 'Amarelo': 2, 'Verde': 3 };

        const radar = [...an].sort((a, b) => {
          const pesoA = ordemCores[a.risco_assiduidade] || 4;
          const pesoB = ordemCores[b.risco_assiduidade] || 4;
          
          // Se forem de cores diferentes, ordena pela cor (Vermelho > Amarelo > Verde)
          if (pesoA !== pesoB) {
            return pesoA - pesoB;
          }
          
          // Se forem da mesma cor, ordena do MAIOR score para o MENOR score
          return Number(b.score_assiduidade) - Number(a.score_assiduidade);
        })

        setShiftMetrics({
          totalAlocados: alocadosTurno,
          totalNecessario: totalNec,
          gapTotal: gap,
          operadoresEmRisco: vermelhos.length,
          prontidao,
          radarList: radar
        })

      } catch (err) {
        console.error("Erro ao cruzar dados do turno:", err)
      } finally {
        setLoadingShift(false)
      }
    }

    loadShiftData()
  }, [selectedLine, selectedTurno])

  // Carrega Apontamentos do Mês
  useEffect(() => {
    async function fetchAttendance() {
      if (operators.length > 0 && daysInMonth.length > 0) {
        const operatorIds = operators.map(o => o.id)
        const firstDay = daysInMonth[0].dateStr
        const lastDay = daysInMonth[daysInMonth.length - 1].dateStr
        
        const { data } = await supabase
          .from("operator_attendance")
          .select("operator_id, data_registro, status, observacao")
          .in("operator_id", operatorIds)
          .gte("data_registro", firstDay)
          .lte("data_registro", lastDay)

        const map: Record<string, AttendanceRecord> = {}
        if (data) {
          data.forEach(row => {
            const key = `${row.operator_id}_${row.data_registro}`
            map[key] = { status: row.status, observacao: row.observacao || "" }
          })
        }
        setAttendanceData(map)
      }
    }
    fetchAttendance()
  }, [operators, daysInMonth])

  async function handleSaveCell(operatorId: string, dateStr: string, value: string, observacao: string) {
    const upperValue = value.trim().toUpperCase()
    const key = `${operatorId}_${dateStr}`
    const previous = attendanceData[key] || { status: "", observacao: "" }

    setAttendanceData(prev => ({ ...prev, [key]: { status: upperValue, observacao } }))

    try {
      if (upperValue === "" && observacao === "") {
        const { error } = await supabase.from("operator_attendance").delete().match({ operator_id: operatorId, data_registro: dateStr })
        if (error) throw error
      } else {
        const { error } = await supabase.from("operator_attendance").upsert({ operator_id: operatorId, data_registro: dateStr, status: upperValue, observacao }, { onConflict: 'operator_id,data_registro' })
        if (error) throw error
      }
    } catch (error) {
      setAttendanceData(prev => ({ ...prev, [key]: previous }))
      setAlertConfig({ title: "Falha de Sincronização", message: "Não foi possível salvar a frequência no banco de dados. A célula foi revertida." })
      throw error 
    }
  }

  const filteredOperators = operators.filter(op => {
    const matchBusca = op.nome.toLowerCase().includes(searchQuery.toLowerCase()) || String(op.matricula).includes(searchQuery)
    const matchTurno = selectedTurno === "" || op.turno === selectedTurno
    return matchBusca && matchTurno
  })

  return {
    modals: { alertConfig, setAlertConfig },
    filters: {
      selectedMonth, setSelectedMonth,
      selectedYear, setSelectedYear,
      selectedLine, setSelectedLine,
      selectedTurno, setSelectedTurno, 
      lines,
      searchQuery, setSearchQuery,
      allOperators 
    },
    table: {
      operators: filteredOperators, 
      daysInMonth,
      attendanceData,
      handleSaveCell
    },
    shift: {
      metrics: shiftMetrics,
      loading: loadingShift
    }
  }
}