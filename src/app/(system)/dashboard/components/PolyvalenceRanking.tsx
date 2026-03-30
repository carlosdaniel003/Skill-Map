// src/app/(system)/dashboard/components/PolyvalenceRanking.tsx
"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom" // 🆕 Importação do Portal
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import "./PolyvalenceRanking.css"

interface JokerOperator {
  id: string
  nome: string
  matricula: string
  linha_atual: string
  posto_atual: string 
  highSkillsCount: number 
}

export default function PolyvalenceRanking() {
  const { filters } = useDashboardFilters()
  const [loading, setLoading] = useState(true)
  
  const [metrics, setMetrics] = useState({
    polyvalenceIndex: 0,
    totalOperators: 0,
    topJokers: [] as JokerOperator[]
  })

  // Estado para controlar o Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // 🆕 Estado para garantir que o Portal só renderize no lado do cliente
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadPolyvalenceData() {
      setLoading(true)
      try {
        // 1. Busca os operadores ativos
        let opQuery = supabase.from('operators').select('id, nome, matricula, linha_atual, posto_atual').eq('ativo', true)
        
        // Reage a TODOS os filtros da sidebar
        if (filters.linha) {
          opQuery = opQuery.eq('linha_atual', filters.linha)
        }
        if (filters.turno) {
          opQuery = opQuery.eq('turno', filters.turno)
        }
        if (filters.operatorId) {
          opQuery = opQuery.eq('id', filters.operatorId)
        }
        
        const { data: ops, error: opsError } = await opQuery
        if (opsError) throw opsError

        const totalOps = ops?.length || 0
        if (totalOps === 0) {
          setMetrics({ polyvalenceIndex: 0, totalOperators: 0, topJokers: [] })
          return
        }

        const opIds = ops.map(o => o.id)

        // 2. Busca APENAS as skills de nível 3 ou 4
        const { data: highSkills, error: skillsError } = await supabase
          .from('operator_skills')
          .select('operator_id, posto, skill_level')
          .in('operator_id', opIds)
          .gte('skill_level', 3)

        if (skillsError) throw skillsError

        const totalHighSkills = highSkills?.length || 0

        // 3. Calcula o Índice (ILUO)
        const index = totalOps > 0 ? (totalHighSkills / totalOps) : 0

        // 4. Monta o Ranking
        const opsSkillCount: Record<string, JokerOperator> = {}
        
        ops.forEach(op => {
          opsSkillCount[op.id] = {
            id: op.id,
            nome: op.nome,
            matricula: op.matricula,
            linha_atual: op.linha_atual,
            posto_atual: op.posto_atual,
            highSkillsCount: 0
          }
        })

        ;(highSkills || []).forEach(skill => {
          if (opsSkillCount[skill.operator_id]) {
            opsSkillCount[skill.operator_id].highSkillsCount += 1
          }
        })

        const leaderboard = Object.values(opsSkillCount)
          .filter(op => op.highSkillsCount > 0)
          .sort((a, b) => b.highSkillsCount - a.highSkillsCount)
          .slice(0, 5) // TOP 5

        setMetrics({
          polyvalenceIndex: Number(index.toFixed(1)),
          totalOperators: totalOps,
          topJokers: leaderboard
        })

      } catch (err) {
        console.error("Erro ao calcular Polivalência:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPolyvalenceData()
  }, [filters])

  let kpiStatusClass = "vulnerable"
  let kpiStatusText = "Vulnerável"
  
  if (metrics.polyvalenceIndex >= 3.0) {
    kpiStatusClass = "resilient"
    kpiStatusText = "Altamente Resiliente"
  } else if (metrics.polyvalenceIndex >= 1.5) {
    kpiStatusClass = "developing"
    kpiStatusText = "Em Desenvolvimento"
  }

  // Ícone base para o modal e botões
  const IconPoly = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 12 5.25 5 2.625-3M8 12l5.25 5 2.625-3M14 12l5.25 5 2.625-3"/></svg>
  const IconTrophy = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;

  return (
    <div className="modPoly-card animateFadeIn">
      <div className="modPoly-header">
        <div className="modPoly-iconWrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
            <path d="M10 2c1 .5 2 2 2 5"/>
          </svg>
        </div>
        <div className="modPoly-titleBlock">
          <h2 className="modPoly-title">Índice de Multifuncionalidade</h2>
          <p className="modPoly-subtitle">Média de postos com domínio Nível 3+ por colaborador.</p>
        </div>
      </div>

      {loading ? (
        <div className="modPoly-loadingState">
           <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modPoly-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      ) : (
        <>
          <div className="modPoly-kpiBox">
            <div className="modPoly-kpiInfo">
              <h4>Média da Equipe</h4>
              <div className="modPoly-kpiValue">
                {metrics.polyvalenceIndex} <span>skills/op.</span>
              </div>
            </div>
            <div className={`modPoly-kpiStatus ${kpiStatusClass}`}>
              {kpiStatusText}
            </div>
          </div>

          <div className="modPoly-ranking">
            <div className="modPoly-rankingHeader">
              <h4>
                {IconTrophy} 
                Top 5 Operadores Coringas
              </h4>
              {metrics.topJokers.length > 0 && (
                <button className="modPoly-viewAllBtn" onClick={() => setIsModalOpen(true)}>
                  Ver Detalhes
                </button>
              )}
            </div>
            
            {metrics.topJokers.length === 0 ? (
              <div className="modPoly-emptyRanking">
                Nenhum operador com domínio autônomo (Nível 3+) encontrado nos filtros atuais.
              </div>
            ) : (
              <div className="modPoly-rankingList">
                {metrics.topJokers.map((joker, index) => (
                  <div key={joker.id} className="modPoly-rankingItem" onClick={() => setIsModalOpen(true)}>
                    <div className={`modPoly-rankPos ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'normal'}`}>
                      {index + 1}º
                    </div>
                    <div className="modPoly-rankInfo">
                      <strong>{joker.nome}</strong>
                      <span>{joker.linha_atual || "Sem Linha"} • Mat: {joker.matricula}</span>
                    </div>
                    <div className="modPoly-rankScore" title="Quantidade de Skills Nível 3 ou 4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {joker.highSkillsCount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 🆕 MODAL RENDERIZADO NO PORTAL PARA SOBREPOR TODA A TELA */}
      {isModalOpen && mounted && createPortal(
        <div className="modPoly-modalOverlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modPoly-modalCard" 
            style={{ borderTopColor: '#3b82f6' }}
            onClick={(e) => e.stopPropagation()} 
          >
            
            <div className="modPoly-modalHeader">
              <div className="modPoly-modalTitle">
                <div className="modPoly-modalIcon">
                  {IconPoly}
                </div>
                <h3>Ranking Completo: Coringas</h3>
              </div>
              <button className="modPoly-closeBtn" onClick={() => setIsModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="modPoly-modalBody">
              <p className="modPoly-modalDesc">
                Os operadores abaixo são os mais versáteis do filtro selecionado, possuindo o maior número de postos dominados (Nível 3 ou 4).
              </p>

              <div className="modPoly-scrollableList">
                {metrics.topJokers.map((op, index) => (
                  <div key={op.id} className="modPoly-suggestionCard" style={{ borderColor: index === 0 ? '#3b82f6' : '#f0f0f0' }}>
                    <div className="modPoly-suggestionInfo">
                      <div className="modPoly-suggestionName">
                        <span style={{ color: '#3b82f6', fontWeight: 900, marginRight: '8px' }}>{index + 1}º</span>
                        {op.nome}
                        <span className="modPoly-suggestionLine">{op.linha_atual || "Sem Linha"}</span>
                      </div>
                      <div className="modPoly-suggestionMetrics">
                        <span>Posto Atual: {op.posto_atual || "Não Alocado"}</span>
                      </div>
                    </div>
                    
                    <div className="modPoly-suggestionAction">
                      <div className="modPoly-rankScore" style={{ background: '#eff6ff', color: '#3b82f6', marginBottom: '4px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {op.highSkillsCount} Skills
                      </div>
                      <span className="modPoly-matBadge">Mat: {op.matricula}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  )
}