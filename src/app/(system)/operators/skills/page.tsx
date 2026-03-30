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
        <div className="headerLeft">
          <div className="headerIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <div className="headerTitle">
            <h1 className="pageTitle">Gerenciar Skills & Dificuldades</h1>
            <p className="pageSubtitle">Crie as habilidades e defina os níveis de exigência para cada modelo de produção.</p>
          </div>
        </div>

        <button className="secondaryButton backButton" onClick={handleBackClick} title="Voltar para gestão de operadores">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </button>
      </div>

      {/* ABAS MODERNAS (Pill Tabs) */}
      <div className="skillsTabs">
        <button 
          className={`tabButton ${tabs.activeTab === "base" ? "active" : ""}`}
          onClick={() => tabs.handleTabChange("base")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          1. Cadastro Base de Skills
        </button>
        <button 
          className={`tabButton ${tabs.activeTab === "matrix" ? "active" : ""}`}
          onClick={() => tabs.handleTabChange("matrix")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          2. Matriz de Dificuldades (Por Modelo)
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {tabs.activeTab === "base" && <BaseSkillsTab data={base} />}
      {tabs.activeTab === "matrix" && <MatrixSkillsTab data={matrix} />}

      {/* MODAIS CORPORATIVOS (Renovados) */}
      {modals.alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className={`modalIcon ${modals.alertConfig.title === "Sucesso" ? "successIcon" : "warningIcon"}`}>
                {modals.alertConfig.title === "Sucesso" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                )}
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>Atenção: Alterações não salvas!</h3>
            </div>
            
            <div className="modalBody">
              <p>Você tem níveis de dificuldade ou quantidades alteradas que ainda não foram salvas. Se você continuar, <strong>todas as suas modificações serão perdidas</strong>.</p>
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