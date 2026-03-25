// src/app/(system)/dashboard/components/TalentMatrix.tsx
"use client"

import { useEffect, useState } from "react"
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

  const [selectedQuadrant, setSelectedQuadrant] = useState<{
    title: string,
    action: string,
    colorClass: string,
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
        if (filters.operatorId) {
          query = query.eq('operator_id', filters.operatorId)
        }

        const { data, error } = await query
        if (error) throw error

        // 1. Agrupar por operador pegando a MAIOR habilidade dele
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

        // 2. Distribuir nos 4 Quadrantes
        const q = { pilares: [], estrelas: [], oportunidades: [], riscos: [] } as typeof quadrants

        opsMap.forEach(op => {
          const isAltaSkill = op.max_skill >= 3
          const isAltaAssid = op.score_assiduidade >= 90

          if (isAltaSkill && isAltaAssid) q.pilares.push(op)
          else if (isAltaSkill && !isAltaAssid) q.estrelas.push(op)
          else if (!isAltaSkill && isAltaAssid) q.oportunidades.push(op)
          else q.riscos.push(op)
        })

        // Ordena cada grupo do maior score para o menor
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

  return (
    <div className="talentMatrixCard">
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
            onClick={() => setSelectedQuadrant({ title: 'Oportunidades', action: 'Treinar e Promover', colorClass: 'q-oportunidades', operators: quadrants.oportunidades })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Oportunidades</h3>
                <p className="quadSubtitle">Baixa Skill + Alta Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.oportunidades.length}</div>
            </div>
            <span className="quadAction">🎯 Ação: Treinar</span>
          </div>

          {/* SUPERIOR DIREITO: Pilares */}
          <div 
            className="quadrantBox q-pilares"
            onClick={() => setSelectedQuadrant({ title: 'Pilares da Linha', action: 'Reconhecer e usar como instrutores', colorClass: 'q-pilares', operators: quadrants.pilares })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Pilares</h3>
                <p className="quadSubtitle">Alta Skill + Alta Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.pilares.length}</div>
            </div>
            <span className="quadAction">⭐ Ação: Manter/Promover</span>
          </div>

          {/* INFERIOR ESQUERDO: Risco */}
          <div 
            className="quadrantBox q-riscos"
            onClick={() => setSelectedQuadrant({ title: 'Baixo Fit / Risco', action: 'Acompanhar ou Desligar', colorClass: 'q-riscos', operators: quadrants.riscos })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Risco / Baixo Fit</h3>
                <p className="quadSubtitle">Baixa Skill + Baixa Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.riscos.length}</div>
            </div>
            <span className="quadAction">⚠️ Ação: Acompanhar</span>
          </div>

          {/* INFERIOR DIREITO: Estrelas Tóxicos */}
          <div 
            className="quadrantBox q-estrelas"
            onClick={() => setSelectedQuadrant({ title: 'Estrelas Tóxicos', action: 'Reduzir dependência / Advertir', colorClass: 'q-estrelas', operators: quadrants.estrelas })}
          >
            <div className="quadHeader">
              <div>
                <h3 className="quadTitle">Estrelas Tóxicos</h3>
                <p className="quadSubtitle">Alta Skill + Baixa Assiduidade</p>
              </div>
              <div className="quadCount">{quadrants.estrelas.length}</div>
            </div>
            <span className="quadAction">🚨 Ação: Advertir</span>
          </div>

        </div>
      )}

      {/* MODAL DE DETALHES */}
      {selectedQuadrant && (
        <div className="modalOverlay">
          <div className={`corporateModal ${selectedQuadrant.colorClass}`} style={{ borderTopWidth: '6px', borderTopStyle: 'solid' }}>
            <div className="modalHeader">
              <h3>{selectedQuadrant.title}</h3>
            </div>
            <div className="modalBody" style={{ marginBottom: '16px' }}>
              <p><strong>Recomendação:</strong> {selectedQuadrant.action}</p>
              
              <div className="matrixModalList" style={{ marginTop: '16px' }}>
                {selectedQuadrant.operators.length === 0 ? (
                  <p style={{ textAlign: 'center', margin: '20px 0' }}>Nenhum operador neste perfil.</p>
                ) : (
                  selectedQuadrant.operators.map(op => (
                    <div key={op.id} className="matrixOpItem">
                      <div className="matrixOpInfo">
                        <strong>{op.nome}</strong>
                        <span>{op.linha_atual || "Sem Linha"} • {op.posto_atual}</span>
                      </div>
                      <div className="matrixOpMetrics">
                        <span title="Maior Nível de Habilidade">Lvl {op.max_skill}</span>
                        <span className={`matrixMetric ${getMetricColor(op.score_assiduidade)}`} title="Score de Assiduidade">
                          {Math.round(op.score_assiduidade)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modalFooter">
              <button className="primaryButton" onClick={() => setSelectedQuadrant(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}