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
        let query = supabase.from('vw_operator_analytics').select('linha_atual, score_assiduidade, turno')

        // Aplica o filtro de turno se houver
        if (filters.turno) {
          query = query.eq('turno', filters.turno)
        }

        const { data, error } = await query
        if (error) throw error

        const rawData = data || []

        // Agrupa por linha e soma os scores
        const statsMap: Record<string, { totalScore: number, count: number }> = {}

        rawData.forEach(row => {
          // Ignora quem não tem linha e, se o filtro de linha estiver ativo, pega só a linha selecionada
          if (!row.linha_atual) return
          if (filters.linha && row.linha_atual !== filters.linha) return

          if (!statsMap[row.linha_atual]) {
            statsMap[row.linha_atual] = { totalScore: 0, count: 0 }
          }
          
          statsMap[row.linha_atual].totalScore += Number(row.score_assiduidade || 0)
          statsMap[row.linha_atual].count += 1
        })

        // Converte para array, calcula a média e ordena
        const sortedRanking = Object.keys(statsMap).map(linha => {
          const info = statsMap[linha]
          return {
            linha,
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
    if (score >= 90) return "health-excellent"
    if (score >= 80) return "health-warning"
    return "health-critical"
  }

  // SVGs para Benchmark e Alerta
  const TrophyIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
  const WarningIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d40000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

  return (
    <div className="engagementCard animateFadeIn">
      <div className="engHeader">
        <div>
          <h2 className="engTitle">Termômetro de Engajamento</h2>
          <p className="engSubtitle">Média de Assiduidade por Linha (Cultura e Liderança)</p>
        </div>
      </div>

      {loading ? (
        <div className="pageLoader" style={{ height: '40px', width: '40px', margin: '40px auto' }} />
      ) : ranking.length === 0 ? (
        <div className="emptyState" style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
          <p>Dados insuficientes para gerar o termômetro.</p>
        </div>
      ) : (
        <div className="engRankingList">
          {ranking.map((item, index) => (
            <div key={item.linha} className="engLineItem">
              
              <div className="engLineInfo">
                <div className="engLineName">
                  {index === 0 && ranking.length > 1 && <span className="engMedal" title="Benchmark da Fábrica">{TrophyIcon}</span>}
                  {index === ranking.length - 1 && ranking.length > 1 && <span className="engMedal" title="Ponto de Atenção Crítico">{WarningIcon}</span>}
                  {item.linha}
                </div>
                <div className="engLineScore">
                  {item.avgScore.toFixed(1)}% <span>({item.operatorCount} op.)</span>
                </div>
              </div>

              <div className="engBarTrack">
                <div 
                  className={`engBarFill ${getHealthClass(item.avgScore)}`} 
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