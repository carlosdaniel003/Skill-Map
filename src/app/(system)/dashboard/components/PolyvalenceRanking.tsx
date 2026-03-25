// src/app/(system)/dashboard/components/PolyvalenceRanking.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"
import "./PolyvalenceRanking.css"

interface JokerOperator {
  id: string
  nome: string
  matricula: string
  linha_atual: string
  highSkillsCount: number // Quantidade de skills Nível 3 ou 4
}

export default function PolyvalenceRanking() {
  const { filters } = useDashboardFilters()
  const [loading, setLoading] = useState(true)
  
  const [metrics, setMetrics] = useState({
    polyvalenceIndex: 0, // Média de Skills de alto nível por operador
    totalOperators: 0,
    topJokers: [] as JokerOperator[]
  })

  useEffect(() => {
    async function loadPolyvalenceData() {
      setLoading(true)
      try {
        // 1. Busca os operadores ativos (filtrando pela linha se necessário)
        let opQuery = supabase.from('operators').select('id, nome, matricula, linha_atual').eq('ativo', true)
        
        if (filters.linha) {
          opQuery = opQuery.eq('linha_atual', filters.linha)
        }
        
        const { data: ops, error: opsError } = await opQuery
        if (opsError) throw opsError

        const totalOps = ops?.length || 0
        if (totalOps === 0) {
          setMetrics({ polyvalenceIndex: 0, totalOperators: 0, topJokers: [] })
          return
        }

        const opIds = ops.map(o => o.id)

        // 2. Busca APENAS as skills de nível 3 ou 4 desses operadores
        const { data: highSkills, error: skillsError } = await supabase
          .from('operator_skills')
          .select('operator_id, posto, skill_level')
          .in('operator_id', opIds)
          .gte('skill_level', 3) // Nível de autonomia ou multiplicador

        if (skillsError) throw skillsError

        const totalHighSkills = highSkills?.length || 0

        // 3. Calcula o Índice de Polivalência da Linha (Média de skills altas por cabeça)
        const index = totalOps > 0 ? (totalHighSkills / totalOps) : 0

        // 4. Monta o Ranking (Contando quantas skills altas cada operador tem)
        const opsSkillCount: Record<string, JokerOperator> = {}
        
        // Inicializa o mapa com os dados básicos dos operadores
        ops.forEach(op => {
          opsSkillCount[op.id] = {
            id: op.id,
            nome: op.nome,
            matricula: op.matricula,
            linha_atual: op.linha_atual,
            highSkillsCount: 0
          }
        })

        // Soma os pontos
        ;(highSkills || []).forEach(skill => {
          if (opsSkillCount[skill.operator_id]) {
            opsSkillCount[skill.operator_id].highSkillsCount += 1
          }
        })

        // Converte pra Array, remove quem tem 0 skills de alto nível, e ordena do maior pro menor
        const leaderboard = Object.values(opsSkillCount)
          .filter(op => op.highSkillsCount > 0)
          .sort((a, b) => b.highSkillsCount - a.highSkillsCount)
          .slice(0, 5) // Pega apenas o TOP 5

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
  }, [filters.linha]) // Recalcula sempre que a linha mudar

  // Define a cor e o status do KPI Geral da linha
  let kpiStatusClass = "vulnerable"
  let kpiStatusText = "Vulnerável"
  
  if (metrics.polyvalenceIndex >= 3.0) {
    kpiStatusClass = "resilient"
    kpiStatusText = "Altamente Resiliente"
  } else if (metrics.polyvalenceIndex >= 1.5) {
    kpiStatusClass = "developing"
    kpiStatusText = "Em Desenvolvimento"
  }

  return (
    <div className="polyvalenceCard">
      <div className="polyHeader">
        <div>
          <h2 className="polyTitle">Índice de Polivalência (ILUO)</h2>
          <p className="polySubtitle">Média de postos com domínio Nível 3+ por colaborador.</p>
        </div>
      </div>

      {loading ? (
        <div className="pageLoader" style={{ height: '40px', width: '40px', margin: '40px auto' }} />
      ) : (
        <>
          <div className="polyKpiBox">
            <div className="polyKpiInfo">
              <h4>Média da Equipe</h4>
              <div className="polyKpiValue">
                {metrics.polyvalenceIndex} <span>skills/op.</span>
              </div>
            </div>
            <div className={`polyKpiStatus ${kpiStatusClass}`}>
              {kpiStatusText}
            </div>
          </div>

          <div className="polyRanking">
            <h4>🏆 Top 5 Operadores Coringas</h4>
            
            {metrics.topJokers.length === 0 ? (
              <div className="emptyRanking">
                Nenhum operador com domínio autônomo (Nível 3+) encontrado.
              </div>
            ) : (
              metrics.topJokers.map((joker, index) => (
                <div key={joker.id} className="rankingItem">
                  <div className={`rankPos ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                    {index + 1}º
                  </div>
                  <div className="rankInfo">
                    <strong>{joker.nome}</strong>
                    <span>{joker.linha_atual || "Sem Linha"} • Mat: {joker.matricula}</span>
                  </div>
                  <div className="rankScore" title="Quantidade de Skills Nível 3 ou 4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {joker.highSkillsCount}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}