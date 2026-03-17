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
          <button onClick={() => setShowInactive(!showInactive)} className="secondaryButton">
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
              .filter((exp: any) => showInactive ? exp.ativo === false : exp.ativo !== false)
              .map((exp: any) => {
                const months = calculateMonths(exp.data_inicio, exp.data_fim)
                return (
                  <tr key={exp.id} className={exp.ativo === false ? "inactiveRow" : ""}>
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
                            onClick={() => handleActivate(exp.id, exp.origem)}
                            title="Reativar Histórico"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          </button>
                        ) : (
                          <button
                            className="actionIconBtn deactivateBtn"
                            onClick={() => handleDeactivate(exp.id, exp.origem)}
                            title="Desativar Histórico"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                )
              })}
            {history.filter((exp: any) => showInactive ? exp.ativo === false : exp.ativo !== false).length === 0 && (
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
  )
}