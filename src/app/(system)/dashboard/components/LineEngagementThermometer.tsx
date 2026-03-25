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

  return (
    <div className="engagementCard">
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
                  {index === 0 && ranking.length > 1 && <span className="engMedal" title="Benchmark da Fábrica">🏆</span>}
                  {index === ranking.length - 1 && ranking.length > 1 && <span className="engMedal" title="Ponto de Atenção Crítico">⚠️</span>}
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