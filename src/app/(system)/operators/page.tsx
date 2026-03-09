// src/app/(system)/operators/page.tsx
"use client"

import "./page.css"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import OperatorTable from "@/components/operators/OperatorTable"

import {
  getOperators,
  addOperator,
  deactivateOperator,
  getProductionLines,
  getWorkstations,
  changeOperatorPosition
} from "@/services/database/operatorRepository"

export default function OperatorsPage(){

  const router = useRouter()

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
    if(!confirm("Tem certeza que deseja desativar este operador?")) return

    await deactivateOperator(id)
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
    const matchMatricula = op.matricula?.toLowerCase().includes(searchMatricula.toLowerCase())
    const matchNome = op.nome?.toLowerCase().includes(searchNome.toLowerCase())
    const matchLinha = filterLinha === "" || op.linha_atual === filterLinha
    const matchPosto = filterPosto === "" || op.posto_atual === filterPosto

    return matchMatricula && matchNome && matchLinha && matchPosto
  })

  return(

    <div className="operatorsPage">

      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Gestão de Operadores</h1>
          <p className="pageSubtitle">Cadastre, filtre e gerencie a alocação de operadores nas linhas de produção.</p>
        </div>
        <button
          className="secondaryButton"
          onClick={()=>router.push("/operators/inactive")}
        >
          Ver Desativados
        </button>
      </div>

      <div className="actionPanels">
        
        {/* FORM CADASTRO */}
        <div className="corporateCard formCard">
          <h2>Novo Operador</h2>
          
          <div className="formGrid">
            <input
              className="corporateInput"
              placeholder="Matrícula"
              value={matricula}
              onChange={e=>setMatricula(e.target.value)}
            />

            <input
              className="corporateInput"
              placeholder="Nome completo"
              value={nome}
              onChange={e=>setNome(e.target.value)}
            />

            <select
              className="corporateInput"
              value={linha}
              onChange={e=>setLinha(e.target.value)}
            >
              <option value="">Selecionar linha (Opcional)</option>
              {lines.map(line => (
                <option key={line.id} value={line.nome}>{line.nome}</option>
              ))}
            </select>

            <select
              className="corporateInput"
              value={posto}
              onChange={e=>setPosto(e.target.value)}
            >
              <option value="">Selecionar posto (Opcional)</option>
              {workstations.map(ws => (
                <option key={ws.id} value={ws.nome}>{ws.nome}</option>
              ))}
            </select>
          </div>

          <button 
            className="primaryButton fullWidth mt-3" 
            onClick={handleCreateOperator}
            disabled={!nome || !matricula}
          >
            Cadastrar Operador
          </button>
        </div>

        {/* FILTROS */}
        <div className="corporateCard filterCard">
          <h2>Filtros e Busca</h2>
          
          <div className="formGrid">
            <input
              className="corporateInput"
              placeholder="Buscar matrícula"
              value={searchMatricula}
              onChange={e=>setSearchMatricula(e.target.value)}
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
              <option value="">Todas as linhas</option>
              {lines.map(line => (
                <option key={line.id} value={line.nome}>{line.nome}</option>
              ))}
            </select>

            <select
              className="corporateInput"
              value={filterPosto}
              onChange={e=>setFilterPosto(e.target.value)}
            >
              <option value="">Todos os postos</option>
              {workstations.map(ws => (
                <option key={ws.id} value={ws.nome}>{ws.nome}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* TABELA */}
      <div className="corporateCard tableCard">
        <OperatorTable
          operators={filteredOperators}
          lines={lines}
          workstations={workstations}
          onRemove={handleRemoveOperator}
          onChangeLine={handleChangePosition}
          onChangePosto={handleChangePosition}
        />
      </div>

    </div>

  )

}