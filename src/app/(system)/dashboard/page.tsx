// src\app\(system)\dashboard\page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { canAccess } from "@/services/auth/routeGuard"

import { DashboardFilterProvider } from "./context/DashboardFilterContext"

import DashboardFilters from "./components/DashboardFilters"
import OperatorSkillsRadar from "./components/OperatorSkillsRadar"
import LineSkillsRadar from "./components/LineSkillsRadar"
import OperatorSkillGrade from "./components/OperatorSkillGrade"
import SkillMatrixHeatmap from "./components/SkillMatrixHeatmap"

export default function DashboardPage(){

  const router = useRouter()

  useEffect(()=>{

    if(!canAccess("/dashboard")){

      router.push("/login")

    }

  },[])

  return(

    <DashboardFilterProvider>

      <div className="page">

        <h1>Dashboard</h1>

        <DashboardFilters />

        {/* BLOCO OPERADOR */}

        <div
          style={{
            display:"grid",
            gridTemplateColumns:"350px 1fr",
            gap:30,
            marginBottom:30
          }}
        >

          <OperatorSkillGrade />

          <OperatorSkillsRadar />

        </div>

        {/* BLOCO LINHA */}

        <div
          style={{
            display:"grid",
            gap:30
          }}
        >

          <LineSkillsRadar />

          <SkillMatrixHeatmap />

        </div>

      </div>

    </DashboardFilterProvider>

  )

}