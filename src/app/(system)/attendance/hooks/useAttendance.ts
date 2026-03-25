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
  const [selectedTurno, setSelectedTurno] = useState("") // ESTADO DO TURNO
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
  // MOTOR DE DADOS: GESTÃO DO TURNO (CRUZAMENTO DE RISCO E GAP) - AGORA VÊ O TURNO
  // ============================================================================
  useEffect(() => {
    async function loadShiftData() {
      if (!selectedLine) return
      setLoadingShift(true)

      try {
        const { data: coverage } = await supabase
          .from('vw_line_coverage')
          .select('*')
          .eq('linha', selectedLine)

        // 🆕 APLICANDO O FILTRO DE TURNO TAMBÉM NA VIEW DO RADAR DE RISCO
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

        // Se houver um filtro de turno, o GAP geral da linha ainda vale?
        // Sim, mas a capacidade alocada visível é apenas a daquele turno.
        cov.forEach(c => {
          totalNec += c.quantidade_necessaria
          totalAloc += c.alocados
          gap += c.gap > 0 ? c.gap : 0 
        })

        const vermelhos = an.filter(o => o.risco_assiduidade === 'Vermelho')
        const amarelos = an.filter(o => o.risco_assiduidade === 'Amarelo')

        // 🆕 ATENÇÃO: Como filtramos o turno na query, o "totalAloc" deve 
        // refletir apenas as pessoas que retornaram no array 'an' para a Prontidão não bugar.
        const alocadosTurno = selectedTurno ? an.length : totalAloc;
        
        const alocadosSeguros = Math.max(0, alocadosTurno - vermelhos.length)
        const prontidao = totalNec > 0 ? Math.round((alocadosSeguros / totalNec) * 100) : 100

        const radar = [...vermelhos, ...amarelos].sort((a, b) => Number(a.score_assiduidade) - Number(b.score_assiduidade))

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
  }, [selectedLine, selectedTurno]) // 🆕 Recalcula se ele mudar de turno

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

  // LÓGICA DE FILTRAGEM ATUALIZADA COM O TURNO PARA A TABELA MENSAL
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