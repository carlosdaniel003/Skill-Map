// src/components/audit/AuditPanel.tsx
"use client"

import "./AuditPanel.css"
import { useEffect, useState } from "react"

import { getLogs, clearLogs, AuditLog } from "@/services/audit/auditService"
import AuditRow from "./visual/AuditRow"

export default function AuditPanel(){

  const [logs,setLogs] = useState<AuditLog[]>([])

  useEffect(()=>{
    loadLogs()
  },[])

  function loadLogs(){
    setLogs(getLogs())
  }

  function handleClear(){
    if(!confirm("Tem certeza que deseja limpar todos os registros de auditoria?")) return

    clearLogs()
    loadLogs()
  }

  return(

    <div className="auditPanel">

      <div className="auditHeader">
        <button 
          className="dangerButton" 
          onClick={handleClear}
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
                <td colSpan={4} className="emptyState">
                  Nenhum registro de auditoria encontrado no sistema.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>

  )

}