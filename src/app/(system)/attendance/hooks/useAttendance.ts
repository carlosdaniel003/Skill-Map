// src/app/(system)/attendance/hooks/useAttendance.ts
import { useEffect, useState } from "react"
import { 
  getProductionLinesWithOperators, 
  getOperatorsByLine, 
  getAttendanceData, 
  saveAttendance 
} from "@/services/database/attendanceRepository"
import { supabase } from "@/services/database/supabaseClient" // Import direto para busca global

export function useAttendance() {
  const dataAtual = new Date()
  
  const [selectedMonth, setSelectedMonth] = useState(dataAtual.getMonth())
  const [selectedYear, setSelectedYear] = useState(dataAtual.getFullYear())
  const [selectedLine, setSelectedLine] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [allOperators, setAllOperators] = useState<any[]>([]) // Todos para a busca

  const [lines, setLines] = useState<string[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [daysInMonth, setDaysInMonth] = useState<{ day: number, isWeekend: boolean, dateStr: string }[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})

  // 1. Carrega linhas e TODOS os operadores ativos para o Autocomplete funcionar globalmente
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

  // 2. Gerador de dias (mantido)
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

  // 3. Busca operadores da linha (mantido)
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

  // 4. Busca frequências (mantido)
  useEffect(() => {
    async function fetchAttendance() {
      if (operators.length > 0 && daysInMonth.length > 0) {
        const operatorIds = operators.map(o => o.id)
        const firstDay = daysInMonth[0].dateStr
        const lastDay = daysInMonth[daysInMonth.length - 1].dateStr
        const data = await getAttendanceData(operatorIds, firstDay, lastDay)
        setAttendanceData(data)
      }
    }
    fetchAttendance()
  }, [operators, daysInMonth])

  async function handleSaveCell(operatorId: string, dateStr: string, value: string) {
    const upperValue = value.trim().toUpperCase()
    const key = `${operatorId}_${dateStr}`
    setAttendanceData(prev => ({ ...prev, [key]: upperValue }))
    await saveAttendance(operatorId, dateStr, upperValue)
  }

  // Filtro de tabela: Se houver busca, filtra os da linha atual. 
  // Se não houver linha selecionada, não mostra nada (mantém o padrão)
  const filteredOperators = operators.filter(op => 
    op.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(op.matricula).includes(searchQuery)
  )

  return {
    filters: {
      selectedMonth, setSelectedMonth,
      selectedYear, setSelectedYear,
      selectedLine, setSelectedLine,
      lines,
      searchQuery, setSearchQuery,
      allOperators // Passamos todos os operadores do sistema aqui
    },
    table: {
      operators: filteredOperators,
      daysInMonth,
      attendanceData,
      handleSaveCell
    }
  }
}