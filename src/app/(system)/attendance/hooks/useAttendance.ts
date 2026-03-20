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
  const [searchQuery, setSearchQuery] = useState("")
  const [allOperators, setAllOperators] = useState<any[]>([])

  const [lines, setLines] = useState<string[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [daysInMonth, setDaysInMonth] = useState<{ day: number, isWeekend: boolean, dateStr: string }[]>([])
  
  // Agora guarda tanto o status quanto a observação
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({})

  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      const linesData = await getProductionLinesWithOperators()
      setLines(linesData)

      const { data: allOps } = await supabase
        .from("operators")
        .select("id, matricula, nome, linha_atual, posto_atual")
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

  useEffect(() => {
    async function fetchAttendance() {
      if (operators.length > 0 && daysInMonth.length > 0) {
        const operatorIds = operators.map(o => o.id)
        const firstDay = daysInMonth[0].dateStr
        const lastDay = daysInMonth[daysInMonth.length - 1].dateStr
        
        // Busca direto no Supabase para garantir a coluna nova "observacao"
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

  // ============================================================================
  // MAGIA DA CONCORRÊNCIA E ROLLBACK OTIMISTA COM OBSERVAÇÃO
  // ============================================================================
  async function handleSaveCell(operatorId: string, dateStr: string, value: string, observacao: string) {
    const upperValue = value.trim().toUpperCase()
    const key = `${operatorId}_${dateStr}`
    const previous = attendanceData[key] || { status: "", observacao: "" }

    // 1. Atualização Otimista (Interface fica rápida)
    setAttendanceData(prev => ({ ...prev, [key]: { status: upperValue, observacao } }))

    try {
      if (upperValue === "" && observacao === "") {
        // Limpou tudo
        const { error } = await supabase
          .from("operator_attendance")
          .delete()
          .match({ operator_id: operatorId, data_registro: dateStr })
        
        if (error) throw error
      } else {
        // Upsert salvando o status E a observação
        const { error } = await supabase
          .from("operator_attendance")
          .upsert(
            { operator_id: operatorId, data_registro: dateStr, status: upperValue, observacao },
            { onConflict: 'operator_id,data_registro' }
          )
        
        if (error) throw error
      }
    } catch (error) {
      console.error("Erro na sincronização:", error)
      // 2. Rollback Automático
      setAttendanceData(prev => ({ ...prev, [key]: previous }))
      setAlertConfig({
        title: "Falha de Sincronização",
        message: "Não foi possível salvar a frequência no banco de dados. A célula foi revertida."
      })
      throw error 
    }
  }

  const filteredOperators = operators.filter(op => 
    op.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(op.matricula).includes(searchQuery)
  )

  return {
    modals: { alertConfig, setAlertConfig },
    filters: {
      selectedMonth, setSelectedMonth,
      selectedYear, setSelectedYear,
      selectedLine, setSelectedLine,
      lines,
      searchQuery, setSearchQuery,
      allOperators 
    },
    table: {
      operators: filteredOperators,
      daysInMonth,
      attendanceData,
      handleSaveCell
    }
  }
}