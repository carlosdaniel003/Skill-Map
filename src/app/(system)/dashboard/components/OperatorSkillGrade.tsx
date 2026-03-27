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
  const [color,setColor] = useState("#d40000")
  
  const [assiduidade, setAssiduidade] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [title, setTitle] = useState("Classificação Geral")

  useEffect(()=>{
    loadData()
  },[filters])

  async function loadData(){
    setIsLoading(true)

    try {
      let opQuery = supabase.from("operators").select("id, nome").eq("ativo", true)

      if (filters.linha) opQuery = opQuery.eq("linha_atual", filters.linha)
      if (filters.turno) opQuery = opQuery.eq("turno", filters.turno)
      if (filters.operatorId) opQuery = opQuery.eq("id", filters.operatorId)

      const { data: ops, error: opsError } = await opQuery

      if (opsError || !ops || ops.length === 0) {
        setTotalPoints(0)
        setMaxPoints(0)
        setRatio(0)
        setGrade("Sem Dados")
        setColor("#e0e0e0")
        setAssiduidade(0)
        setTitle("Sem Dados Disponíveis")
        return
      }

      const opIds = ops.map(o => o.id)

      if (filters.operatorId && ops.length === 1) {
        setTitle(`Classificação: ${ops[0].nome}`)
      } else {
        let t = "Média da Fábrica"
        if (filters.linha) t = `Média: ${filters.linha}`
        if (filters.turno) {
          t += ` (${filters.turno})`
        }
        setTitle(t)
      }

      const { data: skillsData, error: skillsError } = await supabase
        .from("operator_skills")
        .select("skill_level")
        .in("operator_id", opIds)

      if (skillsError) throw skillsError

      let sr = 0

      if (skillsData && skillsData.length > 0) {
        const total = skillsData.reduce((acc, row) => acc + row.skill_level, 0)
        const max = skillsData.length * 5

        sr = max > 0 ? Math.round((total / max) * 100) : 0

        setTotalPoints(total)
        setMaxPoints(max)
        setRatio(sr)
      } else {
        setTotalPoints(0)
        setMaxPoints(0)
        setRatio(0)
      }

      let gradeText = ""
      let barColor = "#d40000"

      if(sr <= 20){
        gradeText = "Iniciante / Nunca Fez"
        barColor = "#d40000"
      }else if(sr <= 40){
        gradeText = "Em Treinamento"
        barColor = "#f59e0b"
      }else if(sr <= 60){
        gradeText = "Apto a Operar"
        barColor = "#3b82f6"
      }else if(sr <= 80){
        gradeText = "Especialista"
        barColor = "#8b5cf6"
      }else{
        gradeText = "Instrutor / Mestre"
        barColor = "#22c55e"
      }

      setGrade(gradeText)
      setColor(barColor)

      let anQuery = supabase.from("vw_operator_analytics").select("score_assiduidade").in("operator_id", opIds)
      const { data: analyticsData } = await anQuery

      if (analyticsData && analyticsData.length > 0) {
        const sumAssid = analyticsData.reduce((acc, curr) => acc + Number(curr.score_assiduidade || 0), 0)
        setAssiduidade(Math.round(sumAssid / analyticsData.length))
      } else {
        setAssiduidade(100)
      }

    } catch (error) {
      console.error("Erro ao carregar Grade:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return(
    <div className="corporateCard gradeCard animateFadeIn">

      <div className="gradeHeader">
        <h3 title={title}>{title.length > 30 ? title.substring(0, 30) + "..." : title}</h3>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', height: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <div className="pageLoader" style={{ height: '40px', width: '40px' }} />
        </div>
      ) : (
        <>
          <div className="gradeStatsGrid">
            
            <div className="statBox">
              <span className="statLabel">Total Points</span>
              <span className="statValue">{totalPoints} <span style={{fontSize: 13, color: '#94a3b8', fontWeight: 600}}>/ {maxPoints}</span></span>
            </div>

            <div className="statBox">
              <span className="statLabel">Skill Ratio</span>
              <span className="statValue" style={{color: color}}>{ratio}%</span>
            </div>

            <div className="statBox">
              <span className="statLabel">Assiduidade</span>
              <span className="statValue" style={{ color: assiduidade >= 90 ? '#22c55e' : assiduidade >= 80 ? '#f59e0b' : '#d40000' }}>
                {assiduidade}%
              </span>
            </div>

          </div>

          <div className="classificationBox" style={{borderLeftColor: color}}>
            <span className="classLabel">Classificação:</span>
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
              <div className="goalMarker" style={{left: "80%"}} title="Meta de Especialista (80%)" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}