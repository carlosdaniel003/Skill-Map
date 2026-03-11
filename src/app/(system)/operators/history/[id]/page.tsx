// src/app/(system)/operators/history/[id]/page.tsx
"use client"

import "./page.css"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import {
  getProductionLines,
  getWorkstations,
  addOperatorExperience,
  getFullOperatorHistory,
  deleteOperatorExperience,
  deactivateOperatorExperience,
  activateOperatorExperience,
  getOperators,
  deactivateOperatorHistory,
  activateOperatorHistory
} from "@/services/database/operatorRepository"

// IMPORTAÇÕES PARA AUDITORIA
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export default function OperatorHistoryPage(){

  const params = useParams()
  const router = useRouter()

  const operatorId = params.id as string

  const [operator,setOperator] = useState<any>(null)

  const [lines,setLines] = useState<any[]>([])
  const [workstations,setWorkstations] = useState<any[]>([])
  const [history,setHistory] = useState<any[]>([])

  const [showInactive,setShowInactive] = useState(false)

  const [linha,setLinha] = useState("")
  const [posto,setPosto] = useState("")
  const [dataInicio,setDataInicio] = useState("")
  const [dataFim,setDataFim] = useState("")
  const [skill,setSkill] = useState(1)

  // ESTADOS PARA OS MODAIS CORPORATIVOS
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)

  // SESSÃO DO USUÁRIO
  const sessionUser = getSession()

  useEffect(()=>{
    loadOperator()
    loadLines()
    loadWorkstations()
    loadHistory()
  },[])

  function handleDeactivate(id:string, origem:string){
    const targetExp = history.find(e => e.id === id)

    setConfirmConfig({
      title: "Desativar Experiência",
      message: "Deseja realmente desativar esta experiência do histórico do operador?",
      onConfirm: async () => {
        if(origem === "movimentacao"){
          await deactivateOperatorHistory(id)
        }else{
          await deactivateOperatorExperience(id)
        }

        // LOG DE AUDITORIA
        if(targetExp) {
          await logAction(
            sessionUser?.username || "sistema", 
            "history_toggle", 
            `Desativou histórico de ${operator?.nome}: ${targetExp.linha} - ${targetExp.posto}`
          )
        }

        loadHistory()
      }
    })
  }

  async function handleActivate(id:string, origem:string){
    const targetExp = history.find(e => e.id === id)

    if(origem === "movimentacao"){
      await activateOperatorHistory(id)
    }else{
      await activateOperatorExperience(id)
    }

    // LOG DE AUDITORIA
    if(targetExp) {
      await logAction(
        sessionUser?.username || "sistema", 
        "history_toggle", 
        `Reativou histórico de ${operator?.nome}: ${targetExp.linha} - ${targetExp.posto}`
      )
    }

    loadHistory()
  }

  async function loadOperator(){
    const operators = await getOperators()
    const op = operators.find((o:any)=>o.id === operatorId)
    setOperator(op)
  }

  async function loadLines(){
    const data = await getProductionLines()
    setLines(data)
  }

  async function loadWorkstations(){
    const data = await getWorkstations()
    setWorkstations(data)
  }

  async function loadHistory(){
    const data = await getFullOperatorHistory(operatorId)
    setHistory(data)
  }

  function calculateMonths(start:string,end?:string){
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()

    const years = endDate.getFullYear() - startDate.getFullYear()
    const months = endDate.getMonth() - startDate.getMonth()

    return years * 12 + months
  }

  function translateOrigin(origem:string){
    if(origem === "movimentacao") return "Movimentação"
    if(origem === "experiencia") return "Entrevista"
    return "-"
  }

  async function handleSave(){
    const today = new Date().toISOString().split("T")[0]

    if(!linha || !posto || !dataInicio){
      setAlertConfig({
        title: "Atenção",
        message: "Por favor, preencha modelo, posto e data de início para registrar."
      })
      return
    }

    if(dataInicio > today){
      setAlertConfig({
        title: "Data Inválida",
        message: "A data de início não pode ser no futuro."
      })
      return
    }

    if(dataFim && dataFim < dataInicio){
      setAlertConfig({
        title: "Data Inválida",
        message: "A data final não pode ser menor que a data de início."
      })
      return
    }

    if(dataFim && dataFim > today){
      setAlertConfig({
        title: "Data Inválida",
        message: "A data final não pode ser no futuro."
      })
      return
    }

    for(const exp of history){
      const inicioExistente = new Date(exp.data_inicio)
      const fimExistente = exp.data_fim ? new Date(exp.data_fim) : new Date()
      const inicioNovo = new Date(dataInicio)
      const fimNovo = dataFim ? new Date(dataFim) : new Date()

      const overlap = inicioNovo <= fimExistente && fimNovo >= inicioExistente

      if(overlap){
        setAlertConfig({
          title: "Conflito de Datas",
          message: "Já existe uma experiência registrada neste período para este operador."
        })
        return
      }
    }

    await addOperatorExperience({
      operator_id:operatorId,
      linha,
      posto,
      data_inicio:dataInicio,
      data_fim:dataFim || undefined,
      skill_level:skill
    })

    // LOG DE AUDITORIA
    await logAction(
      sessionUser?.username || "sistema", 
      "history_add", 
      `Add exp. manual p/ ${operator?.nome}: ${linha} - ${posto} (Nvl ${skill})`
    )

    setLinha("")
    setPosto("")
    setDataInicio("")
    setDataFim("")
    setSkill(1)

    loadHistory()
  }

  function handleRemove(id:string){
    const targetExp = history.find(e => e.id === id)

    setConfirmConfig({
      title: "Remover Experiência",
      message: "Tem certeza que deseja remover esta experiência permanentemente?",
      onConfirm: async () => {
        await deleteOperatorExperience(id)
        
        // LOG DE AUDITORIA
        if(targetExp) {
          await logAction(
            sessionUser?.username || "sistema", 
            "history_remove", 
            `Removeu histórico de ${operator?.nome}: ${targetExp.linha} - ${targetExp.posto}`
          )
        }

        loadHistory()
      }
    })
  }

  function handleBack(){
    router.push("/operators")
  }

  return(

    <div className="historyPage">

      <div className="pageHeader">
        <button className="backButton" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        {operator && (
          <div className="headerTitle">
            <h1 className="pageTitle">{operator.nome}</h1>
            <span className="pageSubtitle">Matrícula: {operator.matricula}</span>
          </div>
        )}
      </div>

      <div className="historyGrid">

        {/* FORMULÁRIO DE NOVA EXPERIÊNCIA */}
        <div className="corporateCard formCard">
          <h2>Adicionar Experiência Manual</h2>

          <div className="formGrid">
            
            <div className="inputGroup">
              <label>Modelo</label>
              <select className="corporateInput" value={linha} onChange={e=>setLinha(e.target.value)}>
                <option value="">Selecionar modelo</option>
                {lines.map(line => (
                  <option key={line.id} value={line.nome}>{line.nome}</option>
                ))}
              </select>
            </div>

            <div className="inputGroup">
              <label>Posto de Trabalho</label>
              <select className="corporateInput" value={posto} onChange={e=>setPosto(e.target.value)}>
                <option value="">Selecionar posto</option>
                {workstations.map(ws => (
                  <option key={ws.id} value={ws.nome}>{ws.nome}</option>
                ))}
              </select>
            </div>

            <div className="inputGroup">
              <label>Data de Início</label>
              <input className="corporateInput" type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} />
            </div>

            <div className="inputGroup">
              <label>Data Fim (Opcional)</label>
              <input className="corporateInput" type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} />
            </div>

            <div className="inputGroup">
              <label>Nível de Skill Inicial</label>
              <select className="corporateInput" value={skill} onChange={e=>setSkill(Number(e.target.value))}>
                <option value={1}>Nível 1 - Nunca fez</option>
                <option value={2}>Nível 2 - Em treinamento</option>
                <option value={3}>Nível 3 - Apto a operar</option>
                <option value={4}>Nível 4 - Especialista</option>
                <option value={5}>Nível 5 - Instrutor</option>
              </select>
            </div>

          </div>

          <button 
            className="primaryButton fullWidth mt-3" 
            onClick={handleSave}
            disabled={!linha || !posto || !dataInicio}
          >
            Registrar Experiência
          </button>

        </div>

        {/* TABELA DE HISTÓRICO */}
        <div className="corporateCard tableCard">
          
          <div className="cardHeader">
            <h2>Histórico Registrado</h2>
            <div className="tableActions">
              <button onClick={loadHistory} className="secondaryButton iconTextButton">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                Atualizar
              </button>
              <button onClick={()=>setShowInactive(!showInactive)} className="secondaryButton">
                {showInactive ? "Ocultar Desativadas" : "Ver Desativadas"}
              </button>
            </div>
          </div>

          <div className="tableContainer">
            <table className="corporateTable">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Posto</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Tempo</th>
                  <th>Nível</th>
                  <th>Origem</th>
                  <th className="actionColumn">Ações</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .filter((exp:any)=>{
                    if(showInactive) return exp.ativo === false
                    return exp.ativo !== false
                  })
                  .map((exp:any)=>{
                    const months = calculateMonths(exp.data_inicio, exp.data_fim)
                    return(
                      <tr 
                        key={exp.id} 
                        className={exp.ativo === false ? "inactiveRow" : ""}
                      >
                        <td className="fontWeight500">{exp.linha}</td>
                        <td>{exp.posto}</td>
                        <td>{new Date(exp.data_inicio).toLocaleDateString()}</td>
                        <td>{exp.data_fim ? new Date(exp.data_fim).toLocaleDateString() : "Atual"}</td>
                        <td>{months} meses</td>
                        <td>
                          <span className={`skillBadge level-${exp.skill_level || 1}`}>
                            Lvl {exp.skill_level || "-"}
                          </span>
                        </td>
                        <td>{translateOrigin(exp.origem)}</td>
                        <td className="actionColumn">
                          {exp.id && (
                            exp.ativo === false ? (
                              <button
                                className="actionIconBtn reactivateBtn"
                                onClick={()=>handleActivate(exp.id, exp.origem)}
                                title="Reativar Histórico"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                  <path d="M3 3v5h5"/>
                                </svg>
                              </button>
                            ) : (
                              <button
                                className="actionIconBtn deactivateBtn"
                                onClick={()=>handleDeactivate(exp.id, exp.origem)}
                                title="Desativar Histórico"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="m15 9-6 6"/>
                                  <path d="m9 9 6 6"/>
                                </svg>
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    )
                  })}
                {history.filter((exp:any)=> showInactive ? exp.ativo === false : exp.ativo !== false).length === 0 && (
                  <tr>
                    <td colSpan={8} className="emptyState">
                      Nenhum histórico encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* =========================================
          MODAIS CORPORATIVOS
          ========================================= */}

      {/* 1. ALERT MODAL */}
      {alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <button className="primaryButton" onClick={() => setAlertConfig(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRM MODAL (Para Desativar/Remover) */}
      {confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>{confirmConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => setConfirmConfig(null)}>
                Cancelar
              </button>
              <button 
                className="dangerButtonSolid" 
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  )

}