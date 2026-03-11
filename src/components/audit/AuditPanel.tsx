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
    const data = await getLogs(100) // Limite de 100 ações
    setLogs(data)
    setLoading(false)
  }

  async function handleClearLogs() {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de auditoria?")) return
    await clearLogs()
    await loadAuditData()
  }

  // Mapeia o nome interno da ação para algo legível no painel
  function formatAction(action: string) {
    const map: Record<string, string> = {
      "login": "Login",
      "create_user": "Criou Usuário",
      "remove_user": "Removeu Usuário",
      "change_password": "Alterou Senha",
      "update_permissions": "Editou Acessos"
    }
    return map[action] || action
  }

  if (loading) {
    return <div className="auditLoading">Carregando histórico de auditoria...</div>
  }

  return (
    <div className="auditPanelContainer">
      
      <div className="auditPanelActions">
        <button className="secondaryButton smallButton" onClick={loadAuditData}>
          Atualizar Logs
        </button>
        <button className="dangerButton smallButton" onClick={handleClearLogs}>
          Limpar Histórico
        </button>
      </div>

      <div className="auditTableWrapper">
        <table className="corporateTable">
          <thead>
            <tr>
              <th>Data e Hora</th>
              <th>Usuário (Autor)</th>
              <th>Ação</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="timeCell">
                  {new Date(log.created_at!).toLocaleString("pt-BR")}
                </td>
                <td className="fontWeight600 authorCell">{log.username}</td>
                <td>
                  <span className={`auditBadge action-${log.action}`}>
                    {formatAction(log.action)}
                  </span>
                </td>
                <td className="detailsCell">{log.details}</td>
              </tr>
            ))}
            
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="emptyState">Nenhuma ação registrada recentemente no sistema.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}