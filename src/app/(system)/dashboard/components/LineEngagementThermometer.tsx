// src/app/(system)/dashboard/components/LineEngagementThermometer.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import "./LineEngagementThermometer.css"

interface LineHealth {
  linha: string
  avgScore: number
  operatorCount: number
}

export default function LineEngagementThermometer() {
  const { filters } = useDashboardFilters()
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState<LineHealth[]>([])

  useEffect(() => {
    async function fetchEngagementData() {
      setLoading(true)
      try {
        // 1. Busca os dados essenciais
        let query = supabase.from('vw_operator_analytics').select('operator_id, linha_atual, score_assiduidade, turno')

        // 2. Aplica TODOS os filtros da sidebar diretamente no Supabase (mais performance)
        if (filters.turno) query = query.eq('turno', filters.turno)
        if (filters.linha) query = query.eq('linha_atual', filters.linha)
        if (filters.operatorId) query = query.eq('operator_id', filters.operatorId)

        const { data, error } = await query
        if (error) throw error

        const rawData = data || []

        // 3. Agrupa os scores
        const statsMap: Record<string, { totalScore: number, count: number }> = {}

        rawData.forEach(row => {
          if (!row.linha_atual) return

          // Traduz o turno do banco para o nome amigável
          const turnoName = row.turno || "Sem Turno"

          // Se o RH já filtrou um turno específico, mostramos só a Linha. 
          // Se não houver filtro de turno, nós desmembramos a linha nos dois turnos!
          const groupKey = filters.turno ? row.linha_atual : `${row.linha_atual} (${turnoName})`

          if (!statsMap[groupKey]) {
            statsMap[groupKey] = { totalScore: 0, count: 0 }
          }
          
          statsMap[groupKey].totalScore += Number(row.score_assiduidade || 0)
          statsMap[groupKey].count += 1
        })

        // 4. Converte para array, calcula a média e ordena
        const sortedRanking = Object.keys(statsMap).map(groupKey => {
          const info = statsMap[groupKey]
          return {
            linha: groupKey,
            avgScore: info.totalScore / info.count,
            operatorCount: info.count
          }
        }).sort((a, b) => b.avgScore - a.avgScore) // Do maior para o menor

        setRanking(sortedRanking)

      } catch (err) {
        console.error("Erro ao buscar Engajamento da Linha:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchEngagementData()
  }, [filters])

  function getHealthClass(score: number) {
    if (score >= 90) return "modEng-healthExcellent"
    if (score >= 80) return "modEng-healthWarning"
    return "modEng-healthCritical"
  }

  return (
    <div className="modEng-card">
      <div className="modEng-header">
        <div className="modEng-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
            <path d="M12 16v-2"/>
          </svg>
        </div>
        <div className="modEng-titleBlock">
          <h2 className="modEng-title">Termômetro de Engajamento</h2>
          <p className="modEng-subtitle">Média de Assiduidade por Linha (Cultura e Liderança)</p>
        </div>
      </div>

      {loading ? (
        <div className="modEng-loadingState">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modEng-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      ) : ranking.length === 0 ? (
        <div className="modEng-emptyState">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p>Dados insuficientes para gerar o termômetro com estes filtros.</p>
        </div>
      ) : (
        <div className="modEng-rankingList">
          {ranking.map((item, index) => (
            <div key={item.linha} className="modEng-lineItem">
              
              <div className="modEng-lineInfo">
                <div className="modEng-lineName">
                  {/* Medalhas / Avisos */}
                  {index === 0 && ranking.length > 1 && (
                    <span className="modEng-medal" title="Benchmark da Fábrica">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                    </span>
                  )}
                  {index === ranking.length - 1 && ranking.length > 1 && (
                    <span className="modEng-medal" title="Ponto de Atenção Crítico">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d40000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </span>
                  )}
                  {item.linha}
                </div>
                <div className="modEng-lineScore">
                  {item.avgScore.toFixed(1)}% <span>({item.operatorCount} op.)</span>
                </div>
              </div>

              <div className="modEng-barTrack">
                <div 
                  className={`modEng-barFill ${getHealthClass(item.avgScore)}`} 
                  style={{ width: `${item.avgScore}%` }}
                />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}