// src/app/(system)/dashboard/components/SkillMatrixHeatmap.tsx
"use client"

import "./SkillMatrixHeatmap.css"
import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

export default function SkillMatrixHeatmap(){

  const { filters } = useDashboardFilters()

  const [operators,setOperators] = useState<any[]>([])
  const [postos,setPostos] = useState<string[]>([])
  const [matrix,setMatrix] = useState<Record<string,Record<string,number>>>({})

  useEffect(()=>{
    loadData()
  },[filters.linha])

  async function loadData(){
    if(!filters.linha){
      setOperators([])
      setPostos([])
      setMatrix({})
      return
    }

    /* operadores da linha */
    const { data:ops } = await supabase
      .from("operators")
      .select("id,nome")
      .eq("linha_atual",filters.linha)
      .eq("ativo",true)
      .order("nome")

    if(!ops){
      setOperators([])
      return
    }

    setOperators(ops)

    /* skills */
    const { data:skills } = await supabase
      .from("operator_skills")
      .select("operator_id,posto,skill_level")

    if(!skills) return

    /* postos únicos */
    const uniquePostos = [
      ...new Set(skills.map(s=>s.posto))
    ]

    setPostos(uniquePostos)

    /* montar matriz */
    const map:Record<string,Record<string,number>> = {}

    ops.forEach(op=>{
      map[op.id] = {}
      uniquePostos.forEach(p=>{
        map[op.id][p] = 0
      })
    })

    skills.forEach((s:any)=>{
      if(map[s.operator_id]){
        map[s.operator_id][s.posto] = s.skill_level
      }
    })

    setMatrix(map)
  }

  // Retorna a classe CSS baseada no nível de habilidade
  function getLevelClass(level:number){
    if(level >= 1 && level <= 5) return `level-${level}`
    return "level-0"
  }

  /* ----------------------------- */
  /* ESTADO SEM LINHA (EMPTY STATE)*/
  /* ----------------------------- */
  if(!filters.linha){
    return(
      <div className="corporateCard heatmapCard emptyHeatmapCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M3 15h18"/>
          <path d="M9 3v18"/>
          <path d="M15 3v18"/>
        </svg>
        <p>Selecione um modelo de produção no filtro acima para visualizar o mapa de calor da Matriz de Habilidades.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* RENDER DA MATRIZ              */
  /* ----------------------------- */
  return(

    <div className="corporateCard heatmapCard">

      <div className="heatmapHeader">
        <h3>Skill Matrix — <span>{filters.linha}</span></h3>
      </div>

      <div className="heatmapTableContainer">
        <table className="heatmapTable">

          <thead>
            <tr>
              <th className="operatorCol">Operador</th>
              {postos.map(p=>(
                <th key={p}>{p}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {operators.map(op=>(
              <tr key={op.id}>
                
                <td className="operatorCol">
                  {op.nome}
                </td>

                {postos.map(p=>{
                  const level = matrix[op.id]?.[p] ?? 0
                  
                  return(
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