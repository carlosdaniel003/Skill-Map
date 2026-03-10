// src/components/audit/AuditPanel.tsx
"use client"

import "./AuditPanel.css"
import { useEffect, useState } from "react"

import { getLogs, clearLogs, AuditLog } from "@/services/audit/auditService"
import AuditRow from "./visual/AuditRow"

export default function AuditPanel(){

  const [logs,setLogs] = useState<AuditLog[]>([])
  
  // Estado para controlar a exibição do modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(()=>{
    loadLogs()
  },[])

  function loadLogs(){
    setLogs(getLogs())
  }

  function handleClearClick(){
    // Ao invés do confirm nativo, abrimos o nosso modal
    setShowConfirmModal(true)
  }

  function confirmClear(){
    clearLogs()
    loadLogs()
    setShowConfirmModal(false)
  }

  function cancelClear(){
    setShowConfirmModal(false)
  }

  return(

    <div className="auditPanel">

      <div className="auditHeader">
        <button 
          className="dangerButton" 
          onClick={handleClearClick}
          disabled={logs.length === 0}
          title="Apagar todo o histórico de logs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          Limpar Logs
        </button>
      </div>

      <div className="tableContainer">
        <table className="corporateTable">

          <thead>
            <tr>
              <th>Data e Hora</th>
              <th>Usuário</th>
              <th>Ação Executada</th>
              <th>Alvo</th>
              <th>Duração</th>
            </tr>
          </thead>

          <tbody>
            {logs.length > 0 ? (
              logs.map((log,index)=>(
                <AuditRow
                  key={index}
                  log={log}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="emptyState">
                  Nenhum registro de auditoria encontrado no sistema.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* NOSSO MODAL CORPORATIVO */}
      {showConfirmModal && (
        <div className="modalOverlay">
          <div className="corporateModal">
            
            <div className="modalHeader">
              <div className="modalIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>Limpar Histórico</h3>
            </div>
            
            <div className="modalBody">
              <p>Tem certeza que deseja apagar <strong>todos os registros de auditoria</strong>? Esta ação é permanente e não poderá ser desfeita.</p>
            </div>
            
            <div className="modalFooter">
              <button className="secondaryButton" onClick={cancelClear}>
                Cancelar
              </button>
              <button className="primaryDangerButton" onClick={confirmClear}>
                Sim, limpar logs
              </button>
            </div>

          </div>
        </div>
      )}

    </div>

  )

}