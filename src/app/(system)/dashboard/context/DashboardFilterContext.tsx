// src/app/(system)/dashboard/context/DashboardFilterContext.tsx
"use client"

import { createContext, useContext, useState } from "react"

interface DashboardFilters {
  operatorId: string | null
  linha: string | null
  turno: string | null // 🆕 Adicionado
}

interface DashboardContextType {
  filters: DashboardFilters
  pendingFilters: DashboardFilters

  setPendingOperator: (id: string | null) => void
  setPendingLinha: (linha: string | null) => void
  setPendingTurno: (turno: string | null) => void // 🆕 Adicionado

  applyFilters: () => void
}

const DashboardFilterContext = createContext<DashboardContextType | null>(null)

export function DashboardFilterProvider({
  children
}:{
  children: React.ReactNode
}){

  const [filters, setFilters] = useState<DashboardFilters>({
    operatorId: null,
    linha: null,
    turno: null // 🆕 Adicionado
  })

  const [pendingFilters, setPendingFilters] = useState<DashboardFilters>({
    operatorId: null,
    linha: null,
    turno: null // 🆕 Adicionado
  })

  function setPendingOperator(id: string | null){
    setPendingFilters(prev => ({
      ...prev,
      operatorId: id
    }))
  }

  function setPendingLinha(linha: string | null){
    setPendingFilters(prev => ({
      ...prev,
      linha
    }))
  }

  // 🆕 Nova função para alterar o turno pendente
  function setPendingTurno(turno: string | null){
    setPendingFilters(prev => ({
      ...prev,
      turno
    }))
  }

  function applyFilters(){
    setFilters(pendingFilters)
  }

  return(
    <DashboardFilterContext.Provider
      value={{
        filters,
        pendingFilters,
        setPendingOperator,
        setPendingLinha,
        setPendingTurno, // 🆕 Exportado
        applyFilters
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  )
}

export function useDashboardFilters(){
  const ctx = useContext(DashboardFilterContext)
  if(!ctx){
    throw new Error(
      "useDashboardFilters deve ser usado dentro de DashboardFilterProvider"
    )
  }
  return ctx
}