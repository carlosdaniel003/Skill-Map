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

      <div className="dashboardPageContainer">

        <div className="dashboardPageHeader">
          <h1 className="dashboardPageTitle">Dashboard</h1>
          <p className="dashboardPageSubtitle">Visão geral analítica de habilidades, linhas de produção e performance.</p>
        </div>

        {/* ==========================================
            0. CONTROLE GLOBAL: FILTROS
            ========================================== */}
        <div className="dashboardPageSection">
          <DashboardFilters />
        </div>


        {/* ==========================================
            1. MÓDULO: SKILL MAP E HABILIDADES
            ========================================== */}
            
        {/* Centro de Controle de Radares (33/33/33) */}
        <div className="dashboardPageGrid dashboardGridTriple">
          <LineSkillsRadar />
          <LineOperatorsRadar />
          <OperatorSkillsRadar />
        </div>

        {/* Visão Cirúrgica: Heatmap (100% Largura) */}
        <div className="dashboardPageSection dashboardHeatmapArea">
          <SkillMatrixHeatmap />
        </div>

        {/* Distribuição Geral e Nota do Operador (50/50) */}
        <div className="dashboardPageGrid dashboardGridHalf">
          <OperatorKPIs />
          <OperatorSkillGrade />
        </div>


        {/* ==========================================
            2. MÓDULO: ASSIDUIDADE, ENGAJAMENTO E CULTURA
            ========================================== */}
            
        {/* Estratégia de Equipe: Talentos vs Polivalência (50/50) */}
        <div className="dashboardPageGrid dashboardGridHalf">
          <TalentMatrix />
          <PolyvalenceRanking />
        </div>

        {/* Clima e Impacto: Termômetro vs Sangramento (50/50) */}
        <div className="dashboardPageGrid dashboardGridHalf">
          <LineEngagementThermometer />
          <StartupBleedingChart />
        </div>

      </div>

    </DashboardFilterProvider>

  )

}