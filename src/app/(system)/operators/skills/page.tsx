// src/app/(system)/operators/skills/page.tsx
"use client"

import "./page.css"
import { useManageSkills } from "./hooks/useManageSkills"
import BaseSkillsTab from "./components/BaseSkillsTab"
import MatrixSkillsTab from "./components/MatrixSkillsTab"

export default function SkillsPage(){
  const { tabs, modals, base, matrix, handleBackClick } = useManageSkills()

  return(
    <div className="manageSkillsPage">
      
      {/* HEADER E NAVEGAÇÃO */}
      <div className="pageHeader">
        <button className="backButton" onClick={handleBackClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </button>
        <div className="headerTitle">
          <h1 className="pageTitle">Gerenciar Skills & Dificuldades</h1>
          <p className="pageSubtitle">Crie as habilidades e defina os níveis de exigência para cada modelo de produção.</p>
        </div>
      </div>

      {/* ABAS */}
      <div className="skillsTabs">
        <button 
          className={`tabButton ${tabs.activeTab === "base" ? "active" : ""}`}
          onClick={() => tabs.handleTabChange("base")}
        >
          1. Cadastro Base de Skills
        </button>
        <button 
          className={`tabButton ${tabs.activeTab === "matrix" ? "active" : ""}`}
          onClick={() => tabs.handleTabChange("matrix")}
        >
          2. Matriz de Dificuldades (Por Modelo)
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {tabs.activeTab === "base" && <BaseSkillsTab data={base} />}
      {tabs.activeTab === "matrix" && <MatrixSkillsTab data={matrix} />}

      {/* MODAIS NORMAIS */}
      {modals.alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className={`modalIcon ${modals.alertConfig.title === "Sucesso" ? "successIcon" : "warningIcon"}`}>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3>{modals.confirmConfig.title}</h3>
            </div>
            <div className="modalBody"><p>{modals.confirmConfig.message}</p></div>
            <div className="modalFooter">
              <button className="secondaryButton" onClick={()=>modals.setConfirmConfig(null)}>Cancelar</button>
              <button className="dangerButtonSolid" onClick={()=>{ modals.confirmConfig!.onConfirm(); modals.setConfirmConfig(null); }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESPECIAL: AVISO DE ALTERAÇÕES NÃO SALVAS */}
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
              <p>Você tem níveis de dificuldade alterados que ainda não foram salvos. Se você continuar, <strong>todas as suas modificações serão perdidas</strong>.</p>
              <p>Deseja sair mesmo assim?</p>
            </div>
            
            <div className="modalFooter">
              <button className="secondaryButton" onClick={modals.cancelLeave}>
                Ficar e Salvar
              </button>
              <button className="dangerButtonSolid" onClick={modals.confirmLeave}>
                Sair sem Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}