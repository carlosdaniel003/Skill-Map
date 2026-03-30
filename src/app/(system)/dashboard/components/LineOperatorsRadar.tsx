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
  Legend,
  Tooltip
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

  const [isLoading, setIsLoading] = useState(false)

  // 1. Carrega os operadores e as skills base (Global ou Linha/Turno)
  useEffect(()=>{
    loadBaseData()
  },[filters])

  // 2. Carrega as skills individuais quando um operador é selecionado
  useEffect(()=>{
    if(selectedOperator){
      loadOperatorSkills()
    } else {
      setSkills([])
    }
  },[selectedOperator])

  async function loadBaseData(){
    setIsLoading(true)
    try {
      // 1. Busca os operadores baseados nos filtros gerais
      let opQuery = supabase.from("operators").select("id,nome").eq("ativo",true).order("nome")
      
      if(filters.linha) opQuery = opQuery.eq("linha_atual", filters.linha)
      if(filters.turno) opQuery = opQuery.eq("turno", filters.turno)
      if(filters.operatorId) opQuery = opQuery.eq("id", filters.operatorId)

      const { data: ops, error: opsError } = await opQuery

      if (opsError || !ops || ops.length === 0) {
        setOperators([])
        setAllSkills([])
        setSelectedOperator("")
        return
      }

      setOperators(ops)
      
      if (filters.operatorId && ops.length === 1) {
        setSelectedOperator(filters.operatorId)
      } else if (!filters.operatorId) {
        setSelectedOperator("") 
      }

      const ids = ops.map(o => o.id)

      const { data: skillsData } = await supabase
        .from("operator_skills")
        .select("posto,skill_level,operator_id")
        .in("operator_id",ids)

      setAllSkills(skillsData || [])

    } catch (err) {
      console.error("Erro ao carregar dados do Radar de Operadores:", err)
      setOperators([])
      setAllSkills([])
    } finally {
      setIsLoading(false)
    }
  }

  async function loadOperatorSkills(){
    const { data } = await supabase
      .from("operator_skills")
      .select("posto,skill_level")
      .eq("operator_id",selectedOperator)

    setSkills(data || [])
  }

  function calculateAverageRadar(){
    const grouped:Record<string,number[]> = {}

    allSkills.forEach(skill => {
      const posto = skill.posto
      if(!grouped[posto]) grouped[posto] = []
      grouped[posto].push(skill.skill_level)
    })

    let results = Object.keys(grouped).map(posto => {
      const values = grouped[posto]
      const avg = values.reduce((a,b)=>a+b,0) / values.length
      return {
        posto,
        media: Number(avg.toFixed(2)),
        occurrences: values.length 
      }
    }).sort((a,b) => a.posto.localeCompare(b.posto)) 

    return results
  }

  const averageData = calculateAverageRadar()

  const radarData = averageData.map(avg => {
    const operatorSkill = skills.find(s => s.posto === avg.posto)
    return {
      posto: avg.posto,
      media: avg.media,
      operador: operatorSkill ? operatorSkill.skill_level : 0 
    }
  })

  const averageLabel = filters.linha ? "Média da Linha" : "Média Global"

  return(
    <div className="modLineRadar-card">

      <div className="modLineRadar-header">
        <div className="modLineRadar-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div className="modLineRadar-titleBlock">
          <h3 className="modLineRadar-title">
            {filters.linha ? "Comparativo da Linha — " : "Comparativo Global (Fábrica) "} 
            {filters.linha && <span>{filters.linha}</span>}
          </h3>
          <p className="modLineRadar-subtitle">Compare o operador com a média do grupo</p>
        </div>
      </div>

      <div className="modLineRadar-body">

        <div className="modLineRadar-operatorSelectWrapper">
          <label className="modLineRadar-listTitle">Comparar com o operador:</label>
          
          <div className="modLineRadar-inputWrapper">
            <svg className="modLineRadar-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {isLoading ? (
              <select className="modLineRadar-select" disabled>
                 <option>Carregando dados...</option>
              </select>
            ) : operators.length > 0 ? (
              <select 
                className="modLineRadar-select"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
              >
                <option value="">Apenas {averageLabel}</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.nome}
                  </option>
                ))}
              </select>
            ) : (
              <div className="modLineRadar-noOperatorsMsg">
                Nenhum operador ativo nos filtros atuais.
              </div>
            )}
          </div>
        </div>

        <div className="modLineRadar-chartArea">
          {isLoading ? (
              <div className="modLineRadar-loadingState">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modLineRadar-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              </div>
          ) : radarData.length === 0 ? (
              <div className="modLineRadar-emptyState">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Nenhuma habilidade registrada para estes filtros.
              </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#f0f0f0"/>
                
                <PolarAngleAxis
                  dataKey="posto"
                  tick={{fill: "#555555", fontSize: 12, fontWeight: 700}}
                />
                
                <PolarRadiusAxis
                  domain={[0,5]}
                  tickCount={6}
                  tick={{fill: "#a0a0a0", fontSize: 11}}
                />

                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: '700' }}
                />

                <Radar
                  name={averageLabel}
                  dataKey="media"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  animationDuration={600}
                />

                {selectedOperator && (
                  <Radar
                    name="Desempenho do Operador"
                    dataKey="operador"
                    stroke="#d40000"
                    strokeWidth={2}
                    fill="#d40000"
                    fillOpacity={0.4}
                    animationDuration={600}
                  />
                )}

                <Legend 
                  wrapperStyle={{ paddingTop: "10px", fontSize: "13px", fontWeight: "600", color: "#555555" }} 
                />

              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  )
}