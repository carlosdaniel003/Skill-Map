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
    <div className="modHistoryPage">

      {/* HEADER */}
      <div className="modHistoryHeader">
        <div className="modHistoryHeaderLeft">
          <div className="modHistoryIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          
          <div className="modHistoryTitleBlock">
            {operator ? (
              <>
                <h1 className="modHistoryTitle">{operator.nome}</h1>
                <div className="modHistorySubtitles">
                  <span className="modHistoryBadge">Mat: {operator.matricula}</span>
                </div>
              </>
            ) : (
              <>
                <h1 className="modHistoryTitle">Carregando...</h1>
                <p className="modHistorySubtitle">Buscando informações do operador</p>
              </>
            )}
          </div>
        </div>

        <button className="modHistorySecondaryBtn" onClick={handleBack} title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>
      </div>

      <div className="modHistoryGrid">
        <HistoryForm data={form} />
        <HistoryTable data={table} />
      </div>

      {/* MODAL DE ALERTA */}
      {modals.alertConfig && (
        <div className="modHistoryModalOverlay">
          <div className="modHistoryModal">
            <div className="modHistoryModalHeader">
              <div className="modHistoryModalIcon warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="modHistoryModalBody">
              <p>{modals.alertConfig.message}</p>
            </div>
            <div className="modHistoryModalFooter">
              <button className="modHistoryPrimaryBtn" onClick={() => modals.setAlertConfig(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      {modals.confirmConfig && (
        <div className="modHistoryModalOverlay">
          <div className="modHistoryModal">
            <div className="modHistoryModalHeader">
              <div className="modHistoryModalIcon warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>{modals.confirmConfig.title}</h3>
            </div>
            <div className="modHistoryModalBody">
              <p>{modals.confirmConfig.message}</p>
            </div>
            <div className="modHistoryModalFooter">
              <button className="modHistoryGhostBtn" onClick={() => modals.setConfirmConfig(null)}>
                Cancelar
              </button>
              <button 
                className="modHistoryDangerBtn" 
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