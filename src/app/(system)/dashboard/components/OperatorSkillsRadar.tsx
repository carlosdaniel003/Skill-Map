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
  Tooltip, // Importado para mostrar os dados ao passar o mouse
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
  
  // Novos estados para a cor dinâmica e a média
  const [radarColor, setRadarColor] = useState("#d40000")
  const [average, setAverage] = useState("0.00")

  useEffect(()=>{
    loadSkills()
  },[filters.operatorId])

  async function loadSkills(){
    if(!filters.operatorId){
      setSkills([])
      setOperatorName("")
      setRadarColor("#d40000")
      setAverage("0.00")
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

    const fetchedSkills = data || []
    setSkills(fetchedSkills)

    /* --- CÁLCULO DE CORES E MÉDIA --- */
    if (fetchedSkills.length > 0) {
      const total = fetchedSkills.reduce((acc, row) => acc + row.skill_level, 0)
      const max = fetchedSkills.length * 5
      const ratio = max > 0 ? (total / max) * 100 : 0
      
      // Média com duas casas decimais
      const avg = total / fetchedSkills.length
      setAverage(avg.toFixed(2))

      // Cores dos 5 Níveis Exatos
      let barColor = "#ef4444" // 1. Nunca Fez (Vermelho)
      if (ratio <= 20) barColor = "#ef4444"
      else if (ratio <= 40) barColor = "#f59e0b" // 2. Em Treinamento (Laranja)
      else if (ratio <= 60) barColor = "#3b82f6" // 3. Apto a Operar (Azul)
      else if (ratio <= 80) barColor = "#8b5cf6" // 4. Especialista (Roxo)
      else barColor = "#22c55e"                  // 5. Instrutor (Verde)

      setRadarColor(barColor)
    } else {
      setAverage("0.00")
      setRadarColor("#e0e0e0") // Cinza caso o operador não tenha skills
    }
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
    // A borda superior do card voltou a ser estática no CSS, removido o style={{ borderTopColor: radarColor }}
    <div className="corporateCard radarCard">
      
      <div className="radarHeader">
        <h3>Radar de Habilidades — <span style={{ color: radarColor }}>{operatorName}</span></h3>
        <p className="radarAverage">Média Geral: <strong style={{ color: radarColor }}>{average}</strong> <span className="maxAverage">/ 5.00</span></p>
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

            {/* Tooltip super elegante ao passar o mouse */}
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontWeight: 'bold', color: radarColor }}
              formatter={(value) => [`Nível ${value}`, "Habilidade"]}
            />

            <Radar
              name="Skill"
              dataKey="nivel"
              stroke={radarColor}
              strokeWidth={2}
              fill={radarColor}
              fillOpacity={0.4}
              animationDuration={600}
            />

          </RadarChart>
        </ResponsiveContainer>
      </div>

    </div>

  )

}