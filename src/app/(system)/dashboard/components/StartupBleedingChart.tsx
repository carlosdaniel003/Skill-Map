// src/app/(system)/dashboard/components/StartupBleedingChart.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import "./StartupBleedingChart.css"

interface ChartData {
  name: string
  Atraso: number
  Saida: number
  Falta: number
  Justificado: number
  TotalDesvios: number
}

export default function StartupBleedingChart() {
  const { filters } = useDashboardFilters()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    async function fetchBleedingData() {
      setLoading(true)
      try {
        // Pega a data de 30 dias atrás
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

        // Busca apontamentos que NÃO sejam presença ou hora extra
        const { data: attendance, error } = await supabase
          .from('operator_attendance')
          .select(`
            status,
            operators!inner (
              id,
              nome,
              linha_atual,
              turno,
              ativo
            )
          `)
          .gte('data_registro', dateStr)
          .not('status', 'in', '("P","H.E")') // Ignora o que está OK

        if (error) throw error

        // 1. Aplica os Filtros Globais do Dashboard pós-busca
        const filteredRecords = (attendance || []).filter((row: any) => {
          const op = Array.isArray(row.operators) ? row.operators[0] : row.operators
          if (!op || !op.ativo) return false
          if (filters.linha && op.linha_atual !== filters.linha) return false
          if (filters.turno && op.turno !== filters.turno) return false
          if (filters.operatorId && op.id !== filters.operatorId) return false
          return true
        })

        // 2. Agrupa os dados
        // Se não houver linha filtrada, agrupa por LINHA. Se houver linha filtrada, agrupa por OPERADOR.
        const groupByOperator = !!filters.linha
        const groupMap: Record<string, ChartData> = {}

        filteredRecords.forEach((row: any) => {
          const op = Array.isArray(row.operators) ? row.operators[0] : row.operators
          const groupKey = groupByOperator ? op.nome : (op.linha_atual || "Sem Linha")
          
          if (!groupMap[groupKey]) {
            groupMap[groupKey] = { name: groupKey, Atraso: 0, Saida: 0, Falta: 0, Justificado: 0, TotalDesvios: 0 }
          }

          const status = row.status.toUpperCase()

          if (status === 'A') groupMap[groupKey].Atraso += 1
          else if (status === 'S') groupMap[groupKey].Saida += 1
          else if (status === 'F') groupMap[groupKey].Falta += 1
          else groupMap[groupKey].Justificado += 1 // Engloba atestados, faltas justificadas, férias, etc.

          groupMap[groupKey].TotalDesvios += 1
        })

        // 3. Converte para array e ordena pelos maiores sangramentos
        const chartArray = Object.values(groupMap)
          .sort((a, b) => b.TotalDesvios - a.TotalDesvios)
          .slice(0, 15) // Limita a 15 barras para não quebrar o layout

        setData(chartArray)

      } catch (error) {
        console.error("Erro ao buscar Sangramento de Start-up", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBleedingData()
  }, [filters])

  // Customização do balãozinho ao passar o mouse
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="tooltip-item">
              <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '2px' }}></span>
              <strong>{entry.name}:</strong> {entry.value} eventos
            </div>
          ))}
          <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px', fontSize: '13px', color: '#666' }}>
            Total de desvios: {payload.reduce((acc: number, curr: any) => acc + curr.value, 0)}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bleedingCard">
      <div className="bleedingHeader">
        <div>
          <h2 className="bleedingTitle">Índice de Sangramento (Micro-absenteísmo)</h2>
          <p className="bleedingSubtitle">
            Volume de atrasos e saídas antecipadas nos últimos 30 dias. 
            Estes pequenos desvios inviabilizam o balanceamento inicial do turno e afetam drasticamente o OEE.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="pageLoader" style={{ height: '40px', width: '40px', margin: '60px auto' }} />
      ) : data.length === 0 ? (
        <div className="emptyState" style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <p>Nenhum atraso, falta ou saída registrada nos últimos 30 dias para este filtro! 🎉</p>
        </div>
      ) : (
        <div className="chartContainer">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                // Esconde nomes muito longos se for linha
                tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
              
              {/* O EMPILHAMENTO É FEITO AQUI (stackId="a") */}
              <Bar dataKey="Atraso" name="Atrasos (A)" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Saida" name="Saídas (S)" stackId="a" fill="#fbbf24" />
              <Bar dataKey="Falta" name="Faltas Críticas (F)" stackId="a" fill="#dc2626" />
              <Bar dataKey="Justificado" name="Justificados / Atestados" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}