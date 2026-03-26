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

      <div className="dashboardPage">

        <div className="pageHeader">
          <h1 className="pageTitle">Dashboard</h1>
          <p className="pageSubtitle">Visão geral analítica de habilidades, linhas de produção e performance.</p>
        </div>

        {/* ==========================================
            0. CONTROLE GLOBAL: FILTROS
            ========================================== */}
        <div className="dashboardSection">
          <DashboardFilters />
        </div>


        {/* ==========================================
            1. MÓDULO: SKILL MAP E HABILIDADES
            ========================================== */}
            
        {/* Centro de Controle de Radares (33/33/33) */}
        <div className="dashboardGrid tripleGrid">
          <LineSkillsRadar />
          <LineOperatorsRadar />
          <OperatorSkillsRadar />
        </div>

        {/* Visão Cirúrgica: Heatmap (100% Largura) */}
        <div className="dashboardSection heatmapSection">
          <SkillMatrixHeatmap />
        </div>

        {/* Distribuição Geral e Nota do Operador (50/50) - Movidos para debaixo do Heatmap */}
        <div className="dashboardGrid topGrid">
          <OperatorKPIs />
          <OperatorSkillGrade />
        </div>


        {/* ==========================================
            2. MÓDULO: ASSIDUIDADE, ENGAJAMENTO E CULTURA
            ========================================== */}
            
        {/* Estratégia de Equipe: Talentos vs Polivalência (50/50) */}
        <div className="dashboardGrid topGrid">
          <TalentMatrix />
          <PolyvalenceRanking />
        </div>

        {/* Clima e Impacto: Termômetro vs Sangramento (50/50) */}
        <div className="dashboardGrid topGrid">
          <LineEngagementThermometer />
          <StartupBleedingChart />
        </div>

      </div>

    </DashboardFilterProvider>

  )

}