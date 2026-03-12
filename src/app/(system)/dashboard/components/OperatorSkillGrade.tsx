// src/app/(system)/dashboard/components/OperatorSkillGrade.tsx
"use client"

import "./OperatorSkillGrade.css"
import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

export default function OperatorSkillGrade(){

  const { filters } = useDashboardFilters()

  const [totalPoints,setTotalPoints] = useState(0)
  const [maxPoints,setMaxPoints] = useState(0)
  const [ratio,setRatio] = useState(0)
  const [grade,setGrade] = useState("")
  const [color,setColor] = useState("#d40000") // vermelho padrão

  useEffect(()=>{
    loadData()
  },[filters.operatorId])

  async function loadData(){
    if(!filters.operatorId){
      setTotalPoints(0)
      setMaxPoints(0)
      setRatio(0)
      setGrade("")
      return
    }

    const { data,error } = await supabase
      .from("operator_skills")
      .select("skill_level")
      .eq("operator_id",filters.operatorId)

    if(error){
      console.error(error)
      return
    }

    if(!data) return

    const total = data.reduce(
      (acc,row)=> acc + row.skill_level,
      0
    )

    const max = data.length * 5

    const sr = max > 0
      ? Math.round((total / max) * 100)
      : 0

    setTotalPoints(total)
    setMaxPoints(max)
    setRatio(sr)

    /* Classificação dinâmica em 5 níveis exatos (Intervalos de 20%) */
    let gradeText = ""
    let barColor = "#d40000"

    if(sr <= 20){
      gradeText = "Nunca Fez"
      barColor = "#ef4444" // Vermelho (Alerta)
    }else if(sr <= 40){
      gradeText = "Em Treinamento"
      barColor = "#f59e0b" // Laranja (Desenvolvimento)
    }else if(sr <= 60){
      gradeText = "Apto a Operar"
      barColor = "#3b82f6" // Azul (Padrão/Operacional)
    }else if(sr <= 80){
      gradeText = "Especialista"
      barColor = "#8b5cf6" // Roxo (Avançado)
    }else{
      gradeText = "Instrutor"
      barColor = "#22c55e" // Verde (Mestria)
    }

    setGrade(gradeText)
    setColor(barColor)
  }

  /* ----------------------------- */
  /* ESTADO SEM OPERADOR (EMPTY)   */
  /* ----------------------------- */
  if(!filters.operatorId){
    return(
      <div className="corporateCard gradeCard emptyGradeCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>Selecione um operador no filtro acima para visualizar o seu Skill Grade e nível de progresso.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* RENDERIZAÇÃO DO CARD ATIVO    */
  /* ----------------------------- */
  return(

    <div className="corporateCard gradeCard">

      <div className="gradeHeader">
        <h3>Classificação de Habilidade</h3>
      </div>

      <div className="gradeStatsGrid">
        
        <div className="statBox">
          <span className="statLabel">Total de Pontos</span>
          <span className="statValue">{totalPoints} <span style={{fontSize: 14, color: '#999'}}>de {maxPoints}</span></span>
        </div>

        <div className="statBox">
          <span className="statLabel">Skill Ratio</span>
          <span className="statValue" style={{color: color}}>{ratio}%</span>
        </div>

      </div>

      <div className="classificationBox" style={{borderLeftColor: color}}>
        <span className="classLabel">Nível Atual:</span>
        <strong className="classValue" style={{color: color}}>{grade}</strong>
      </div>

      <div className="progressSection">
        <div className="progressLabels">
          <span>Progresso de Habilidades</span>
          <span>Meta: Especialista (80%)</span>
        </div>
        
        <div className="progressBarContainer">
          <div
            className="progressBarFill"
            style={{
              width: `${ratio}%`,
              backgroundColor: color
            }}
          />
          {/* Marcador visual da meta de 80% */}
          <div className="goalMarker" style={{left: "80%"}} title="Meta de Especialista (80%)" />
        </div>
      </div>

    </div>

  )

}