// src/app/(system)/operators/page.tsx
"use client"

import "./page.css"
import OperatorTable from "@/components/operators/OperatorTable"
import { useOperators } from "./hooks/useOperators"
import OperatorForm from "./components/OperatorForm"
import OperatorFilters from "./components/OperatorFilters"

export default function OperatorsPage() {
  
  const { modals, form, filters, table, navigation } = useOperators()

  return(
    <div className="operatorsPage">

      {/* HEADER E NAVEGAÇÃO */}
      <div className="opPageHeader">
        <div className="opHeaderLeft">
          <div className="opHeaderIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h1 className="opPageTitle">Gestão de Operadores</h1>
            <p className="opPageSubtitle">
              Cadastre, filtre e gerencie a alocação de operadores nos modelos de produção.
            </p>
          </div>
        </div>
        
        <div className="opHeaderActions">
          <button className="opSecondaryBtn" onClick={navigation.goToModels}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Gerenciar Modelos
          </button>
          <button className="opSecondaryBtn" onClick={navigation.goToSkills}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Gerenciar Skills
          </button>
          <button className="opSecondaryBtn" onClick={navigation.goToInactive}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>
            Operadores Desativados
          </button>
        </div>
      </div>

      <div className="opActionPanels">
        <OperatorForm data={form} />
        <OperatorFilters data={filters} />
      </div>

      {/* TABELA DE OPERADORES */}
      <div className="opCard opTableCard">
        
        {/* 🆕 NOVO CABEÇALHO DA TABELA */}
        <div className="opTableCardHeader">
          <div className="opTableCardIcon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="opTableCardTitleBlock">
            <h2 className="opTableCardTitle">Lista de Operadores</h2>
            <p className="opTableCardSubtitle">Gerencie todos os colaboradores cadastrados e filtrados no sistema.</p>
          </div>
        </div>

        <OperatorTable
          operators={table.filteredOperators}
          lines={table.lines}
          workstations={table.workstations}
          onRemove={table.handleRemoveOperator}
          onChangeLine={table.handleChangePosition}
        />
      </div>

      {/* MODAIS CORPORATIVOS */}
      {modals.alertConfig && (
        <div className="opModalOverlay">
          <div className="opModal">
            <div className="opModalHeader">
              <div className={`opModalIcon ${modals.alertConfig.title === "Sucesso" ? "successIcon" : "warningIcon"}`}>
                {modals.alertConfig.title === "Sucesso" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                )}
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="opModalBody">
              <p>{modals.alertConfig.message}</p>
            </div>
            <div className="opModalFooter">
              <button className="opPrimaryBtn" onClick={()=>modals.setAlertConfig(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.confirmConfig && (
        <div className="opModalOverlay">
          <div className="opModal">
            <div className="opModalHeader">
              <div className="opModalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
              <h3>{modals.confirmConfig.title}</h3>
            </div>
            <div className="opModalBody">
              <p>{modals.confirmConfig.message}</p>
            </div>
            <div className="opModalFooter">
              <button className="opGhostBtn" onClick={()=>modals.setConfirmConfig(null)}>
                Cancelar
              </button>
              <button className="opDangerBtnSolid" onClick={()=>{ modals.confirmConfig!.onConfirm(); modals.setConfirmConfig(null); }}>
                Sim, confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}