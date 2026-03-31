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
        setColor("#a0a0a0")
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
        barColor = "#16a34a"
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
    <div className="modOpGrade-card animateFadeIn">

      <div className="modOpGrade-header">
        <div className="modOpGrade-iconWrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
            <path d="M10 2c1 .5 2 2 2 5"/>
          </svg>
        </div>
        <div className="modOpGrade-titleBlock">
          <h2 className="modOpGrade-title">Skill Ratio</h2>
          <p className="modOpGrade-subtitle" title={title}>
            {title.length > 40 ? title.substring(0, 40) + "..." : title}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="modOpGrade-loadingState">
           <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modOpGrade-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
      ) : (
        <>
          <div className="modOpGrade-statsGrid">
            
            <div className="modOpGrade-statBox">
              <span className="modOpGrade-statLabel">Total Points</span>
              <div className="modOpGrade-statValueWrap">
                <span className="modOpGrade-statValue">{totalPoints}</span>
                <span className="modOpGrade-statDivider">/ {maxPoints}</span>
              </div>
            </div>

            <div className="modOpGrade-statBox">
              <span className="modOpGrade-statLabel">Skill Ratio</span>
              <div className="modOpGrade-statValueWrap">
                <span className="modOpGrade-statValue" style={{color: color}}>{ratio}%</span>
              </div>
            </div>

            <div className="modOpGrade-statBox">
              <span className="modOpGrade-statLabel">Assiduidade</span>
              <div className="modOpGrade-statValueWrap">
                <span className="modOpGrade-statValue" style={{ color: assiduidade >= 100 ? '#16a34a' : assiduidade >= 97.5 ? '#f59e0b' : '#d40000' }}>
                  {assiduidade}%
                </span>
              </div>
            </div>

          </div>

          <div className="modOpGrade-classificationBox" style={{ borderLeftColor: color }}>
            <span className="modOpGrade-classLabel">Classificação:</span>
            <strong className="modOpGrade-classValue" style={{ color: color }}>{grade}</strong>
          </div>

          <div className="modOpGrade-progressSection">
            <div className="modOpGrade-progressLabels">
              <span>Progresso de Habilidades</span>
              <span>Meta: 80%</span>
            </div>
            
            <div className="modOpGrade-progressBarContainer">
              <div
                className="modOpGrade-progressBarFill"
                style={{
                  width: `${ratio}%`,
                  backgroundColor: color
                }}
              />
              <div className="modOpGrade-goalMarker" style={{left: "80%"}} title="Meta de Especialista (80%)" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}