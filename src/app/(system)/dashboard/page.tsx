// src/app/(system)/dashboard/page.tsx
"use client"

import "./page.css"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { canAccess } from "@/services/auth/routeGuard"

import { DashboardFilterProvider } from "./context/DashboardFilterContext"

import DashboardFilters from "./components/DashboardFilters"
import OperatorKPIs from "./components/OperatorKPIs"
import OperatorSkillsRadar from "./components/OperatorSkillsRadar"
import LineSkillsRadar from "./components/LineSkillsRadar"
import OperatorSkillGrade from "./components/OperatorSkillGrade"
import SkillMatrixHeatmap from "./components/SkillMatrixHeatmap"
import LineOperatorsRadar from "./components/LineOperatorsRadar"

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

        {/* BLOCO OPERADOR */}
        <div className="dashboardGrid operatorGrid">
          <OperatorSkillGrade />
          <OperatorSkillsRadar />
        </div>

        {/* BLOCO LINHA */}
        <div className="dashboardGrid lineGrid">
          <LineSkillsRadar />
          
          {/* Radar operadores vs média da linha */}
          <LineOperatorsRadar />
          
          {/* Heatmap geral da matriz */}
          <SkillMatrixHeatmap />
        </div>

      </div>

    </DashboardFilterProvider>

  )

}