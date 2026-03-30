// src/app/(system)/operators/inactive/page.tsx
"use client"

import "./page.css"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  activateOperator
} from "@/services/database/operatorRepository"

import { supabase } from "@/services/database/supabaseClient"

// IMPORTAÇÕES PARA AUDITORIA
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export default function InactiveOperatorsPage(){

  const router = useRouter()

  const [operators,setOperators] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  // Estado para controlar o modal de confirmação de reativação
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)

  // SESSÃO DO USUÁRIO
  const sessionUser = getSession()

  useEffect(()=>{
    loadInactiveOperators()
  },[])

  async function loadInactiveOperators(){
    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("ativo",false)
      .order("nome")

    if(error){
      console.error(error)
      return
    }

    setOperators(data || [])
    setLoading(false)
  }

  function handleActivateClick(id:string, nome:string, matricula:string){
    // Abre o nosso modal corporativo ao invés do confirm nativo
    setConfirmConfig({
      title: "Reativar Operador",
      message: `Tem certeza que deseja reativar o acesso de "${nome}"? Ele voltará para a lista de operadores ativos.`,
      onConfirm: async () => {
        await activateOperator(id)
        
        // LOG DE AUDITORIA
        await logAction(
          sessionUser?.username || "sistema", 
          "operator_reactivate", 
          `Reativou o operador: ${nome} (${matricula})`
        )

        loadInactiveOperators()
      }
    })
  }

  function handleBack(){
    router.push("/operators")
  }

  if(loading){
    return (
      <div className="modInactivePage">
        <div className="modInactiveLoadingState">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modInactiveSpinIcon">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p>Carregando registros de operadores desativados...</p>
        </div>
      </div>
    )
  }

  return(

    <div className="modInactivePage">

      <div className="modInactiveHeader">
        <div className="modInactiveHeaderLeft">
          <div className="modInactiveIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="17" y1="8" x2="23" y2="14"/>
              <line x1="23" y1="8" x2="17" y2="14"/>
            </svg>
          </div>
          <div className="modInactiveTitleBlock">
            <h1 className="modInactiveTitle">Operadores Desativados</h1>
            <p className="modInactiveSubtitle">Visualize e reative operadores que foram desligados ou afastados.</p>
          </div>
        </div>

        <button className="modInactiveSecondaryBtn" onClick={handleBack} title="Voltar para Gestão">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </button>
      </div>

      <div className="modInactiveCard">
        
        <div className="modInactiveTableWrapper">
          <table className="modInactiveTable">

            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome Completo</th>
                <th>Último Modelo</th>
                <th>Último Posto</th>
                <th className="actionColumn">Ações</th>
              </tr>
            </thead>

            <tbody>
              {operators.length > 0 ? (
                operators.map(op => (
                  <tr key={op.id}>
                    <td className="fw-600">{op.matricula}</td>
                    <td>{op.nome}</td>
                    <td>
                      <span className={!op.linha_atual ? "emptyText" : ""}>
                        {op.linha_atual || "Não alocado"}
                      </span>
                    </td>
                    <td>
                      <span className={!op.posto_atual ? "emptyText" : ""}>
                        {op.posto_atual || "Não alocado"}
                      </span>
                    </td>
                    <td className="actionColumn">
                      <button
                        className="modInactiveActionBtn success"
                        onClick={()=>handleActivateClick(op.id, op.nome, op.matricula)}
                        title="Reativar Operador"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Reativar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="modInactiveEmptyState">
                    <div className="emptyStateContent">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      Nenhum operador desativado no momento.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

      {/* =========================================
          MODAL CORPORATIVO (Reativação)
          ========================================= */}
      {confirmConfig && (
        <div className="modInactiveModalOverlay">
          <div className="modInactiveModal">
            
            <div className="modInactiveModalHeader">
              {/* Ícone verde de sucesso/reativação */}
              <div className="modInactiveModalIcon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3>{confirmConfig.title}</h3>
            </div>
            
            <div className="modInactiveModalBody">
              <p>{confirmConfig.message}</p>
            </div>
            
            <div className="modInactiveModalFooter">
              <button className="modInactiveGhostBtn" onClick={() => setConfirmConfig(null)}>
                Cancelar
              </button>
              {/* Botão verde para ação positiva */}
              <button 
                className="modInactiveSuccessBtn" 
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Sim, reativar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>

  )

}