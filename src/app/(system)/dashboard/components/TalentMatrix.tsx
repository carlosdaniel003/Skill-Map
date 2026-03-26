// src/app/(system)/dashboard/components/TalentMatrix.tsx
"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import "./TalentMatrix.css"

interface OperatorMatrixData {
  id: string
  nome: string
  matricula: string
  posto_atual: string
  linha_atual: string
  max_skill: number
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

  // Estado do Modal
  const [selectedQuadrant, setSelectedQuadrant] = useState<{
    title: string,
    action: string,
    colorClass: string,
    colorHex: string,
    icon: React.ReactNode,
    operators: OperatorMatrixData[]
  } | null>(null)

  useEffect(() => {
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

        const { data, error } = await query
        if (error) throw error

        const opsMap = new Map<string, OperatorMatrixData>()
        
        ;(data || []).forEach(row => {
          if (!opsMap.has(row.operator_id)) {
            opsMap.set(row.operator_id, {
              id: row.operator_id,
              nome: row.nome,
              matricula: row.matricula,
              posto_atual: row.posto_atual,
              linha_atual: row.linha_atual,
              score_assiduidade: Number(row.score_assiduidade || 100),
              max_skill: Number(row.skill_level || 1)
            })
          } else {
            const op = opsMap.get(row.operator_id)!
            if (Number(row.skill_level) > op.max_skill) {
              op.max_skill = Number(row.skill_level)
            }
          }
        })

        const q = { pilares: [], estrelas: [], oportunidades: [], riscos: [] } as typeof quadrants

        opsMap.forEach(op => {
          const isAltaSkill = op.max_skill >= 3
          const isAltaAssid = op.score_assiduidade >= 90

          if (isAltaSkill && isAltaAssid) q.pilares.push(op)
          else if (isAltaSkill && !isAltaAssid) q.estrelas.push(op)
          else if (!isAltaSkill && isAltaAssid) q.oportunidades.push(op)
          else q.riscos.push(op)
        })

        const sortByScore = (a: OperatorMatrixData, b: OperatorMatrixData) => b.score_assiduidade - a.score_assiduidade
        q.pilares.sort(sortByScore)
        q.estrelas.sort(sortByScore)
        q.oportunidades.sort(sortByScore)
        q.riscos.sort(sortByScore)

        setQuadrants(q)

      } catch (error) {
        console.error("Erro ao carregar Matriz de Talentos", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatrixData()
  }, [filters])

  const getMetricColor = (score: number) => {
    if (score >= 90) return 'green'
    if (score >= 70) return 'yellow'
    return 'red'
  }

  // Ícones SVG para cada quadrante
  const IconOportunidades = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/></svg>;
  const IconPilares = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  const IconRisco = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  const IconToxicos = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

  return (
    <div className="talentMatrixCard animateFadeIn">
      <div className="matrixHeader">
        <h2>Matriz Talento vs. Confiabilidade</h2>
        <p>Direcione o investimento em treinamento e ações disciplinares da fábrica.</p>
      </div>

      {loading ? (
        <div className="pageLoader" style={{ height: '40px', width: '40px', margin: '40px auto' }} />
      ) : (
        <div className="matrixGrid">
          
          {/* SUPERIOR ESQUERDO: Oportunidades */}
          <div 
            className="quadrantBox q-oportunidades"
            onClick={() => setSelectedQuadrant({ title: 'Oportunidades', action: 'Treinar e Promover', colorClass: 'q-oportunidades', colorHex: '#f59e0b', icon: IconOportunidades, operators: quadrants.oportunidades })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Oportunidades</h3>
                <p className="quadSubtitle">Baixa Skill + Alta Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.oportunidades.length}</div>
            </div>
            <span className="quadAction">
              <span style={{ marginRight: '6px' }}>{IconOportunidades}</span>
              Ação: Treinar
            </span>
          </div>

          {/* SUPERIOR DIREITO: Pilares */}
          <div 
            className="quadrantBox q-pilares"
            onClick={() => setSelectedQuadrant({ title: 'Pilares da Linha', action: 'Reconhecer e usar como instrutores', colorClass: 'q-pilares', colorHex: '#22c55e', icon: IconPilares, operators: quadrants.pilares })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Pilares</h3>
                <p className="quadSubtitle">Alta Skill + Alta Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.pilares.length}</div>
            </div>
            <span className="quadAction">
              <span style={{ marginRight: '6px' }}>{IconPilares}</span>
              Ação: Manter/Promover
            </span>
          </div>

          {/* INFERIOR ESQUERDO: Risco */}
          <div 
            className="quadrantBox q-riscos"
            onClick={() => setSelectedQuadrant({ title: 'Baixo Fit / Risco', action: 'Acompanhar ou Desligar', colorClass: 'q-riscos', colorHex: '#8b5cf6', icon: IconRisco, operators: quadrants.riscos })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Risco / Baixo Fit</h3>
                <p className="quadSubtitle">Baixa Skill + Baixa Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.riscos.length}</div>
            </div>
            <span className="quadAction">
              <span style={{ marginRight: '6px' }}>{IconRisco}</span>
              Ação: Acompanhar
            </span>
          </div>

          {/* INFERIOR DIREITO: Estrelas Tóxicos */}
          <div 
            className="quadrantBox q-estrelas"
            onClick={() => setSelectedQuadrant({ title: 'Estrelas Tóxicos', action: 'Reduzir dependência / Advertir', colorClass: 'q-estrelas', colorHex: '#d40000', icon: IconToxicos, operators: quadrants.estrelas })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Estrelas Tóxicos</h3>
                <p className="quadSubtitle">Alta Skill + Baixa Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.estrelas.length}</div>
            </div>
            <span className="quadAction">
              <span style={{ marginRight: '6px' }}>{IconToxicos}</span>
              Ação: Advertir
            </span>
          </div>

        </div>
      )}

      {/* MODAL DE DETALHES (USANDO O PADRÃO EMERGENCY) */}
      {selectedQuadrant && (
        <div className="emergencyModalOverlay" onClick={() => setSelectedQuadrant(null)}>
          <div 
            className="emergencyModalCard" 
            style={{ borderTopColor: selectedQuadrant.colorHex }}
            onClick={(e) => e.stopPropagation()} 
          >
            
            <div className="emergencyHeader">
              <div className="emergencyTitle">
                <div className="emergencyIcon" style={{ color: selectedQuadrant.colorHex }}>
                  {selectedQuadrant.icon}
                </div>
                <h3>Perfil: {selectedQuadrant.title}</h3>
              </div>
              <button className="closeEmergencyBtn" onClick={() => setSelectedQuadrant(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="emergencyBody">
              <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
                Total de <strong>{selectedQuadrant.operators.length}</strong> colaboradores com perfil de <strong>{selectedQuadrant.action}</strong>.
              </p>

              <div className="emergencyResults">
                {selectedQuadrant.operators.length === 0 ? (
                  <div className="emptyState">Nenhum operador neste perfil.</div>
                ) : (
                  selectedQuadrant.operators.map((op) => (
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
                      
                      <div className="suggestionAction" style={{ alignItems: 'flex-end' }}>
                        <div className="matrixOpMetrics" style={{ marginBottom: '4px' }}>
                          <span title="Maior Nível de Habilidade" style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Lvl {op.max_skill}</span>
                          <span className={`matrixMetric ${getMetricColor(op.score_assiduidade)}`} title="Score de Assiduidade">
                            {Math.round(op.score_assiduidade)}%
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#666' }}>Mat: {op.matricula}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}