// src/app/(system)/operators/components/OperatorFilters.tsx
import React from 'react'
import './OperatorFilters.css'

export default function OperatorFilters({ data }: { data: any }) {
  const {
    searchMatricula, setSearchMatricula,
    searchNome, setSearchNome,
    filterTurno, setFilterTurno,
    filterLinha, setFilterLinha,
    filterPosto, setFilterPosto,
    lines, workstations
  } = data

  return (
    <div className="modOpFilter-card">
      
      <div className="modOpFilter-header">
        <div className="modOpFilter-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </div>
        <h2>Filtros e Busca</h2>
      </div>
      
      <div className="modOpFilter-grid">
        
        {/* BUSCAR MATRÍCULA */}
        <div className="modOpFilter-inputWrapper">
          <svg className="modOpFilter-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          <input
            className="modOpFilter-input"
            placeholder="Buscar matrícula"
            value={searchMatricula}
            onChange={(e)=>{
              const value = e.target.value.replace(/\D/g,"")
              setSearchMatricula(value)
            }}
          />
        </div>

        {/* BUSCAR NOME */}
        <div className="modOpFilter-inputWrapper">
          <svg className="modOpFilter-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            className="modOpFilter-input"
            placeholder="Buscar nome"
            value={searchNome}
            onChange={e=>setSearchNome(e.target.value)}
          />
        </div>

        {/* FILTRO DE TURNO */}
        <div className="modOpFilter-inputWrapper">
          <svg className="modOpFilter-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <select
            className="modOpFilter-select"
            value={filterTurno}
            onChange={e=>setFilterTurno(e.target.value)}
          >
            <option value="">Todos os turnos</option>
            <option value="Comercial">Comercial</option>
            <option value="2º Turno estendido">2º Turno estendido</option>
          </select>
        </div>

        {/* FILTRO DE MODELO / LINHA */}
        <div className="modOpFilter-inputWrapper">
          <svg className="modOpFilter-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <select
            className="modOpFilter-select"
            value={filterLinha}
            onChange={e=>setFilterLinha(e.target.value)}
          >
            <option value="">Todos os modelos</option>
            {lines.map((line: any) => (
              <option key={line.id} value={line.nome}>{line.nome}</option>
            ))}
          </select>
        </div>

        {/* FILTRO DE POSTO */}
        <div className="modOpFilter-inputWrapper" style={{ gridColumn: '1 / -1' }}>
          <svg className="modOpFilter-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <select
            className="modOpFilter-select"
            value={filterPosto}
            onChange={e=>setFilterPosto(e.target.value)}
          >
            <option value="">Todos os postos</option>
            {workstations.map((ws: any) => (
              <option key={ws.id} value={ws.nome}>{ws.nome}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  )
}