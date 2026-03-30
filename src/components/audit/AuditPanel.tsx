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
      // ACESSOS
      "login": "Login",
      "create_user": "Criou Usuário",
      "remove_user": "Removeu Usuário",
      "change_password": "Alterou Senha",
      "update_permissions": "Editou Acessos",
      
      // OPERADORES
      "operator_create": "Cadastrou Operador",
      "operator_deactivate": "Desativou Operador",
      "operator_reactivate": "Reativou Operador",
      "operator_change_position": "Alterou Posição",
      
      // MODELOS / LINHAS
      "model_create": "Criou Modelo",
      "model_edit": "Editou Modelo",
      "model_toggle": "Status de Modelo",
      
      // SKILLS
      "skill_create": "Criou Skill",
      "skill_edit": "Editou Skill",
      "skill_toggle": "Status de Skill",
      "skill_level_update": "Avaliou Operador",
      
      // HISTÓRICO
      "history_add": "Adicionou Experiência",
      "history_toggle": "Status de Experiência",
      "history_remove": "Removeu Experiência"
    }
    return map[action] || action
  }

  // Define a categoria geral para facilitar o CSS das cores
  function getActionCategory(action: string) {
    if (action.includes("user") || action.includes("password") || action.includes("permission") || action === "login") return "access";
    if (action.includes("operator")) return "operator";
    if (action.includes("model")) return "model";
    if (action.includes("skill")) return "skill";
    if (action.includes("history")) return "history";
    return "default";
  }

  if (loading) {
    return (
      <div className="modAuditLoading">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinIcon">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Carregando histórico de auditoria...</span>
      </div>
    )
  }

  return (
    <div className="modAuditPanelContainer">
      
      <div className="modAuditPanelActions">
        <button className="modAuditSecondaryButton" onClick={loadAuditData} title="Atualizar Logs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
          Atualizar Logs
        </button>
        <button className="modAuditDangerButton" onClick={handleClearLogs} title="Limpar Histórico">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          Limpar Histórico
        </button>
      </div>

      <div className="modAuditTableWrapper">
        <table className="modAuditTable">
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
                  <span className={`modAuditBadge action-${getActionCategory(log.action)}`}>
                    {formatAction(log.action)}
                  </span>
                </td>
                <td className="detailsCell">{log.details}</td>
              </tr>
            ))}
            
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="emptyState">
                  <div className="emptyStateContent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    <span>Nenhuma ação registrada recentemente no sistema.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}