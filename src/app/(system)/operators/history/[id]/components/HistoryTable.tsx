// src/app/(system)/operators/history/[id]/components/HistoryTable.tsx
import React from 'react'
import "./HistoryTable.css"

export default function HistoryTable({ data }: { data: any }) {
  const {
    history, showInactive, setShowInactive,
    loadHistory, handleActivate, handleDeactivate
  } = data

  // Funções utilitárias mantidas dentro do componente que as utiliza
  function calculateMonths(start: string, end?: string) {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()
    const years = endDate.getFullYear() - startDate.getFullYear()
    const months = endDate.getMonth() - startDate.getMonth()
    return years * 12 + months
  }

  function translateOrigin(origem: string) {
    if (origem === "movimentacao") return "Movimentação"
    if (origem === "experiencia") return "Entrevista"
    return "-"
  }

  return (
    <div className="modHistTable-card">
      <div className="modHistTable-header">
        <div className="modHistTable-titleWrap">
          <div className="modHistTable-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/></svg>
          </div>
          <h2>Histórico Registrado</h2>
        </div>
        
        <div className="modHistTable-actions">
          <button onClick={loadHistory} className="modHistTable-secondaryBtn" title="Atualizar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span>Atualizar</span>
          </button>
          <button onClick={() => setShowInactive(!showInactive)} className="modHistTable-secondaryBtn">
            {showInactive ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <span>Ocultar Desativadas</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Ver Desativadas</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="modHistTable-container">
        <table className="modHistTable-table">
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
              .filter((exp: any) => showInactive ? exp.ativo === false : exp.ativo !== false)
              .map((exp: any) => {
                const months = calculateMonths(exp.data_inicio, exp.data_fim)
                return (
                  <tr key={exp.id} className={exp.ativo === false ? "inactiveRow" : ""}>
                    <td className="fw-600">{exp.linha}</td>
                    <td>{exp.posto}</td>
                    <td>{new Date(exp.data_inicio).toLocaleDateString('pt-BR')}</td>
                    <td>{exp.data_fim ? new Date(exp.data_fim).toLocaleDateString('pt-BR') : "Atual"}</td>
                    <td>{months} meses</td>
                    <td>
                      <span className={`modHistTable-badge level-${exp.skill_level || 1}`}>
                        Lvl {exp.skill_level || "-"}
                      </span>
                    </td>
                    <td>{translateOrigin(exp.origem)}</td>
                    <td className="actionColumn">
                      {exp.id && (
                        exp.ativo === false ? (
                          <button
                            className="modHistTable-actionBtn reactivate"
                            onClick={() => handleActivate(exp.id, exp.origem)}
                            title="Reativar Histórico"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          </button>
                        ) : (
                          <button
                            className="modHistTable-actionBtn deactivate"
                            onClick={() => handleDeactivate(exp.id, exp.origem)}
                            title="Desativar Histórico"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                )
              })}
            {history.filter((exp: any) => showInactive ? exp.ativo === false : exp.ativo !== false).length === 0 && (
              <tr>
                <td colSpan={8} className="modHistTable-emptyState">
                  <div className="emptyStateContent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    Nenhum histórico encontrado para exibição.
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