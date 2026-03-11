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

// IMPORTAÇÕES PARA AUDITORIA
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

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

  // MODAIS CORPORATIVOS
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)

  // SESSÃO DO USUÁRIO
  const sessionUser = getSession()

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

    if(!nome || matricula.length !== 6){
      setAlertConfig({
        title:"Campos Obrigatórios",
        message:"A matricula deve conter exatamente 6 dígitos."
      })
      return
    }

    try{

      await addOperator({
        nome,
        matricula,
        linha_atual:linha,
        posto_atual:posto
      })

      // LOG DE AUDITORIA
      const detalhesAlocacao = (linha || posto) ? ` na linha ${linha || '-'} e posto ${posto || '-'}` : ''
      await logAction(
        sessionUser?.username || "sistema", 
        "operator_create", 
        `Cadastrou o operador: ${nome} (${matricula})${detalhesAlocacao}`
      )

      setNome("")
      setMatricula("")
      setLinha("")
      setPosto("")

      loadOperators()

      setAlertConfig({
        title:"Operador cadastrado",
        message:"O operador foi cadastrado com sucesso."
      })

    }catch(error:any){

      if(error.message === "MATRICULA_EXISTS"){
        setAlertConfig({
          title:"Matrícula duplicada",
          message:"Já existe um operador cadastrado com essa matrícula."
        })
      }else{
        setAlertConfig({
          title:"Erro",
          message:"Não foi possível cadastrar o operador."
        })
      }

    }
  }

  function handleRemoveOperator(id:string){
    
    // Precisamos achar o nome e matricula para poder colocar no log
    const operadorAlvo = operators.find(op => op.id === id)

    setConfirmConfig({
      title: "Desativar Operador",
      message: `Tem certeza que deseja desativar ${operadorAlvo?.nome || 'este operador'}? Ele será movido para a lista de inativos.`,
      onConfirm: async () => {
        await deactivateOperator(id)
        
        // LOG DE AUDITORIA
        if(operadorAlvo) {
          await logAction(
            sessionUser?.username || "sistema", 
            "operator_deactivate", 
            `Desativou/Demitou o operador: ${operadorAlvo.nome} (${operadorAlvo.matricula})`
          )
        }

        loadOperators()
      }
    })
  }

  async function handleChangePosition(
    operatorId:string,
    linha:string,
    posto:string
  ){

    // Precisamos achar o operador antes de mudar para registrar o que aconteceu
    const operadorAlvo = operators.find(op => op.id === operatorId)

    await changeOperatorPosition(
      operatorId,
      linha,
      posto
    )

    // LOG DE AUDITORIA
    if(operadorAlvo) {
      await logAction(
        sessionUser?.username || "sistema", 
        "operator_change_position", 
        `Moveu ${operadorAlvo.nome} (${operadorAlvo.matricula}) para: ${linha || 'Nenhuma linha'} / ${posto || 'Nenhum posto'}`
      )
    }

    loadOperators()
  }

  const filteredOperators = operators.filter(op => {

    const matchMatricula =
      op.matricula?.toLowerCase().includes(
        searchMatricula.toLowerCase()
      )

    const matchNome =
      op.nome?.toLowerCase().includes(
        searchNome.toLowerCase()
      )

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

  return(

    <div className="operatorsPage">

      <div className="pageHeader">

        <div>

          <h1 className="pageTitle">
            Gestão de Operadores
          </h1>

          <p className="pageSubtitle">
            Cadastre, filtre e gerencie a alocação de operadores nos modelos de produção.
          </p>

        </div>

        <div style={{display:"flex",gap:10}}>

          <button
            className="secondaryButton"
            onClick={()=>router.push("/operators/models")}
          >
            Gerenciar Modelos
          </button>

          <button
            className="secondaryButton"
            onClick={()=>router.push("/operators/skills")}
          >
            Gerenciar Skills
          </button>

          <button
            className="secondaryButton"
            onClick={()=>router.push("/operators/inactive")}
          >
            Ver Operadores Desativados
          </button>

        </div>

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
              inputMode="numeric"
              maxLength={6}
              onChange={(e)=>{
                const value = e.target.value.replace(/\D/g,"")
                setMatricula(value)
              }}
            />

            <input
              className="corporateInput"
              placeholder="Nome completo"
              maxLength={50}
              value={nome}
              onChange={e=>setNome(e.target.value)}
            />

            <select
              className="corporateInput"
              value={linha}
              onChange={e=>setLinha(e.target.value)}
            >

              <option value="">
                Selecionar modelo (Opcional)
              </option>

              {lines.map(line => (

                <option
                  key={line.id}
                  value={line.nome}
                >
                  {line.nome}
                </option>

              ))}

            </select>

            <select
              className="corporateInput"
              value={posto}
              onChange={e=>setPosto(e.target.value)}
            >

              <option value="">
                Selecionar posto (Opcional)
              </option>

              {workstations.map(ws => (

                <option
                  key={ws.id}
                  value={ws.nome}
                >
                  {ws.nome}
                </option>

              ))}

            </select>

          </div>

          <button
            className="primaryButton fullWidth mt-3"
            onClick={handleCreateOperator}
            disabled={!nome || matricula.length !== 6}
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

              <option value="">
                Todas os modelos
              </option>

              {lines.map(line => (

                <option
                  key={line.id}
                  value={line.nome}
                >
                  {line.nome}
                </option>

              ))}

            </select>

            <select
              className="corporateInput"
              value={filterPosto}
              onChange={e=>setFilterPosto(e.target.value)}
            >

              <option value="">
                Todos os postos
              </option>

              {workstations.map(ws => (

                <option
                  key={ws.id}
                  value={ws.nome}
                >
                  {ws.nome}
                </option>

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

      {/* MODAIS CORPORATIVOS */}

      {alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
              </div>
              <h3>{alertConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{alertConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button
                className="primaryButton"
                onClick={()=>setAlertConfig(null)}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
              </div>
              <h3>{confirmConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button
                className="secondaryButton"
                onClick={()=>setConfirmConfig(null)}
              >
                Cancelar
              </button>
              <button
                className="dangerButtonSolid"
                onClick={()=>{
                  confirmConfig.onConfirm()
                  setConfirmConfig(null)
                }}
              >
                Sim, desativar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  )

}