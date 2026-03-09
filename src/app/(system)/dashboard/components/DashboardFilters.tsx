"use client"

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
  const [filteredOperators,setFilteredOperators] =
    useState<any[]>([])

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

  const canSearch =
    pendingFilters.operatorId ||
    pendingFilters.linha

  return(

    <div
      style={{
        display:"flex",
        gap:20,
        marginBottom:30,
        alignItems:"center",
        flexWrap:"wrap"
      }}
    >

      {/* BUSCA OPERADOR */}

      <div style={{position:"relative"}}>

        <input
          type="text"
          placeholder="Buscar operador ou matrícula"
          value={search}
          onChange={e=>{
            setSearch(e.target.value)
            setPendingOperator(null)
          }}
          style={{
            padding:"8px 12px",
            width:260
          }}
        />

        {filteredOperators.length > 0 && (

          <div
            style={{
              position:"absolute",
              top:40,
              left:0,
              background:"#fff",
              border:"1px solid #ddd",
              width:"100%",
              zIndex:10
            }}
          >

            {filteredOperators.map(op =>(

              <div
                key={op.id}
                onClick={()=>handleSelectOperator(op)}
                style={{
                  padding:8,
                  cursor:"pointer"
                }}
              >

                {op.nome} — {op.matricula}

              </div>

            ))}

          </div>

        )}

      </div>

      {/* LINHA */}

      <select
        value={pendingFilters.linha ?? ""}
        onChange={e =>
          setPendingLinha(
            e.target.value || null
          )
        }
      >

        <option value="">
          Todas as linhas
        </option>

        {lines.map(line =>(

          <option
            key={line.id}
            value={line.nome}
          >
            {line.nome}
          </option>

        ))}

      </select>

      {/* BOTÃO BUSCAR */}

      <button
        onClick={applyFilters}
        disabled={!canSearch}
        style={{
          padding:"8px 16px",
          cursor: canSearch
            ? "pointer"
            : "not-allowed"
        }}
      >

        Buscar

      </button>

    </div>

  )

}