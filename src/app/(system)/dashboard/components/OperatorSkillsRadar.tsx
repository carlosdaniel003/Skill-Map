// src/app/(system)/dashboard/components/OperatorSkillsRadar.tsx
"use client"

import "./OperatorSkillsRadar.css"
import { useEffect, useState } from "react"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from "recharts"

import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

interface Skill{
  posto:string
  skill_level:number
}

export default function OperatorSkillsRadar(){

  const { filters } = useDashboardFilters()

  const [skills,setSkills] = useState<Skill[]>([])
  const [operatorName,setOperatorName] = useState("")

  useEffect(()=>{
    loadSkills()
  },[filters.operatorId])

  async function loadSkills(){
    if(!filters.operatorId){
      setSkills([])
      setOperatorName("")
      return
    }

    /* buscar operador */
    const { data:operator } = await supabase
      .from("operators")
      .select("nome")
      .eq("id",filters.operatorId)
      .single()

    if(operator){
      setOperatorName(operator.nome)
    }

    /* buscar skills */
    const { data,error } = await supabase
      .from("operator_skills")
      .select("posto,skill_level")
      .eq("operator_id",filters.operatorId)
      .order("posto")

    if(error){
      console.error(error)
      return
    }

    setSkills(data || [])
  }

  const data = skills.map(skill => ({
    posto: skill.posto,
    nivel: skill.skill_level
  }))

  /* ----------------------------- */
  /* ESTADO SEM OPERADOR (EMPTY)   */
  /* ----------------------------- */
  if(!filters.operatorId){
    return(
      <div className="corporateCard radarCard emptyRadarCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>Selecione um operador no filtro acima para visualizar o seu radar de competências individuais.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* RENDER DO GRÁFICO             */
  /* ----------------------------- */
  return(

    <div className="corporateCard radarCard">
      
      <div className="radarHeader">
        <h3>Radar de Habilidades — <span>{operatorName}</span></h3>
      </div>

      <div className="radarChartContainer">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            
            <PolarGrid stroke="#e0e0e0" />
            
            <PolarAngleAxis
              dataKey="posto"
              tick={{fill: "#555555", fontSize: 12, fontWeight: 600}}
            />

            <PolarRadiusAxis
              angle={30}
              domain={[0,5]}
              tick={{fill: "#888888"}}
            />

            <Radar
              name="Skill"
              dataKey="nivel"
              stroke="#d40000"
              strokeWidth={2}
              fill="#d40000"
              fillOpacity={0.4}
              animationDuration={600}
            />

          </RadarChart>
        </ResponsiveContainer>
      </div>

    </div>

  )

}