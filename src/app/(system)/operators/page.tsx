// src/app/(system)/operators/page.tsx
"use client"

import "./page.css"

import { useEffect, useState } from "react"

import OperatorTable from "@/components/operators/OperatorTable"

import {
  getOperators,
  addOperator,
  removeOperator,
  getProductionLines,
  getWorkstations,
  changeOperatorPosition
} from "@/services/database/operatorRepository"

export default function OperatorsPage(){

  const [operators,setOperators] = useState<any[]>([])

  const [lines,setLines] = useState<any[]>([])
  const [workstations,setWorkstations] = useState<any[]>([])

  const [nome,setNome] = useState("")
  const [matricula,setMatricula] = useState("")
  const [linha,setLinha] = useState("")
  const [posto,setPosto] = useState("")

  /* filtros */

  const [searchMatricula,setSearchMatricula] = useState("")
  const [searchNome,setSearchNome] = useState("")
  const [filterLinha,setFilterLinha] = useState("")
  const [filterPosto,setFilterPosto] = useState("")

  async function loadOperators(){

    const data = await getOperators()

    setOperators(data)

  }

  async function loadLines(){

    const data = await getProductionLines()

    setLines(data)

  }

  async function loadWorkstations(){

    const data = await getWorkstations()

    setWorkstations(data)

  }

  useEffect(()=>{

    loadOperators()
    loadLines()
    loadWorkstations()

  },[])

  async function handleCreateOperator(){

    if(!nome || !matricula){

      alert("Preencha nome e matrícula")
      return

    }

    await addOperator({

      nome,
      matricula,
      linha_atual:linha,
      posto_atual:posto

    })

    setNome("")
    setMatricula("")
    setLinha("")
    setPosto("")

    loadOperators()

  }

  async function handleRemoveOperator(id:string){

    if(!confirm("Remover operador?")) return

    await removeOperator(id)

    loadOperators()

  }

  async function handleChangePosition(
    operatorId:string,
    linha:string,
    posto:string
  ){

    await changeOperatorPosition(
      operatorId,
      linha,
      posto
    )

    loadOperators()

  }

  /* aplicar filtros */

  const filteredOperators = operators.filter(op => {

    const matchMatricula =
      op.matricula
        ?.toLowerCase()
        .includes(searchMatricula.toLowerCase())

    const matchNome =
      op.nome
        ?.toLowerCase()
        .includes(searchNome.toLowerCase())

    const matchLinha =
      filterLinha === "" ||
      op.linha_atual === filterLinha

    const matchPosto =
      filterPosto === "" ||
      op.posto_atual === filterPosto

    return (
      matchMatricula &&
      matchNome &&
      matchLinha &&
      matchPosto
    )

  })

  /* KPIs */

  const totalOperators = operators.length

  const operatorsWithoutLine =
    operators.filter(op => !op.linha_atual).length

  const operatorsByLine = lines.map(line => {

    const count =
      operators.filter(op => op.linha_atual === line.nome).length

    return {
      line:line.nome,
      count
    }

  })

  return(

    <div className="page">

      <h1>Operadores</h1>

      {/* KPIs */}

      <div className="kpiPanel">

        <div className="kpiCard">
          Operadores totais
          <strong>{totalOperators}</strong>
        </div>

        {operatorsByLine.map(line => (

          <div key={line.line} className="kpiCard">

            {line.line}

            <strong>{line.count}</strong>

          </div>

        ))}

        <div className="kpiCard warning">

          ⚠ Sem linha

          <strong>{operatorsWithoutLine}</strong>

        </div>

      </div>

      {/* FORM CADASTRO */}

      <div className="operatorForm">

        <input
          placeholder="Matrícula"
          value={matricula}
          onChange={e=>setMatricula(e.target.value)}
        />

        <input
          placeholder="Nome"
          value={nome}
          onChange={e=>setNome(e.target.value)}
        />

        <select
          value={linha}
          onChange={e=>setLinha(e.target.value)}
        >

          <option value="">
            Selecionar linha
          </option>

          {lines.map(line => (

            <option key={line.id} value={line.nome}>
              {line.nome}
            </option>

          ))}

        </select>

        <select
          value={posto}
          onChange={e=>setPosto(e.target.value)}
        >

          <option value="">
            Selecionar posto
          </option>

          {workstations.map(ws => (

            <option key={ws.id} value={ws.nome}>
              {ws.nome}
            </option>

          ))}

        </select>

        <button onClick={handleCreateOperator}>
          Cadastrar Operador
        </button>

      </div>

      {/* FILTROS */}

      <div className="operatorFilters">

        <input
          placeholder="Buscar matrícula"
          value={searchMatricula}
          onChange={e=>setSearchMatricula(e.target.value)}
        />

        <input
          placeholder="Buscar nome"
          value={searchNome}
          onChange={e=>setSearchNome(e.target.value)}
        />

        <select
          value={filterLinha}
          onChange={e=>setFilterLinha(e.target.value)}
        >

          <option value="">
            Filtrar por linha
          </option>

          {lines.map(line => (

            <option key={line.id} value={line.nome}>
              {line.nome}
            </option>

          ))}

        </select>

        <select
          value={filterPosto}
          onChange={e=>setFilterPosto(e.target.value)}
        >

          <option value="">
            Filtrar por posto
          </option>

          {workstations.map(ws => (

            <option key={ws.id} value={ws.nome}>
              {ws.nome}
            </option>

          ))}

        </select>

      </div>

      {/* TABELA */}

      <OperatorTable
        operators={filteredOperators}
        lines={lines}
        workstations={workstations}
        onRemove={handleRemoveOperator}
        onChangeLine={handleChangePosition}
        onChangePosto={handleChangePosition}
      />

    </div>

  )

}