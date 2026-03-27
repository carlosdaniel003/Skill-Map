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
    setPendingTurno, // 🆕 Importado do Hook
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

    // 1. Pega apenas os operadores ativos
    const activeOps = ops?.filter(op => op.ativo) || []
    setOperators(activeOps)

    // 2. Mapeia quais linhas realmente têm operadores alocados nelas
    const linhasComOperador = new Set(
      activeOps
        .map(op => op.linha_atual)
        .filter(linha => linha && linha.trim() !== "")
    )

    // 3. Filtra a lista de modelos para manter apenas os ativos e COM OPERADOR
    const linhasVisiveis = (lns || []).filter(line => 
      line.ativo && linhasComOperador.has(line.nome)
    )

    setLines(linhasVisiveis)
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

  function handleClearFilters() {
    setSearch("")
    setFilteredOperators([])
    
    setPendingOperator(null)
    setPendingLinha(null)
    setPendingTurno(null) // 🆕 Limpa o turno também

    setTimeout(() => {
      applyFilters()
    }, 50)
  }

  return(
    <div className="filtersCard">
      
      <div className="filtersHeader">
        <h2>Filtros Analíticos</h2>
      </div>

      <div className="filtersGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>

        {/* BUSCA OPERADOR */}
        <div className="filterGroup">
          <label>Turno (Equipe)</label>
          <select
            className="corporateInput"
            value={pendingFilters.turno ?? ""}
            onChange={e => setPendingTurno(e.target.value || null)}
          >
            <option value="">TODOS OS TURNOS</option>
            <option value="Comercial">Comercial</option>
            <option value="2º Turno estendido">2º Turno Estendido</option>
          </select>
        </div>

        {/* LINHA / MODELO */}
        <div className="filterGroup">
          <label>Modelo de Produção</label>
          <select
            className="corporateInput"
            value={pendingFilters.linha ?? ""}
            onChange={e => setPendingLinha(e.target.value || null)}
          >
            <option value="">TODOS OS MODELOS</option>
            {lines.map(line =>(
              <option key={line.id} value={line.nome}>
                {line.nome}
              </option>
            ))}
          </select>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="filterAction" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="secondaryButton clearButton"
            onClick={handleClearFilters}
            title="Limpar todos os filtros"
            style={{ padding: '12px', flex: 1 }}
          >
            Limpar Filtros
          </button>

          <button
            className="primaryButton searchButton"
            onClick={applyFilters}
            title="Aplicar Filtros"
            style={{ padding: '12px', flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
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