// src/app/(system)/dashboard/components/TalentMatrix.tsx
"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom" // 🆕 IMPORT DO PORTAL
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import "./TalentMatrix.css"

interface OperatorMatrixData {
  id: string
  nome: string
  matricula: string
  posto_atual: string
  linha_atual: string
  turno: string
  high_skill_count: number 
  score_assiduidade: number
}

export default function TalentMatrix() {
  const { filters } = useDashboardFilters()
  const [loading, setLoading] = useState(true)
  
  const [quadrants, setQuadrants] = useState({
    pilares: [] as OperatorMatrixData[],
    estrelas: [] as OperatorMatrixData[],
    oportunidades: [] as OperatorMatrixData[],
    riscos: [] as OperatorMatrixData[]
  })

  const [selectedQuadrant, setSelectedQuadrant] = useState<{
    title: string
    action: string
    colorClass: string
    colorHex: string
    icon: React.ReactNode
    operators: OperatorMatrixData[]
  } | null>(null)

  // 🆕 ESTADO PARA GARANTIR HIDRATAÇÃO CORRETA NO NEXT.JS
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadMatrixData() {
      setLoading(true)
      try {
        let query = supabase.from('vw_operator_360_context').select('*')
        
        if (filters.linha) {
          query = query.eq('linha_atual', filters.linha)
        }
        if (filters.turno) {
          query = query.eq('turno', filters.turno)
        }
        if (filters.operatorId) {
          query = query.eq('operator_id', filters.operatorId)
        }

        const { data: contextData, error: contextError } = await query
        if (contextError) throw contextError

        if (!contextData || contextData.length === 0) {
          setQuadrants({ pilares: [], estrelas: [], oportunidades: [], riscos: [] })
          setLoading(false)
          return
        }

        const opsMap = new Map<string, OperatorMatrixData>()
        const skillCountMap: Record<string, number> = {}

        contextData.forEach(row => {
          if (!opsMap.has(row.operator_id)) {
            opsMap.set(row.operator_id, {
              id: row.operator_id,
              nome: row.nome,
              matricula: row.matricula,
              posto_atual: row.posto_atual,
              linha_atual: row.linha_atual,
              turno: row.turno || "Sem Turno",
              high_skill_count: 0,
              score_assiduidade: Number(row.score_assiduidade || 0)
            })
          }

          if (Number(row.skill_level || 0) >= 3) {
            skillCountMap[row.operator_id] = (skillCountMap[row.operator_id] || 0) + 1
          }
        })

        const opsWithSkillCount: OperatorMatrixData[] = Array.from(opsMap.values()).map(op => ({
          ...op,
          high_skill_count: skillCountMap[op.id] || 0
        }))

        const q = { pilares: [], estrelas: [], oportunidades: [], riscos: [] } as typeof quadrants

        opsWithSkillCount.forEach(op => {
          const isAltaSkill = op.high_skill_count >= 2
          const isAltaAssid = op.score_assiduidade >= 100

          if (isAltaSkill && isAltaAssid) {
            q.pilares.push(op)
          } else if (isAltaSkill && !isAltaAssid) {
            q.estrelas.push(op)
          } else if (!isAltaSkill && isAltaAssid) {
            q.oportunidades.push(op)
          } else {
            q.riscos.push(op)
          }
        })

        const sortByScore = (a: OperatorMatrixData, b: OperatorMatrixData) => 
          b.score_assiduidade - a.score_assiduidade

        q.pilares.sort(sortByScore)
        q.estrelas.sort(sortByScore)
        q.oportunidades.sort(sortByScore)
        q.riscos.sort(sortByScore)

        setQuadrants(q)

      } catch (error) {
        console.error("Erro ao carregar Matriz de Talentos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatrixData()
  }, [filters])

  const formatTurno = (turno: string) => turno || "Sem Turno"

  const IconOportunidades = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/></svg>
  const IconPilares = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  const IconRisco = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  const IconToxicos = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

  const IconSkillBadge = <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  const IconClockBadge = <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

  return (
    <div className="modTalent-card animateFadeIn">
      
      <div className="modTalent-header">
        <div className="modTalent-iconWrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
          </svg>
        </div>
        <div className="modTalent-titleBlock">
          <h2 className="modTalent-title">Matriz Talento vs. Confiabilidade</h2>
          <p className="modTalent-subtitle">Identifique em quem investir para resolver produtividade a médio prazo.</p>
        </div>
      </div>

      {loading ? (
        <div className="modTalent-loadingState">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modTalent-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      ) : (
        <div className="modTalent-grid">
          
          {/* SUPERIOR ESQUERDO: Oportunidades */}
          <div 
            className="modTalent-quadrant q-oportunidades"
            onClick={() => setSelectedQuadrant({ 
              title: 'Oportunidades', 
              action: 'Treinar e Desenvolver', 
              colorClass: 'q-oportunidades', 
              colorHex: '#f59e0b', 
              icon: IconOportunidades, 
              operators: quadrants.oportunidades 
            })}
          >
            <div className="modTalent-quadHeader">
              <div>
                <h3 className="modTalent-quadTitle">Oportunidades</h3>
                <p className="modTalent-quadSubtitle">Baixa Skill + Alta Assiduidade</p>
              </div>
              <div className="modTalent-quadCount">{quadrants.oportunidades.length}</div>
            </div>
            <span className="modTalent-quadAction">
              <span className="actionIcon">{IconOportunidades}</span>
              Ação: Treinar
            </span>
          </div>

          {/* SUPERIOR DIREITO: Pilares */}
          <div 
            className="modTalent-quadrant q-pilares"
            onClick={() => setSelectedQuadrant({ 
              title: 'Pilares da Linha', 
              action: 'Reconhecer e usar como instrutores', 
              colorClass: 'q-pilares', 
              colorHex: '#16a34a', 
              icon: IconPilares, 
              operators: quadrants.pilares 
            })}
          >
            <div className="modTalent-quadHeader">
              <div>
                <h3 className="modTalent-quadTitle">Pilares</h3>
                <p className="modTalent-quadSubtitle">Alta Skill + Alta Assiduidade</p>
              </div>
              <div className="modTalent-quadCount">{quadrants.pilares.length}</div>
            </div>
            <span className="modTalent-quadAction">
              <span className="actionIcon">{IconPilares}</span>
              Ação: Promover
            </span>
          </div>

          {/* INFERIOR ESQUERDO: Risco */}
          <div 
            className="modTalent-quadrant q-riscos"
            onClick={() => setSelectedQuadrant({ 
              title: 'Baixo Fit / Risco', 
              action: 'Acompanhar ou Realocação', 
              colorClass: 'q-riscos', 
              colorHex: '#8b5cf6', 
              icon: IconRisco, 
              operators: quadrants.riscos 
            })}
          >
            <div className="modTalent-quadHeader">
              <div>
                <h3 className="modTalent-quadTitle">Risco / Baixo Fit</h3>
                <p className="modTalent-quadSubtitle">Baixa Skill + Baixa Assiduidade</p>
              </div>
              <div className="modTalent-quadCount">{quadrants.riscos.length}</div>
            </div>
            <span className="modTalent-quadAction">
              <span className="actionIcon">{IconRisco}</span>
              Ação: Acompanhar
            </span>
          </div>

          {/* INFERIOR DIREITO: Talento Inconsistente */}
          <div 
            className="modTalent-quadrant q-estrelas"
            onClick={() => setSelectedQuadrant({ 
              title: 'Talento Inconsistente', 
              action: 'Reduzir dependência / Realocar', 
              colorClass: 'q-estrelas', 
              colorHex: '#d40000', 
              icon: IconToxicos, 
              operators: quadrants.estrelas 
            })}
          >
            <div className="modTalent-quadHeader">
              <div>
                <h3 className="modTalent-quadTitle">Talento Inconsistente</h3>
                <p className="modTalent-quadSubtitle">Alta Skill + Baixa Assiduidade</p>
              </div>
              <div className="modTalent-quadCount">{quadrants.estrelas.length}</div>
            </div>
            <span className="modTalent-quadAction">
              <span className="actionIcon">{IconToxicos}</span>
              Ação: Reduzir dependência
            </span>
          </div>

        </div>
      )}

      {/* 🆕 MODAL RENDERIZADO NO PORTAL PARA SOBREPOR TODA A TELA */}
      {selectedQuadrant && mounted && createPortal(
        <div className="modTalent-modalOverlay" onClick={() => setSelectedQuadrant(null)}>
          <div 
            className="modTalent-modalCard" 
            style={{ borderTopColor: selectedQuadrant.colorHex }}
            onClick={(e) => e.stopPropagation()} 
          >
            
            <div className="modTalent-modalHeader">
              <div className="modTalent-modalTitle">
                <div className="modTalent-modalIcon" style={{ color: selectedQuadrant.colorHex, background: `${selectedQuadrant.colorHex}15` }}>
                  {selectedQuadrant.icon}
                </div>
                <h3>Perfil: {selectedQuadrant.title}</h3>
              </div>
              <button className="modTalent-closeBtn" onClick={() => setSelectedQuadrant(null)} title="Fechar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="modTalent-modalBody">
              <p className="modTalent-modalDesc">
                Total de <strong>{selectedQuadrant.operators.length}</strong> colaboradores encontrados. 
                <br/>Ação recomendada Produção: <strong style={{color: selectedQuadrant.colorHex}}>{selectedQuadrant.action}</strong>.
              </p>

              <div className="modTalent-scrollableList">
                {selectedQuadrant.operators.length === 0 ? (
                  <div className="modTalent-emptyState">
                    Nenhum operador com este perfil no filtro atual.
                  </div>
                ) : (
                  selectedQuadrant.operators.map((op, index) => (
                    <div key={op.id} className="modTalent-suggestionCard">
                      
                      {/* RANKING NÚMERO */}
                      <div className="modTalent-rankNumber">
                        {index + 1}º
                      </div>

                      {/* INFO PRINCIPAL */}
                      <div className="modTalent-suggestionInfo">
                        <div className="modTalent-suggestionName">
                          {op.nome}
                        </div>
                        <div className="modTalent-suggestionSub">
                          Mat: {op.matricula} • {formatTurno(op.turno)} • {op.linha_atual || "Sem Linha"}
                        </div>
                        <div className="modTalent-operatorTip">
                          Posto atual: {op.posto_atual || "Não alocado"}
                        </div>
                      </div>

                      {/* BADGES */}
                      <div className="modTalent-suggestionBadges">
                        <span 
                          className="modTalent-badge"
                          title="Quantidade de postos com domínio"
                          style={{ 
                            background: op.high_skill_count >= 3 ? '#16a34a' : op.high_skill_count >= 2 ? '#3b82f6' : '#f59e0b'
                          }}
                        >
                          {IconSkillBadge}
                          {op.high_skill_count} Postos
                        </span>
                        
                        <span 
                          className="modTalent-badge"
                          title="Score de Assiduidade (%)"
                          style={{ 
                            background: op.score_assiduidade >= 100 ? '#16a34a' : op.score_assiduidade >= 97.5 ? '#f59e0b' : '#d40000'
                          }}
                        >
                          {IconClockBadge}
                          {Math.round(op.score_assiduidade)}%
                        </span>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  )
}