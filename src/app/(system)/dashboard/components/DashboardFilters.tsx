// src/app/(system)/dashboard/components/DashboardFilters.tsx
"use client"

import "./DashboardFilters.css"
import { useEffect, useState } from "react"
import { useDashboardFilters } from "../context/DashboardFilterContext"

import {
  getOperators,
  getProductionLines
} from "@/services/database/operatorRepository"

export default function DashboardFilters(){

  const {
    pendingFilters,
    setPendingOperator,
    setPendingLinha,
    applyFilters
  } = useDashboardFilters()

  const [operators,setOperators] = useState<any[]>([])
  const [lines,setLines] = useState<any[]>([])

  const [search,setSearch] = useState("")
  const [filteredOperators,setFilteredOperators] = useState<any[]>([])

  useEffect(()=>{
    loadData()
  },[])

  useEffect(()=>{
    filterOperators()
  },[search,operators])

  async function loadData(){
    const ops = await getOperators()
    const lns = await getProductionLines()

    setOperators(ops || [])
    setLines(lns || [])
  }

  function filterOperators(){
    if(!search){
      setFilteredOperators([])
      return
    }

    const term = search.toLowerCase()

    const results = operators.filter(op =>
      op.nome.toLowerCase().includes(term) ||
      String(op.matricula).includes(term)
    )

    setFilteredOperators(results)
  }

  function handleSelectOperator(op:any){
    setSearch(`${op.nome} (${op.matricula})`)
    setPendingOperator(op.id)
    setFilteredOperators([])
  }

  /* botão buscar habilitado se operador OU linha existir */
  const canSearch = pendingFilters.operatorId || pendingFilters.linha

  return(

    <div className="corporateCard filtersCard">
      
      <div className="filtersHeader">
        <h2>Filtros Analíticos</h2>
      </div>

      <div className="filtersGrid">

        {/* BUSCA OPERADOR */}
        <div className="filterGroup searchGroup">
          <label>Operador</label>
          <div className="searchInputWrapper">
            <input
  type="text"
  className="corporateInput"
  placeholder="Buscar operador ou matrícula..."
  value={search}
  onChange={e=>{
    setSearch(e.target.value)
    setPendingOperator(null)
  }}
  onKeyDown={(e)=>{

    if(e.key === "Enter"){

      e.preventDefault()

      if(filteredOperators.length > 0){
        handleSelectOperator(filteredOperators[0])
      }

    }

  }}
/>

            {filteredOperators.length > 0 && (
              <div className="dropdownResults">
                {filteredOperators.map(op =>(
                  <div
                    key={op.id}
                    className="dropdownItem"
                    onClick={()=>handleSelectOperator(op)}
                  >
                    <strong>{op.matricula}</strong> — {op.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LINHA */}
        <div className="filterGroup">
          <label>Modelo de Produção</label>
          <select
            className="corporateInput"
            value={pendingFilters.linha ?? ""}
            onChange={e =>
              setPendingLinha(
                e.target.value || null
              )
            }
          >
            <option value="">TODOS OS MODELOS</option>
            {lines.map(line =>(
              <option key={line.id} value={line.nome}>
                {line.nome}
              </option>
            ))}
          </select>
        </div>

        {/* BOTÃO BUSCAR */}
        <div className="filterAction">
          <button
            className="primaryButton searchButton"
            onClick={applyFilters}
            disabled={!canSearch}
            title={canSearch ? "Aplicar Filtros" : "Selecione um filtro para buscar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            Buscar Dados
          </button>
        </div>

      </div>

    </div>

  )

}