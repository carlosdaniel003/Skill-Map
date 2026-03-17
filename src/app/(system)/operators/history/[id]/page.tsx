// src/app/(system)/operators/history/[id]/page.tsx
"use client"

import "./page.css"
import { useParams } from "next/navigation"
import { useOperatorHistory } from "./hooks/useOperatorHistory"
import HistoryForm from "./components/HistoryForm"
import HistoryTable from "./components/HistoryTable"

export default function OperatorHistoryPage() {
  const params = useParams()
  const operatorId = params.id as string

  const { operator, modals, form, table, handleBack } = useOperatorHistory(operatorId)

  return (
    <div className="historyPage">

      {/* HEADER */}
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
        <HistoryForm data={form} />
        <HistoryTable data={table} />
      </div>

      {/* MODAL DE ALERTA */}
      {modals.alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{modals.alertConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button className="primaryButton" onClick={() => modals.setAlertConfig(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      {modals.confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>{modals.confirmConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{modals.confirmConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => modals.setConfirmConfig(null)}>
                Cancelar
              </button>
              <button 
                className="dangerButtonSolid" 
                onClick={() => {
                  modals.confirmConfig!.onConfirm();
                  modals.setConfirmConfig(null);
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