// src/app/(system)/dashboard/components/OperatorKPIs.tsx
"use client"

import "./OperatorKPIs.css"
import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

export default function OperatorKPIs(){

  const { filters } = useDashboardFilters()

  const [totalOperators,setTotalOperators] = useState(0)

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

    // 1. Pega apenas o total de operadores (Para a badge superior)
    let opQuery = supabase
      .from("operators")
      .select("id")
      .eq("ativo", true)

    if(filters.linha){
      opQuery = opQuery.eq("linha_atual", filters.linha)
    }

    const { data: operators } = await opQuery
    if(!operators) return

    setTotalOperators(operators.length)

    // 2. Faz uma consulta unificada (INNER JOIN) nas skills e operadores.
    // Isso evita o erro de URL gigante quando não há filtros (Fábrica Inteira).
    let skillsQuery = supabase
      .from("operator_skills")
      .select(`
        operator_id,
        skill_level,
        operators!inner(ativo, linha_atual, posto_atual)
      `)
      .eq("operators.ativo", true)
      .not("operators.linha_atual", "is", null)
      .not("operators.posto_atual", "is", null)

    if(filters.linha){
      skillsQuery = skillsQuery.eq("operators.linha_atual", filters.linha)
    }

    const { data: skills } = await skillsQuery

    if(!skills || skills.length === 0) {
      setNeverDid(0)
      setInTraining(0)
      setCapable(0)
      setExperts(0)
      setInstructors(0)
      return
    }

    // 3. Agrupa as skills por operador
    const skillMap: Record<string, number[]> = {}

    skills.forEach((s: any) => {
      if(!skillMap[s.operator_id]){
        skillMap[s.operator_id] = []
      }
      skillMap[s.operator_id].push(s.skill_level)
    })

    // Contadores temporários para os 5 níveis
    let n1=0, n2=0, n3=0, n4=0, n5=0

    Object.values(skillMap).forEach(levels => {

      const totalSkills = levels.reduce((a,b) => a + b, 0)
      const max = levels.length * 5

      const ratio = max > 0 ? (totalSkills / max) * 100 : 0

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
      <div className="kpiSectionTitle">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Distribuição de Habilidades
          <span style={{ fontSize: '14px', color: '#888', fontWeight: 600 }}>
            {filters.linha ? `(${filters.linha})` : "(Fábrica Inteira)"}
          </span>
        </div>
        <span className="totalBadge">Total de Operadores: {totalOperators}</span>
      </div>
      
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