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
import OperatorSkillsRadar from "./components/OperatorSkillsRadar"
import LineSkillsRadar from "./components/LineSkillsRadar"
import OperatorSkillGrade from "./components/OperatorSkillGrade"
import LineOperatorsRadar from "./components/LineOperatorsRadar"
import StartupBleedingChart from "./components/StartupBleedingChart"
import LineEngagementThermometer from "./components/LineEngagementThermometer" // 🆕 IMPORTADO
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

        {/* FILTROS */}
        <div className="dashboardSection">
          <DashboardFilters />
        </div>

        {/* KPIs GERAIS */}
        <div className="dashboardSection">
          <OperatorKPIs />
        </div>

        {/* BLOCO ESTRATÉGICO (50/50) - Matriz de Talentos & Ranking de Polivalência */}
        <div className="dashboardGrid">
          <TalentMatrix />
          <PolyvalenceRanking />
        </div>

        {/* BLOCO OPERADOR (50/50) */}
        <div className="dashboardGrid operatorGrid">
          <OperatorSkillGrade />
          <OperatorSkillsRadar />
        </div>

        {/* BLOCO LINHA - RADARES (50/50) */}
        <div className="dashboardGrid dualRadarGrid">
          <LineSkillsRadar />
          <LineOperatorsRadar />
        </div>

        {/* 🆕 BLOCO CULTURA E ASSIDUIDADE (50/50) - Sangramento & Engajamento */}
        <div className="dashboardGrid">
          <StartupBleedingChart />
          <LineEngagementThermometer />
        </div>
        
        {/* BLOCO LINHA - HEATMAP (100% DE LARGURA) */}
        <div className="dashboardSection heatmapSection">
          <SkillMatrixHeatmap />
        </div>

      </div>

    </DashboardFilterProvider>

  )

}