// src/components/operators/OperatorTable.tsx
"use client"

import "./OperatorTable.css"
import OperatorRow from "./visual/OperatorRow"
import { useState, useMemo } from "react"

interface Props{
  operators:any[]
  lines:any[]
  workstations:any[]

  onRemove:(id:string)=>void
  // 🆕 Atualizada a assinatura da função para incluir o turno
  onChangeLine:(operatorId:string, linha:string, posto:string, turno:string)=>void
}

const PAGE_SIZE = 20

export default function OperatorTable({
  operators,
  lines,
  workstations,
  onRemove,
  onChangeLine
}:Props){

  const [sortColumn,setSortColumn] = useState<string>("nome")
  const [sortDirection,setSortDirection] = useState<"asc"|"desc">("asc")
  const [page,setPage] = useState(1)

  function toggleSort(column:string){
    if(sortColumn === column){
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    }else{
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedOperators = useMemo(()=>{
    const sorted = [...operators].sort((a,b)=>{
      const valueA = a[sortColumn] || ""
      const valueB = b[sortColumn] || ""

      if(valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if(valueA > valueB) return sortDirection === "asc" ? 1 : -1

      return 0
    })
    return sorted
  },[operators,sortColumn,sortDirection])

  const totalPages = Math.ceil(sortedOperators.length / PAGE_SIZE)

  const paginatedOperators = useMemo(()=>{
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return sortedOperators.slice(start,end)
  },[sortedOperators,page])

  function renderSortIndicator(column:string){
    if(sortColumn !== column) return null

    return sortDirection === "asc" ? (
      <svg className="sortIcon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    ) : (
      <svg className="sortIcon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    )
  }

  return(

    <div className="operatorTableWrapper">

      <div className="tableContainer">
        <table className="corporateTable">

          <thead>
            <tr>
              <th onClick={()=>toggleSort("matricula")} className="sortableTh">
                <div className="thContent">Matrícula {renderSortIndicator("matricula")}</div>
              </th>

              <th onClick={()=>toggleSort("nome")} className="sortableTh">
                <div className="thContent">Nome {renderSortIndicator("nome")}</div>
              </th>

              <th onClick={()=>toggleSort("turno")} className="sortableTh">
                <div className="thContent">Turno {renderSortIndicator("turno")}</div>
              </th>

              <th onClick={()=>toggleSort("linha_atual")} className="sortableTh">
                <div className="thContent">Modelo {renderSortIndicator("linha_atual")}</div>
              </th>

              <th onClick={()=>toggleSort("posto_atual")} className="sortableTh">
                <div className="thContent">Posto {renderSortIndicator("posto_atual")}</div>
              </th>

              <th className="actionColumn">Ações</th>
            </tr>
          </thead>

          <tbody>
            {paginatedOperators.map(op => (
              <OperatorRow
                key={op.id}
                operator={op}
                lines={lines}
                workstations={workstations}
                onRemove={onRemove}
                onChangeLine={onChangeLine}
              />
            ))}
            
            {paginatedOperators.length === 0 && (
              <tr>
                <td colSpan={6} className="emptyState">
                  Nenhum operador encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* PAGINAÇÃO */}
      {totalPages > 0 && (
        <div className="corporatePagination">
          
          <button
            className="paginationBtn"
            disabled={page === 1}
            onClick={()=>setPage(page-1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Anterior
          </button>

          <span className="paginationInfo">
            Página <strong>{page}</strong> de {totalPages}
          </span>

          <button
            className="paginationBtn"
            disabled={page === totalPages}
            onClick={()=>setPage(page+1)}
          >
            Próxima
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

        </div>
      )}

    </div>

  )

}