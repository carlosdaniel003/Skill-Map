// src/app/(system)/operators/components/OperatorFilters.tsx
import React from 'react'
import './OperatorFilters.css'

export default function OperatorFilters({ data }: { data: any }) {
  const {
    searchMatricula, setSearchMatricula,
    searchNome, setSearchNome,
    filterLinha, setFilterLinha,
    filterPosto, setFilterPosto,
    lines, workstations
  } = data

  return (
    <div className="corporateCard filterCard">
      <h2>Filtros e Busca</h2>
      
      <div className="formGrid">
        <input
          className="corporateInput"
          placeholder="Buscar matrícula"
          value={searchMatricula}
          onChange={(e)=>{
            const value = e.target.value.replace(/\D/g,"")
            setSearchMatricula(value)
          }}
        />

        <input
          className="corporateInput"
          placeholder="Buscar nome"
          value={searchNome}
          onChange={e=>setSearchNome(e.target.value)}
        />

        <select
          className="corporateInput"
          value={filterLinha}
          onChange={e=>setFilterLinha(e.target.value)}
        >
          <option value="">Todas os modelos</option>
          {lines.map((line: any) => (
            <option key={line.id} value={line.nome}>{line.nome}</option>
          ))}
        </select>

        <select
          className="corporateInput"
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
  )
}