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

    if(!confirm("Limpar logs?")) return

    clearLogs()

    loadLogs()

  }

  return(

    <div className="auditPanel">

      <div className="auditHeader">

        <h2>Painel de Auditoria</h2>

        <button onClick={handleClear}>
          Limpar Logs
        </button>

      </div>

      <table className="auditTable">

        <thead>
          <tr>
            <th>Data</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Alvo</th>
          </tr>
        </thead>

        <tbody>

          {logs.map((log,index)=>(

            <AuditRow
              key={index}
              log={log}
            />

          ))}

        </tbody>

      </table>

    </div>

  )

}