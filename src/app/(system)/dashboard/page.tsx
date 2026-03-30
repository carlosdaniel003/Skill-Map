// src/app/(system)/dashboard/page.tsx
"use client"

import "./page.css"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { canAccess } from "@/services/auth/routeGuard"
import { DashboardFilterProvider } from "./context/DashboardFilterContext"

import DashboardFilters from "./components/DashboardFilters"
import OperatorKPIs from "./components/OperatorKPIs" 
import TalentMatrix from "./components/TalentMatrix" 
import PolyvalenceRanking from "./components/PolyvalenceRanking" 
import OperatorSkillGrade from "./components/OperatorSkillGrade"
import LineSkillsRadar from "./components/LineSkillsRadar"
import LineOperatorsRadar from "./components/LineOperatorsRadar"
import OperatorSkillsRadar from "./components/OperatorSkillsRadar"
import StartupBleedingChart from "./components/StartupBleedingChart"
import LineEngagementThermometer from "./components/LineEngagementThermometer"
import SkillMatrixHeatmap from "./components/SkillMatrixHeatmap"

export default function DashboardPage(){

  const router = useRouter()

  useEffect(()=>{
    if(!canAccess("/dashboard")){
      router.push("/login")
    }
  },[router])

  return(

    <DashboardFilterProvider>

      <div className="modDashboardContainer">

        <div className="modDashboardHeader">
          <div className="modDashboardIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9"/>
              <rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/>
              <rect x="3" y="16" width="7" height="5"/>
            </svg>
          </div>
          <div className="modDashboardTitleBlock">
            <h1 className="modDashboardTitle">Dashboard Analítico</h1>
            <p className="modDashboardSubtitle">Visão geral de habilidades, alocação de linhas de produção e performance.</p>
          </div>
        </div>

        {/* ==========================================
            0. CONTROLE GLOBAL: FILTROS
            ========================================== */}
        <div className="modDashboardSection">
          <DashboardFilters />
        </div>

        {/* ==========================================
            1. MÓDULO: SKILL MAP E HABILIDADES
            ========================================== */}
            
        {/* Centro de Controle de Radares (33/33/33) */}
        <div className="modDashboardGrid modDashboardGridTriple">
          <LineSkillsRadar />
          <LineOperatorsRadar />
          <OperatorSkillsRadar />
        </div>

        {/* Visão Cirúrgica: Heatmap (100% Largura) */}
        <div className="modDashboardSection modDashboardHeatmapArea">
          <SkillMatrixHeatmap />
        </div>

        {/* Distribuição Geral e Nota do Operador (50/50) */}
        <div className="modDashboardGrid modDashboardGridHalf">
          <OperatorKPIs />
          <OperatorSkillGrade />
        </div>

        {/* ==========================================
            2. MÓDULO: ASSIDUIDADE, ENGAJAMENTO E CULTURA
            ========================================== */}
            
        {/* Estratégia de Equipe: Talentos vs Polivalência (50/50) */}
        <div className="modDashboardGrid modDashboardGridHalf">
          <TalentMatrix />
          <PolyvalenceRanking />
        </div>

        {/* Clima e Impacto: Termômetro vs Sangramento (50/50) */}
        <div className="modDashboardGrid modDashboardGridHalf">
          <LineEngagementThermometer />
          <StartupBleedingChart />
        </div>

      </div>

    </DashboardFilterProvider>

  )

}