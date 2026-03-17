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
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Gestão de Operadores</h1>
          <p className="pageSubtitle">
            Cadastre, filtre e gerencie a alocação de operadores nos modelos de produção.
          </p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="secondaryButton" onClick={navigation.goToModels}>Gerenciar Modelos</button>
          <button className="secondaryButton" onClick={navigation.goToSkills}>Gerenciar Skills</button>
          <button className="secondaryButton" onClick={navigation.goToInactive}>Ver Operadores Desativados</button>
        </div>
      </div>

      <div className="actionPanels">
        <OperatorForm data={form} />
        <OperatorFilters data={filters} />
      </div>

      {/* TABELA DE OPERADORES */}
      <div className="corporateCard tableCard">
        <OperatorTable
          operators={table.filteredOperators}
          lines={table.lines}
          workstations={table.workstations}
          onRemove={table.handleRemoveOperator}
          onChangeLine={table.handleChangePosition}
          onChangePosto={table.handleChangePosition}
        />
      </div>

      {/* MODAIS CORPORATIVOS */}
      {modals.alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="modalBody"><p>{modals.alertConfig.message}</p></div>
            <div className="modalFooter">
              <button className="primaryButton" onClick={()=>modals.setAlertConfig(null)}>Entendi</button>
            </div>
          </div>
        </div>
      )}

      {modals.confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
              <h3>{modals.confirmConfig.title}</h3>
            </div>
            <div className="modalBody"><p>{modals.confirmConfig.message}</p></div>
            <div className="modalFooter">
              <button className="secondaryButton" onClick={()=>modals.setConfirmConfig(null)}>Cancelar</button>
              <button className="dangerButtonSolid" onClick={()=>{ modals.confirmConfig!.onConfirm(); modals.setConfirmConfig(null); }}>Sim, desativar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}