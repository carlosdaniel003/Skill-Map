// src/app/(system)/operators/skills/[id]/page.tsx
"use client"

import "./page.css"
import { useParams } from "next/navigation"
import { useOperatorSkills } from "./hooks/useOperatorSkills"
import OperatorSkillsTable from "./components/OperatorSkillsTable"

export default function OperatorSkillsPage(){
  const params = useParams()
  const operatorId = params.id as string

  const { isLoading, operator, modals, table, actions } = useOperatorSkills(operatorId)

  return(
    <div className="modOpSkillsPage">

      {/* HEADER */}
      <div className="modOpSkillsHeader">
        <div className="modOpSkillsHeaderLeft">
          
          <div className="modOpSkillsIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
          </div>

          <div className="modOpSkillsHeaderInfo">
            {isLoading || !operator ? (
              <>
                <h1 className="modOpSkillsTitle">Carregando Operador...</h1>
                <p className="modOpSkillsSubtitle">Buscando informações no banco de dados</p>
              </>
            ) : (
              <>
                <h1 className="modOpSkillsTitle">{operator.nome}</h1>
                <div className="modOpSkillsSubtitles">
                  <span className="modOpSkillsBadge">Mat: {operator.matricula}</span>
                  <span className="modOpSkillsDivider">•</span>
                  <span className="modOpSkillsText">Modelo: <strong>{operator.linha_atual || "Não alocado"}</strong></span>
                </div>
              </>
            )}
          </div>
        </div>

        <button className="modOpSkillsSecondaryBtn" onClick={actions.handleBackClick} title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO (LOADING OU TABELA) */}
      {isLoading ? (
        <div className="modOpSkillsCard modOpSkillsLoadingCard">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modOpSkillsSpinner">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p>Analisando histórico e montando matriz de habilidades do operador...</p>
        </div>
      ) : (
        <OperatorSkillsTable data={table} />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE SAÍDA */}
      {modals.showConfirmLeave && (
        <div className="modOpSkillsModalOverlay">
          <div className="modOpSkillsModal">
            
            <div className="modOpSkillsModalHeader">
              <div className="modOpSkillsModalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>Atenção: Alterações não salvas!</h3>
            </div>
            
            <div className="modOpSkillsModalBody">
              <p>Você tem alterações de Nível de Habilidade que ainda não foram salvas. Se você sair agora, <strong>todas as suas modificações serão perdidas</strong>.</p>
              <p>Deseja sair mesmo assim?</p>
            </div>
            
            <div className="modOpSkillsModalFooter">
              <button className="modOpSkillsGhostBtn" onClick={() => modals.setShowConfirmLeave(false)}>
                Ficar e Salvar
              </button>
              <button className="modOpSkillsDangerBtn" onClick={modals.confirmLeavePage}>
                Sair sem Salvar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}