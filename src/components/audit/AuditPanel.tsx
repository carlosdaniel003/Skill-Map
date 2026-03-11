// src/components/audit/AuditPanel.tsx
"use client"

import "./AuditPanel.css"
import { useEffect, useState } from "react"
import { getLogs, clearLogs } from "@/services/audit/auditService"
import { AuditLog } from "@/core/auth/authTypes"

export default function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuditData()
  }, [])

  async function loadAuditData() {
    setLoading(true)
    const data = await getLogs(100) // Traz os últimos 100 logs
    setLogs(data)
    setLoading(false)
  }

  async function handleClearLogs() {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de auditoria?")) return
    await clearLogs()
    await loadAuditData()
  }

  if (loading) {
    return <div className="auditPanelLoading">Carregando logs...</div>
  }

  return (
    <div className="auditPanelContainer">
      <div className="auditPanelHeader">
        <span>Últimas ações do sistema</span>
        <button className="secondaryButton smallButton" onClick={handleClearLogs}>
          Limpar Histórico
        </button>
      </div>

      <div className="auditList">
        {logs.length === 0 ? (
          <div className="emptyAudit">Nenhuma ação registrada recentemente.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="auditItem">
              <div className="auditTime">
                {new Date(log.created_at!).toLocaleString()}
              </div>
              <div className="auditContent">
                <strong>{log.username}</strong> realizou <em>{log.action}</em>
                {log.details && ` (${log.details})`}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="auditFooter">
        <button className="secondaryButton smallButton" onClick={loadAuditData}>
          Atualizar Logs
        </button>
      </div>
    </div>
  )
}