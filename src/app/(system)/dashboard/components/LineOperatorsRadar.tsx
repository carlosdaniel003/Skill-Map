// src/app/(system)/dashboard/components/LineOperatorsRadar.tsx
"use client"

import "./LineOperatorsRadar.css"
import { useEffect, useState } from "react"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend
} from "recharts"

import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

interface Operator{
  id:string
  nome:string
}

interface Skill{
  posto:string
  skill_level:number
  operator_id?:string
}

export default function LineOperatorsRadar(){

  const { filters } = useDashboardFilters()

  const [operators,setOperators] = useState<Operator[]>([])
  const [selectedOperator,setSelectedOperator] = useState<string>("")

  const [skills,setSkills] = useState<Skill[]>([])
  const [allSkills,setAllSkills] = useState<Skill[]>([])

  useEffect(()=>{
    if(filters.linha){
      loadOperators()
      loadAllSkills()
    }else{
      setOperators([])
      setSelectedOperator("")
      setSkills([])
      setAllSkills([])
    }
  },[filters.linha])

  useEffect(()=>{
    if(selectedOperator){
      loadSkills()
    } else {
      setSkills([])
    }
  },[selectedOperator])

  async function loadOperators(){
    const { data } = await supabase
      .from("operators")
      .select("id,nome")
      .eq("linha_atual",filters.linha)
      .eq("ativo",true)
      .order("nome")

    setOperators(data || [])
    setSelectedOperator("")
  }

  async function loadSkills(){
    const { data } = await supabase
      .from("operator_skills")
      .select("posto,skill_level")
      .eq("operator_id",selectedOperator)

    setSkills(data || [])
  }

  async function loadAllSkills(){
    const { data:ops } = await supabase
      .from("operators")
      .select("id")
      .eq("linha_atual",filters.linha)
      .eq("ativo",true)

    if(!ops) return

    const ids = ops.map(o => o.id)

    if(ids.length === 0){
      setAllSkills([])
      return
    }

    const { data } = await supabase
      .from("operator_skills")
      .select("posto,skill_level,operator_id")
      .in("operator_id",ids)

    setAllSkills(data || [])
  }

  /* ----------------------------- */
  /* MÉDIA DA LINHA                */
  /* ----------------------------- */
  function calculateAverageRadar(){
    const grouped:Record<string,number[]> = {}

    allSkills.forEach(skill => {
      if(!grouped[skill.posto]){
        grouped[skill.posto] = []
      }
      grouped[skill.posto].push(skill.skill_level)
    })

    return Object.keys(grouped).map(posto => {
      const values = grouped[posto]
      const avg = values.reduce((a,b)=>a+b,0) / values.length

      return {
        posto,
        media:Number(avg.toFixed(2))
      }
    })
  }

  const averageData = calculateAverageRadar()

  /* ----------------------------- */
  /* DADOS DO RADAR                */
  /* ----------------------------- */
  const radarData = averageData.map(avg => {
    const operatorSkill = skills.find(
      s => s.posto === avg.posto
    )

    return {
      posto:avg.posto,
      media:avg.media,
      operador:operatorSkill ? operatorSkill.skill_level : 0
    }
  })

  /* ----------------------------- */
  /* EMPTY STATE                   */
  /* ----------------------------- */
  if(!filters.linha){
    return(
      <div className="corporateCard lineRadarCard emptyRadarCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>Selecione uma linha de produção no filtro acima para cruzar a média da linha com o desempenho individual de cada operador.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* RENDER                        */
  /* ----------------------------- */
  return(

    <div className="corporateCard lineRadarCard">

      <div className="lineRadarHeader">
        <h3>Comparativo da Linha — <span>{filters.linha}</span></h3>
      </div>

      <div className="lineRadarBody">

        {/* LISTA DE OPERADORES */}
        <div className="operatorsListWrapper">
          <h4 className="listTitle">Selecione um operador:</h4>
          
          {operators.length > 0 ? (
            <div className="operatorsList">
              <button
                className={`operatorButton ${selectedOperator === "" ? "active" : ""}`}
                onClick={()=>setSelectedOperator("")}
              >
                Apenas Média da Linha
              </button>
              
              {operators.map(op=>(
                <button
                  key={op.id}
                  className={`operatorButton ${selectedOperator === op.id ? "active" : ""}`}
                  onClick={()=>setSelectedOperator(op.id)}
                  title={`Ver radar de ${op.nome}`}
                >
                  {op.nome}
                </button>
              ))}
            </div>
          ) : (
            <div className="noOperatorsMsg">
              Nenhum operador ativo alocado nesta linha.
            </div>
          )}
        </div>

        {/* GRÁFICO DE RADAR */}
        <div className="lineRadarChart">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#e0e0e0"/>
              
              <PolarAngleAxis
                dataKey="posto"
                tick={{fill: "#555555", fontSize: 12, fontWeight: 600}}
              />
              
              <PolarRadiusAxis
                domain={[0,5]}
                tickCount={6}
                tick={{fill: "#888888", fontSize: 11}}
              />

              {/* MÉDIA DA LINHA (Azul Corporativo) */}
              <Radar
                name="Média da Linha"
                dataKey="media"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="#3b82f6"
                fillOpacity={0.2}
                animationDuration={600}
              />

              {/* OPERADOR ESPECÍFICO (Vermelho Executivo) */}
              {selectedOperator && (
                <Radar
                  name="Desempenho do Operador"
                  dataKey="operador"
                  stroke="#d40000"
                  strokeWidth={2}
                  fill="#d40000"
                  fillOpacity={0.45}
                  animationDuration={600}
                />
              )}

              <Legend 
                wrapperStyle={{ paddingTop: "20px", fontSize: "13px", fontWeight: "500", color: "#555" }} 
              />

            </RadarChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>

  )

}