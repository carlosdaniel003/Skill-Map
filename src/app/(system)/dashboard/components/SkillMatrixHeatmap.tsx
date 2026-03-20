// src/app/(system)/dashboard/components/SkillMatrixHeatmap.tsx
"use client"

import "./SkillMatrixHeatmap.css"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

// 1. Tipagem forte para os modelos locais
interface OperatorRow {
  id: string
  nome: string
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

  // 2. Orquestração de carregamento isolada e segura com useCallback
  const loadData = useCallback(async () => {
    
    // RESET EXPLÍCITO: Cenário sem linha
    if (!filters.linha) {
      setOperators([])
      setPostos([])
      setMatrix({})
      return
    }

    // Busca operadores da linha
    const { data: ops } = await supabase
      .from("operators")
      .select("id,nome")
      .eq("linha_atual", filters.linha)
      .eq("ativo", true)
      .order("nome")

    // RESET EXPLÍCITO: Cenário de linha sem operadores ativos
    if (!ops || ops.length === 0) {
      setOperators([])
      setPostos([])
      setMatrix({})
      return
    }

    const typedOps = ops as OperatorRow[]
    setOperators(typedOps)

    // Extrai apenas os IDs da linha atual
    const opIds = typedOps.map(o => o.id)

    // 3. Chunking para evitar erro de limite de URL no Supabase ao usar .in()
    const chunkSize = 150
    let allSkills: SkillRow[] = []

    for (let i = 0; i < opIds.length; i += chunkSize) {
      const chunk = opIds.slice(i, i + chunkSize)
      
      const { data: skillsChunk } = await supabase
        .from("operator_skills")
        .select("operator_id,posto,skill_level")
        .in("operator_id", chunk) // BUSCA ESTRITA: Apenas skills da equipe desta linha
        
      if (skillsChunk) {
        allSkills = [...allSkills, ...(skillsChunk as SkillRow[])]
      }
    }

    // RESET EXPLÍCITO: Operadores estão na linha, mas nenhum tem skill lançada ainda
    if (allSkills.length === 0) {
      setPostos([])
      setMatrix({})
      return
    }

    // 4. Mapear Postos Únicos apenas baseados nas skills filtradas (Evita postos fantasmas)
    // O .sort() deixa as colunas em ordem alfabética para melhor leitura
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

  }, [filters.linha])

  // Dependência limpa usando a função memoizada
  useEffect(() => {
    loadData()
  }, [loadData])

  // Retorna a classe CSS baseada no nível de habilidade
  function getLevelClass(level: number) {
    if (level >= 1 && level <= 5) return `level-${level}`
    return "level-0"
  }

  /* ----------------------------- */
  /* ESTADO SEM LINHA (EMPTY STATE)*/
  /* ----------------------------- */
  if (!filters.linha) {
    return (
      <div className="corporateCard heatmapCard emptyHeatmapCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
        <p>Selecione um modelo de produção no filtro acima para visualizar o mapa de calor da Matriz de Habilidades.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* RENDER DA MATRIZ              */
  /* ----------------------------- */
  return (
    <div className="corporateCard heatmapCard">

      <div className="heatmapHeader">
        <h3>Skill Matrix — <span>{filters.linha}</span></h3>
      </div>

      <div className="heatmapTableContainer">
        <table className="heatmapTable">

          <thead>
            <tr>
              <th className="operatorCol">Operador</th>
              {postos.map(p => (
                <th key={p}>{p}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {operators.map(op => (
              <tr key={op.id}>
                
                <td className="operatorCol">
                  {op.nome}
                </td>

                {postos.map(p => {
                  const level = matrix[op.id]?.[p] ?? 0
                  
                  return (
                    <td key={p}>
                      <div className={`levelSquare ${getLevelClass(level)}`} title={`Nível ${level}`}>
                        {level > 0 ? level : ""}
                      </div>
                    </td>
                  )
                })}

              </tr>
            ))}
            
            {operators.length === 0 && (
              <tr>
                <td colSpan={postos.length + 1} className="emptyState">
                  Nenhum operador ativo alocado neste modelo.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>
  )

}