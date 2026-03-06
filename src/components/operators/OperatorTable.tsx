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
  onChangeLine:(operatorId:string,linha:string,posto:string)=>void
  onChangePosto:(operatorId:string,linha:string,posto:string)=>void

}

const PAGE_SIZE = 20

export default function OperatorTable({
  operators,
  lines,
  workstations,
  onRemove,
  onChangeLine,
  onChangePosto
}:Props){

  const [sortColumn,setSortColumn] = useState<string>("nome")
  const [sortDirection,setSortDirection] = useState<"asc"|"desc">("asc")
  const [page,setPage] = useState(1)

  function toggleSort(column:string){

    if(sortColumn === column){

      setSortDirection(
        sortDirection === "asc" ? "desc" : "asc"
      )

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

    if(sortColumn !== column) return ""

    return sortDirection === "asc" ? " ↑" : " ↓"

  }

  return(

    <div className="operatorTableWrapper">

      <table className="operatorTable">

        <thead>

          <tr>

            <th onClick={()=>toggleSort("matricula")}>
              Matrícula{renderSortIndicator("matricula")}
            </th>

            <th onClick={()=>toggleSort("nome")}>
              Nome{renderSortIndicator("nome")}
            </th>

            <th onClick={()=>toggleSort("linha_atual")}>
              Linha{renderSortIndicator("linha_atual")}
            </th>

            <th onClick={()=>toggleSort("posto_atual")}>
              Posto{renderSortIndicator("posto_atual")}
            </th>

            <th>Ações</th>

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
              onChangePosto={onChangePosto}
            />

          ))}

        </tbody>

      </table>

      {/* PAGINAÇÃO */}

      <div className="pagination">

        <button
          disabled={page === 1}
          onClick={()=>setPage(page-1)}
        >
          ◀
        </button>

        <span>
          Página {page} de {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={()=>setPage(page+1)}
        >
          ▶
        </button>

      </div>

    </div>

  )

}