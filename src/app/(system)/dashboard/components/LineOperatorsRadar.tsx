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
    <div className="corporateCard lineRadarCard animateFadeIn">

      <div className="lineRadarHeader">
        <h3>{filters.linha ? "Comparativo da Linha — " : "Comparativo Global (Fábrica)"} {filters.linha && <span>{filters.linha}</span>}</h3>
      </div>

      <div className="lineRadarBody">

        <div className="operatorSelectWrapper">
          <label className="listTitle">Comparar com o operador:</label>
          
          {isLoading ? (
            <select className="corporateInput" disabled>
               <option>Carregando...</option>
            </select>
          ) : operators.length > 0 ? (
            <select 
              className="corporateInput"
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
            <div className="noOperatorsMsg">
              Nenhum operador ativo nos filtros atuais.
            </div>
          )}
        </div>

        <div className="lineRadarChart">
          {isLoading ? (
              <div style={{ display: 'flex', height: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {/* 🛠️ MUDANÇA: Injetado o pageLoader vermelho padrão */}
                <div className="pageLoader" style={{ height: '40px', width: '40px' }} />
              </div>
          ) : radarData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#888', fontSize: '13px' }}>
                Nenhuma habilidade registrada para estes filtros.
              </div>
          ) : (
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

                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />

                <Radar
                  name={averageLabel}
                  dataKey="media"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  animationDuration={600}
                />

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
                  wrapperStyle={{ paddingTop: "10px", fontSize: "13px", fontWeight: "500", color: "#555" }} 
                />

              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  )
}