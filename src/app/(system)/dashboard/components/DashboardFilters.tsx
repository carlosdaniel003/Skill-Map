// src/app/(system)/dashboard/components/DashboardFilters.tsx
"use client"

import "./DashboardFilters.css"
import { useEffect, useState, useRef } from "react"
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
    setPendingTurno,
    applyFilters
  } = useDashboardFilters()

  const [operators,setOperators] = useState<any[]>([])
  const [lines,setLines] = useState<any[]>([])

  const [search,setSearch] = useState("")
  const [filteredOperators,setFilteredOperators] = useState<any[]>([])

  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    loadData()
  },[])

  useEffect(()=>{
    filterOperators()
  },[search,operators])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setFilteredOperators([])
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
    setPendingTurno(null)

    setTimeout(() => {
      applyFilters()
    }, 50)
  }

  return(
    <div className="modDashFilters-card">
      
      <div className="modDashFilters-header">
        <div className="modDashFilters-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </div>
        <h2>Filtros Analíticos</h2>
      </div>

      <div className="modDashFilters-grid">

        {/* BUSCA OPERADOR */}
        <div className="modDashFilters-group searchGroup" ref={searchRef}>
          <label>Buscar Operador</label>
          <div className="modDashFilters-inputWrapper">
            <svg className="modDashFilters-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              className="modDashFilters-input"
              placeholder="Nome ou matrícula..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                // Se o usuário apagar o texto, limpa o filtro de operador pendente
                if (!e.target.value) {
                  setPendingOperator(null)
                }
              }}
            />
            {filteredOperators.length > 0 && (
              <div className="modDashFilters-dropdown">
                {filteredOperators.slice(0, 10).map(op => (
                  <div
                    key={op.id}
                    className="modDashFilters-dropdownItem"
                    onClick={() => handleSelectOperator(op)}
                  >
                    <div className="dropdownInfo">
                      <strong>{op.matricula}</strong> — {op.nome}
                    </div>
                    <span className="dropdownBadge">
                      {op.linha_atual || "Sem Linha"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SELECT DE TURNO */}
        <div className="modDashFilters-group">
          <label>Turno (Equipe)</label>
          <div className="modDashFilters-inputWrapper">
            <svg className="modDashFilters-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <select
              className="modDashFilters-input modDashFilters-select"
              value={pendingFilters.turno ?? ""}
              onChange={e => setPendingTurno(e.target.value || null)}
            >
              <option value="">Todos os turnos</option>
              <option value="Comercial">Comercial</option>
              <option value="2º Turno estendido">2º Turno Estendido</option>
            </select>
          </div>
        </div>

        {/* LINHA / MODELO */}
        <div className="modDashFilters-group">
          <label>Modelo de Produção</label>
          <div className="modDashFilters-inputWrapper">
            <svg className="modDashFilters-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <select
              className="modDashFilters-input modDashFilters-select"
              value={pendingFilters.linha ?? ""}
              onChange={e => setPendingLinha(e.target.value || null)}
            >
              <option value="">Todos os modelos</option>
              {lines.map(line =>(
                <option key={line.id} value={line.nome}>
                  {line.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="modDashFilters-actions">
          <button
            className="modDashFilters-clearBtn"
            onClick={handleClearFilters}
            title="Limpar todos os filtros"
          >
            Limpar Filtros
          </button>

          <button
            className="modDashFilters-searchBtn"
            onClick={applyFilters}
            title="Aplicar Filtros"
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