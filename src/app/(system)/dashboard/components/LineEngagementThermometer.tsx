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

interface PostoDetail {
  posto: string
  avgScore: number
  operatorCount: number
}

export default function LineEngagementThermometer() {
  const { filters } = useDashboardFilters()
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState<LineHealth[]>([])

  // NOVO: Estados para expansão por posto
  const [expandedLine, setExpandedLine] = useState<string | null>(null)
  const [lineDetails, setLineDetails] = useState<Record<string, PostoDetail[]>>({})
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    async function fetchEngagementData() {
      setLoading(true)
      try {
        let query = supabase.from('vw_operator_analytics').select('operator_id, linha_atual, score_assiduidade, turno')

        if (filters.turno) query = query.eq('turno', filters.turno)
        if (filters.linha) query = query.eq('linha_atual', filters.linha)
        if (filters.operatorId) query = query.eq('operator_id', filters.operatorId)

        const { data, error } = await query
        if (error) throw error

        const rawData = data || []

        const statsMap: Record<string, { totalScore: number, count: number }> = {}

        rawData.forEach(row => {
          if (!row.linha_atual) return

          const turnoName = row.turno || "Sem Turno"
          const groupKey = filters.turno ? row.linha_atual : `${row.linha_atual} (${turnoName})`

          if (!statsMap[groupKey]) {
            statsMap[groupKey] = { totalScore: 0, count: 0 }
          }
          
          statsMap[groupKey].totalScore += Number(row.score_assiduidade || 0)
          statsMap[groupKey].count += 1
        })

        const sortedRanking = Object.keys(statsMap).map(groupKey => {
          const info = statsMap[groupKey]
          return {
            linha: groupKey,
            avgScore: info.totalScore / info.count,
            operatorCount: info.count
          }
        }).sort((a, b) => b.avgScore - a.avgScore)

        setRanking(sortedRanking)

      } catch (err) {
        console.error("Erro ao buscar Engajamento da Linha:", err)
      } finally {
        setLoading(false)
      }
    }

    // Limpa a expansão quando os filtros mudam
    setExpandedLine(null)
    setLineDetails({})
    fetchEngagementData()
  }, [filters])

  function getHealthClass(score: number) {
    if (score >= 100) return "modEng-healthExcellent"
    if (score >= 97.5) return "modEng-healthWarning"
    return "modEng-healthCritical"
  }

  // NOVO: Busca dados detalhados por posto ao clicar na linha
  async function handleToggleExpand(item: LineHealth) {
    // Se clicar na mesma linha, fecha
    if (expandedLine === item.linha) {
      setExpandedLine(null)
      return
    }

    // Se já temos os dados em cache, só abre
    if (lineDetails[item.linha]) {
      setExpandedLine(item.linha)
      return
    }

    // Busca os dados no Supabase
    setExpandedLine(item.linha)
    setLoadingDetails(true)

    try {
      // Extrai o nome real da linha (sem o turno entre parênteses)
      const linhaReal = item.linha.replace(/\s*\(.*\)$/, '')

      // Extrai o turno do groupKey se existir (ex: "TV 32 (Comercial)" -> "Comercial")
      const turnoMatch = item.linha.match(/\((.+)\)$/)
      const turnoFromKey = turnoMatch ? turnoMatch[1] : null

      // 1. Busca operadores da linha
      let opQuery = supabase
        .from('operators')
        .select('id, posto_atual')
        .eq('linha_atual', linhaReal)
        .eq('ativo', true)

      // Aplica filtro de turno: usa o do filtro global OU o extraído do groupKey
      if (filters.turno) {
        opQuery = opQuery.eq('turno', filters.turno)
      } else if (turnoFromKey) {
        opQuery = opQuery.eq('turno', turnoFromKey)
      }

      const { data: operators, error: opError } = await opQuery
      if (opError) throw opError

      if (!operators || operators.length === 0) {
        setLineDetails(prev => ({ ...prev, [item.linha]: [] }))
        setLoadingDetails(false)
        return
      }

      const operatorIds = operators.map(op => op.id)

      // 2. Busca analytics dos operadores
      const { data: analytics, error: anError } = await supabase
        .from('vw_operator_analytics')
        .select('operator_id, score_assiduidade, posto_atual')
        .in('operator_id', operatorIds)

      if (anError) throw anError

      // 3. Agrupa por posto_atual
      const postoMap: Record<string, { totalScore: number, count: number }> = {}

      ;(analytics || []).forEach(row => {
        const posto = row.posto_atual || "Sem Posto"
        if (!postoMap[posto]) {
          postoMap[posto] = { totalScore: 0, count: 0 }
        }
        postoMap[posto].totalScore += Number(row.score_assiduidade || 0)
        postoMap[posto].count += 1
      })

      // 4. Converte para array ordenado
      const postoDetails: PostoDetail[] = Object.keys(postoMap)
        .map(posto => ({
          posto,
          avgScore: postoMap[posto].totalScore / postoMap[posto].count,
          operatorCount: postoMap[posto].count
        }))
        .sort((a, b) => b.avgScore - a.avgScore)

      setLineDetails(prev => ({ ...prev, [item.linha]: postoDetails }))

    } catch (err) {
      console.error("Erro ao buscar detalhes por posto:", err)
      setLineDetails(prev => ({ ...prev, [item.linha]: [] }))
    } finally {
      setLoadingDetails(false)
    }
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
            <div 
              key={item.linha} 
              className={`modEng-lineItem ${expandedLine === item.linha ? 'modEng-lineItemExpanded' : ''}`}
              onClick={() => handleToggleExpand(item)}
            >
              
              <div className="modEng-lineInfo">
                <div className="modEng-lineName">
                  {/* Chevron de expansão */}
                  <span className={`modEng-chevron ${expandedLine === item.linha ? 'rotated' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </span>

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

              {/* PAINEL EXPANDIDO — Detalhamento por Posto */}
              {expandedLine === item.linha && (
                <div className="modEng-expandedDetail" onClick={(e) => e.stopPropagation()}>
                  {loadingDetails ? (
                    <div className="modEng-expandedLoading">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modEng-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Carregando postos...
                    </div>
                  ) : !lineDetails[item.linha] || lineDetails[item.linha].length === 0 ? (
                    <div className="modEng-expandedEmpty">
                      Sem dados de postos para esta linha.
                    </div>
                  ) : (
                    lineDetails[item.linha].map(posto => (
                      <div key={posto.posto} className="modEng-postoItem">
                        <div className="modEng-postoInfo">
                          <span className="modEng-postoName">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', opacity: 0.5 }}>
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                            {posto.posto}
                          </span>
                          <span className="modEng-postoScore">
                            {posto.avgScore.toFixed(1)}% <span>({posto.operatorCount} op.)</span>
                          </span>
                        </div>
                        <div className="modEng-postoBarTrack">
                          <div 
                            className={`modEng-postoBarFill ${getHealthClass(posto.avgScore)}`}
                            style={{ width: `${posto.avgScore}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  )
}