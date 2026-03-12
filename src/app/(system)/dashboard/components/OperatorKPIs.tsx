// src/app/(system)/dashboard/components/OperatorKPIs.tsx
"use client"

import "./OperatorKPIs.css"
import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

export default function OperatorKPIs(){

  const { filters } = useDashboardFilters()

  const [totalOperators,setTotalOperators] = useState(0)
  const [activeOperators,setActiveOperators] = useState(0)
  const [inactiveOperators,setInactiveOperators] = useState(0)

  const [utilization,setUtilization] = useState(0)

  // Estados para os 5 Níveis de Habilidade
  const [neverDid, setNeverDid] = useState(0)        // 1 - Nunca fez (0 a 20%)
  const [inTraining, setInTraining] = useState(0)    // 2 - Em treinamento (21 a 40%)
  const [capable, setCapable] = useState(0)          // 3 - Apto a operar (41 a 60%)
  const [experts, setExperts] = useState(0)          // 4 - Especialista (61 a 80%)
  const [instructors, setInstructors] = useState(0)  // 5 - Instrutor (81 a 100%)

  useEffect(()=>{
    loadKPIs()
  },[filters.linha])

  async function loadKPIs(){

    let query = supabase
      .from("operators")
      .select("id,ativo,linha_atual,posto_atual")

    if(filters.linha){
      query = query.eq("linha_atual",filters.linha)
    }

    const { data:operators } = await query

    if(!operators) return

    /* TOTAL = ativo true */
    const total = operators.filter(o => o.ativo)
    setTotalOperators(total.length)

    /* ATIVOS = tem linha E posto */
    const active = total.filter(o =>
      o.linha_atual && o.posto_atual
    )
    setActiveOperators(active.length)

    /* INATIVOS = falta linha OU posto */
    const inactive = total.filter(o =>
      !o.linha_atual || !o.posto_atual
    )
    setInactiveOperators(inactive.length)

    /* UTILIZAÇÃO */
    if(total.length > 0){
      const utilizationRate = (active.length / total.length) * 100
      setUtilization(Math.round(utilizationRate))
    }else{
      setUtilization(0)
    }

    const ids = active.map(o=>o.id)

    if(ids.length === 0) {
      setNeverDid(0)
      setInTraining(0)
      setCapable(0)
      setExperts(0)
      setInstructors(0)
      return
    }

    const { data:skills } = await supabase
      .from("operator_skills")
      .select("operator_id,skill_level")
      .in("operator_id",ids)

    if(!skills) return

    const skillMap:Record<string,number[]> = {}

    skills.forEach(s => {
      if(!skillMap[s.operator_id]){
        skillMap[s.operator_id] = []
      }
      skillMap[s.operator_id].push(s.skill_level)
    })

    // Contadores temporários para os 5 níveis
    let n1=0, n2=0, n3=0, n4=0, n5=0

    Object.values(skillMap).forEach(levels => {

      const total = levels.reduce((a,b)=>a+b,0)
      const max = levels.length * 5

      const ratio = max > 0 ? (total/max)*100 : 0

      // Distribuição exata em blocos de 20%
      if(ratio <= 20) n1++
      else if(ratio <= 40) n2++
      else if(ratio <= 60) n3++
      else if(ratio <= 80) n4++
      else n5++

    })

    setNeverDid(n1)
    setInTraining(n2)
    setCapable(n3)
    setExperts(n4)
    setInstructors(n5)

  }

  return(

    <>
      {/* SEÇÃO 1: KPIS OPERACIONAIS GERAIS */}
      <div className="kpiSectionTitle">Visão Geral da Operação</div>
      
      <div className="kpiGrid">

        {/* TOTAL */}
        <div className="kpiCard kpi-total">
          <div className="kpiHeader">
            <span className="kpiLabel">
              Operadores Totais
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{totalOperators}</span>
        </div>

        {/* ATIVOS */}
        <div className="kpiCard kpi-active">
          <div className="kpiHeader">
            <span className="kpiLabel">
              Alocados (Ativos)
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{activeOperators}</span>
        </div>

        {/* INATIVOS */}
        <div className="kpiCard kpi-inactive">
          <div className="kpiHeader">
            <span className="kpiLabel">
              Sem Alocação
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{inactiveOperators}</span>
        </div>

        {/* UTILIZAÇÃO */}
        <div className="kpiCard kpi-utilization">
          <div className="kpiHeader">
            <span className="kpiLabel">
              Taxa de Utilização
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{utilization}%</span>
        </div>

      </div>

      {/* SEÇÃO 2: KPIS DE NÍVEL DE HABILIDADE (OS 5 NÍVEIS) */}
      <div className="kpiSectionTitle" style={{marginTop: 16}}>Distribuição de Habilidades (Alocados)</div>
      
      <div className="kpiGrid five-cols">

        {/* Nível 1: NUNCA FEZ */}
        <div className="kpiCard kpi-lvl1">
          <div className="kpiHeader">
            <span className="kpiLabel">
              1. Nunca Fez
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{neverDid}</span>
        </div>

        {/* Nível 2: EM TREINAMENTO */}
        <div className="kpiCard kpi-lvl2">
          <div className="kpiHeader">
            <span className="kpiLabel">
              2. Em Treinamento
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{inTraining}</span>
        </div>

        {/* Nível 3: APTO A OPERAR */}
        <div className="kpiCard kpi-lvl3">
          <div className="kpiHeader">
            <span className="kpiLabel">
              3. Apto a Operar
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{capable}</span>
        </div>

        {/* Nível 4: ESPECIALISTA */}
        <div className="kpiCard kpi-lvl4">
          <div className="kpiHeader">
            <span className="kpiLabel">
              4. Especialista
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{experts}</span>
        </div>

        {/* Nível 5: INSTRUTOR */}
        <div className="kpiCard kpi-lvl5">
          <div className="kpiHeader">
            <span className="kpiLabel">
              5. Instrutor
            </span>
            <div className="kpiIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
          </div>
          <span className="kpiValue">{instructors}</span>
        </div>

      </div>
    </>

  )

}