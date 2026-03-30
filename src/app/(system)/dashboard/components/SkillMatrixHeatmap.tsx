// src/app/(system)/dashboard/components/SkillMatrixHeatmap.tsx
"use client"

import "./SkillMatrixHeatmap.css"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

interface OperatorRow {
  id: string
  nome: string
  linha_atual?: string
  turno?: string
}

interface SkillRow {
  operator_id: string
  posto: string
  skill_level: number
}

export default function SkillMatrixHeatmap() {

  const { filters } = useDashboardFilters()

  const [operators, setOperators] = useState<OperatorRow[]>([])
  const [postos, setPostos] = useState<string[]>([])
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({})
  const [isLoading, setIsLoading] = useState(true)

  // 2. Orquestração de carregamento reagindo a TODOS os filtros
  const loadData = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // 1. Busca operadores com base nos filtros
      let opQuery = supabase.from("operators").select("id, nome, linha_atual, turno").eq("ativo", true).order("nome")
      
      if (filters.linha) opQuery = opQuery.eq("linha_atual", filters.linha)
      if (filters.turno) opQuery = opQuery.eq("turno", filters.turno)
      if (filters.operatorId) opQuery = opQuery.eq("id", filters.operatorId)

      const { data: ops, error: opsError } = await opQuery

      if (opsError || !ops || ops.length === 0) {
        setOperators([])
        setPostos([])
        setMatrix({})
        setIsLoading(false)
        return
      }

      const typedOps = ops as OperatorRow[]
      setOperators(typedOps)

      // Extrai os IDs da busca atual
      const opIds = typedOps.map(o => o.id)

      // 3. Chunking para evitar erro de limite de URL no Supabase ao usar .in() com muitos operadores
      const chunkSize = 150
      let allSkills: SkillRow[] = []

      for (let i = 0; i < opIds.length; i += chunkSize) {
        const chunk = opIds.slice(i, i + chunkSize)
        
        const { data: skillsChunk } = await supabase
          .from("operator_skills")
          .select("operator_id,posto,skill_level")
          .in("operator_id", chunk) 
          
        if (skillsChunk) {
          allSkills = [...allSkills, ...(skillsChunk as SkillRow[])]
        }
      }

      if (allSkills.length === 0) {
        setPostos([])
        setMatrix({})
        setIsLoading(false)
        return
      }

      // 4. Mapear Postos Únicos em ordem alfabética
      const uniquePostos = [...new Set(allSkills.map(s => s.posto))].sort()
      setPostos(uniquePostos)

      // 5. Montar matriz de mapeamento rápido
      const map: Record<string, Record<string, number>> = {}

      typedOps.forEach(op => {
        map[op.id] = {}
        uniquePostos.forEach(p => {
          map[op.id][p] = 0
        })
      })

      allSkills.forEach(s => {
        if (map[s.operator_id]) {
          map[s.operator_id][s.posto] = s.skill_level
        }
      })

      setMatrix(map)
    } catch (err) {
      console.error("Erro ao carregar Heatmap:", err)
    } finally {
      setIsLoading(false)
    }

  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getLevelClass(level: number) {
    if (level >= 1 && level <= 5) return `level-${level}`
    return "level-0"
  }

  // Título dinâmico
  let mapTitle = "Visão Global (Fábrica)"
  if (filters.linha) mapTitle = filters.linha
    if (filters.turno) {
    mapTitle += filters.linha ? ` (${filters.turno})` : `Visão Global (${filters.turno})`
  }

  return (
    <div className="modHeatmap-card animateFadeIn">

      <div className="modHeatmap-header">
        <div className="modHeatmap-titleWrap">
          <div className="modHeatmap-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <rect x="7" y="7" width="3" height="3"/>
              <rect x="14" y="7" width="3" height="3"/>
              <rect x="7" y="14" width="3" height="3"/>
              <rect x="14" y="14" width="3" height="3"/>
            </svg>
          </div>
          <div className="modHeatmap-titles">
            <h3>Skill Matrix — <span>{mapTitle}</span></h3>
            <p>Mapeamento visual do nível de habilidade por operador e posto.</p>
          </div>
        </div>
      </div>

      <div className="modHeatmap-tableContainer">
        {isLoading ? (
          <div className="modHeatmap-loadingArea">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modHeatmap-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
        ) : operators.length === 0 ? (
          <div className="modHeatmap-emptyArea">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <p>Nenhum operador ou habilidade mapeada para este filtro.</p>
          </div>
        ) : (
          <table className="modHeatmap-table">

            <thead>
              <tr>
                <th className="modHeatmap-operatorCol">Operador</th>
                {/* Mostrar a linha do operador se estiver na visão global */}
                {!filters.linha && <th className="modHeatmap-operatorCol">Linha</th>}
                {postos.map(p => (
                  <th key={p} title={p}>
                    <div className="modHeatmap-thContent">{p}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {operators.map(op => (
                <tr key={op.id}>
                  
                  <td className="modHeatmap-operatorCol fw-700">
                    {op.nome}
                  </td>

                  {!filters.linha && (
                    <td className="modHeatmap-operatorCol" style={{ color: '#888', fontSize: '11px', fontWeight: 600 }}>
                      {op.linha_atual || "Sem Linha"}
                    </td>
                  )}

                  {postos.map(p => {
                    const level = matrix[op.id]?.[p] ?? 0
                    
                    return (
                      <td key={p}>
                        <div className={`modHeatmap-levelSquare ${getLevelClass(level)}`} title={`${op.nome} - Posto: ${p} (Nível ${level})`}>
                          {level > 0 ? level : ""}
                        </div>
                      </td>
                    )
                  })}

                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

    </div>
  )
}