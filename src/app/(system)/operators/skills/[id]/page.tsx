// src/app/(system)/operators/skills/[id]/page.tsx
"use client"

import "./page.css"
import { useParams } from "next/navigation"
import { useOperatorSkills } from "./hooks/useOperatorSkills"
import OperatorSkillsTable from "./components/OperatorSkillsTable"

export default function OperatorSkillsPage(){
  const params = useParams()
  const operatorId = params.id as string

  // Agora extraímos o isLoading do nosso hook
  const { isLoading, operator, modals, table, actions } = useOperatorSkills(operatorId)

  return(
    <div className="skillsPage">

      {/* HEADER */}
      <div className="pageHeader">
        <button className="backButton" onClick={actions.handleBackClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        {/* Só mostra os dados do operador se já tiver carregado */}
        {!isLoading && operator && (
          <div className="headerInfo">
            <h1 className="pageTitle">{operator.nome}</h1>
            <div className="pageSubtitles">
              <span className="pageSubtitle">Matrícula: {operator.matricula}</span>
              <span className="subtitleDivider">•</span>
              <span className="pageSubtitle">Modelo Atual: <strong>{operator.linha_atual || "Não alocado"}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ÁREA DE CONTEÚDO (LOADING OU TABELA) */}
      {isLoading ? (
        <div className="corporateCard loadingCard">
          <div className="corporateSpinner"></div>
          <p>Analisando histórico e carregando matriz de habilidades...</p>
        </div>
      ) : (
        <OperatorSkillsTable data={table} />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE SAÍDA */}
      {modals.showConfirmLeave && (
        <div className="modalOverlay">
          <div className="corporateModal warningModal">
            
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>Atenção: Alterações não salvas!</h3>
            </div>
            
            <div className="modalBody">
              <p>Você tem alterações de Nível de Habilidade que ainda não foram salvas. Se você sair agora, <strong>todas as suas modificações serão perdidas</strong>.</p>
              <p>Deseja sair mesmo assim?</p>
            </div>
            
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => modals.setShowConfirmLeave(false)}>
                Ficar e Salvar
              </button>
              <button className="dangerButtonSolid" onClick={modals.confirmLeavePage}>
                Sair sem Salvar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}