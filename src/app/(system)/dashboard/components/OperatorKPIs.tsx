// src/app/(system)/dashboard/components/OperatorKPIs.tsx
"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import "./OperatorKPIs.css"

interface OperatorDetail {
  id: string
  nome: string
  matricula: string
  linha_atual: string
  posto_atual: string
}

interface ChartData {
  name: string
  quantidade: number
  color: string
  description: string
  icon: React.ReactNode 
  operadores: OperatorDetail[]
}

export default function OperatorKPIs() {
  const { filters } = useDashboardFilters()
  const [totalOperators, setTotalOperators] = useState(0)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedLevel, setSelectedLevel] = useState<ChartData | null>(null)

  useEffect(() => {
    loadKPIs()
  }, [filters])

  async function loadKPIs() {
    setLoading(true)
    try {
      // 1. Reage a todos os filtros da Sidebar
      let opQuery = supabase.from("operators").select("id, nome, matricula, linha_atual, posto_atual").eq("ativo", true)
      
      if (filters.linha) opQuery = opQuery.eq("linha_atual", filters.linha)
      if (filters.turno) opQuery = opQuery.eq("turno", filters.turno) 
      if (filters.operatorId) opQuery = opQuery.eq("id", filters.operatorId) 
      
      const { data: operators } = await opQuery
      const activeOps = operators || []
      setTotalOperators(activeOps.length)

      if (activeOps.length === 0) {
        setChartData([])
        return
      }

      const opsDataMap = new Map(activeOps.map(op => [op.id, op]))
      const opsIds = activeOps.map(op => op.id)

      const { data: skills } = await supabase
        .from("operator_skills")
        .select("operator_id, skill_level")
        .in("operator_id", opsIds)

      if (!skills || skills.length === 0) {
        setChartData([])
        return
      }

      const skillMap: Record<string, number[]> = {}
      skills.forEach((s: any) => {
        if (!skillMap[s.operator_id]) skillMap[s.operator_id] = []
        skillMap[s.operator_id].push(s.skill_level)
      })

      const list1: OperatorDetail[] = []
      const list2: OperatorDetail[] = []
      const list3: OperatorDetail[] = []
      const list4: OperatorDetail[] = []
      const list5: OperatorDetail[] = []

      Object.entries(skillMap).forEach(([opId, levels]) => {
        const totalSkills = levels.reduce((a,b) => a + b, 0)
        const max = levels.length * 5
        const ratio = max > 0 ? (totalSkills / max) * 100 : 0

        const opDetails = opsDataMap.get(opId)!

        if (ratio <= 20) list1.push(opDetails)
        else if (ratio <= 40) list2.push(opDetails)
        else if (ratio <= 60) list3.push(opDetails)
        else if (ratio <= 80) list4.push(opDetails)
        else list5.push(opDetails)
      })

      setChartData([
        { 
          name: "Iniciante", 
          quantidade: list1.length, 
          color: "#dc2626", 
          description: "0 a 20% do domínio",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
          operadores: list1 
        }, 
        { 
          name: "Treinamento", 
          quantidade: list2.length, 
          color: "#f59e0b", 
          description: "21 a 40% do domínio",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
          operadores: list2 
        },
        { 
          name: "Apto", 
          quantidade: list3.length, 
          color: "#3b82f6", 
          description: "41 a 60% do domínio",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
          operadores: list3 
        },
        { 
          name: "Especialista", 
          quantidade: list4.length, 
          color: "#8b5cf6", 
          description: "61 a 80% do domínio",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
          operadores: list4 
        },
        { 
          name: "Instrutor", 
          quantidade: list5.length, 
          color: "#22c55e", 
          description: "81 a 100% do domínio",
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
          operadores: list5 
        }
      ])

    } catch (error) {
      console.error("Erro ao carregar distribuição:", error)
    } finally {
      setLoading(false)
    }
  }

  // Título Dinâmico
  let subtitleText = "Visão Global (Fábrica Inteira)"
  if (filters.linha) subtitleText = `Linha: ${filters.linha}`
  if (filters.turno) subtitleText += ` | ${filters.turno}`

  return (
    <div className="kpiChartCard animateFadeIn">
      <div className="kpiChartHeader">
        <div>
          <h2 className="kpiChartTitle">Distribuição de Habilidades</h2>
          <p className="kpiChartSubtitle">
            {subtitleText}
          </p>
        </div>
        <span className="totalBadge">Total: {totalOperators} op.</span>
      </div>
      
      {loading ? (
        <div className="pageLoader" style={{ height: '30px', width: '30px', margin: 'auto' }} />
      ) : chartData.length === 0 ? (
        <div className="emptyState" style={{ margin: 'auto' }}>Nenhum dado encontrado.</div>
      ) : (
        <div className="kpiCardsGrid">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className={`skillLevelCard card-c-${item.color.replace('#', '')}`}
              onClick={() => {
                if (item.quantidade > 0) setSelectedLevel(item)
              }}
              style={{ opacity: item.quantidade === 0 ? 0.6 : 1 }}
            >
              <div className="cardIcon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="cardTitles">
                <h3>{item.name}</h3>
                <span className="cardDesc">{item.description}</span>
              </div>
              <div className="skillCount" style={{ color: item.color }}>
                {item.quantidade}
              </div>
              <div className="skillClickTip">
                {item.quantidade > 0 ? "Ver Nomes" : "Sem operadores"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALHES COM SCROLLBAR INTERNO */}
      {selectedLevel && (
        <div className="emergencyModalOverlay" onClick={() => setSelectedLevel(null)}>
          <div 
            className="emergencyModalCard" 
            style={{ borderTopColor: selectedLevel.color }}
            onClick={(e) => e.stopPropagation()} 
          >
            
            <div className="emergencyHeader">
              <div className="emergencyTitle">
                <div className="emergencyIcon" style={{ color: selectedLevel.color }}>
                  {selectedLevel.icon}
                </div>
                <h3>Operadores - Nível: {selectedLevel.name}</h3>
              </div>
              <button className="closeEmergencyBtn" onClick={() => setSelectedLevel(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="emergencyBody">
              <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                Total de <strong>{selectedLevel.quantidade}</strong> colaboradores agrupados nesta faixa média de domínio técnico ({selectedLevel.description}).
              </p>

              {/* 🆕 AQUI ESTÁ A LISTA QUE TERÁ A SCROLLBAR */}
              <div className="emergencyResults kpiScrollableList">
                {selectedLevel.operadores.map((op) => (
                  <div key={op.id} className="suggestionCard" style={{ cursor: 'default' }}>
                    <div className="suggestionInfo">
                      <div className="suggestionName">
                        {op.nome}
                        <span className="suggestionCurrentLine">{op.linha_atual || "Sem Linha"}</span>
                      </div>
                      <div className="suggestionMetrics">
                        <span className="metricBadge">Posto: {op.posto_atual || "Não Alocado"}</span>
                      </div>
                    </div>
                    
                    <div className="suggestionAction" style={{ justifyContent: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Matrícula</span>
                      <strong style={{ fontSize: '14px', color: '#111' }}>{op.matricula}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}