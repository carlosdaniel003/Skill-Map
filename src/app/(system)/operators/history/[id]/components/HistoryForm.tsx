// src/app/(system)/operators/history/[id]/components/HistoryForm.tsx
import React from 'react'
import { SkillAssessment } from '../hooks/useOperatorHistory'
import "./HistoryForm.css"

export default function HistoryForm({ data }: { data: any }) {
  const {
    lines,
    linha, setLinha,
    assessments, handleAssessmentChange,
    isSaving, // <-- Recebemos o estado aqui
    handleSave
  } = data

  function getDifficultyText(level: number) {
    if (level === 1) return "Simples"
    if (level === 2) return "Médio"
    if (level === 3) return "Complexo"
    return "Padrão"
  }

  function getDifficultyClass(level: number) {
    if (level === 1) return "modDiff-simple"
    if (level === 2) return "modDiff-medium"
    if (level === 3) return "modDiff-complex"
    return ""
  }
  
  return (
    <div className="modHistoryForm-card">
      
      <div className="modHistoryForm-header">
        <div className="modHistoryForm-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div className="modHistoryForm-titleBlock">
          <h2>Entrevista de Qualificação</h2>
          <p>Selecione um modelo de produção para avaliar a experiência do colaborador nas funções daquela linha de uma só vez.</p>
        </div>
      </div>

      <div className="modHistoryForm-grid">
        
        <div className="modHistoryForm-inputGroup">
          <label>1. Modelo de Produção</label>
          <div className="modHistoryForm-inputWrapper">
            <svg className="modHistoryForm-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <select 
              className="modHistoryForm-select" 
              value={linha} 
              onChange={e=>setLinha(e.target.value)}
              disabled={isSaving} // Bloqueia mudança de linha enquanto salva
            >
              <option value="" disabled>Selecione o modelo...</option>
              {lines.map((line: any) => (
                <option key={line.id} value={line.nome}>{line.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {linha && (
          <div className="modHistoryForm-assessmentContainer">
            <div className="modHistoryForm-assessmentHeader">
              <label>2. Avaliação das Habilidades</label>
              <p>Aponte o nível atual dele em cada posto (deixe nível 1 se não tiver experiência).</p>
            </div>
            
            <div className="modHistoryForm-assessmentList">
              {assessments.map((a: SkillAssessment) => (
                <div key={a.posto} className="modHistoryForm-assessmentRow">
                  
                  <div className="modHistoryForm-assessmentInfo">
                    <span className="modHistoryForm-assName">{a.posto}</span>
                    <span className={`modHistoryForm-diffBadge ${getDifficultyClass(a.dificuldade)}`}>
                      {getDifficultyText(a.dificuldade)}
                    </span>
                  </div>
                  
                  <div className="modHistoryForm-assessmentLevels">
                    <div className="modHistoryForm-slimInputWrapper">
                      <svg className="modHistoryForm-slimInputIcon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                      <select 
                        className="modHistoryForm-slimSelect" 
                        value={a.level} 
                        onChange={e => handleAssessmentChange(a.posto, Number(e.target.value))}
                        disabled={isSaving} // Bloqueia as seleções enquanto salva
                      >
                        <option value={1}>1. Nunca fez / Sem exp.</option>
                        <option value={2}>2. Em treinamento</option>
                        <option value={3}>3. Apto a operar</option>
                        <option value={4}>4. Especialista</option>
                        <option value={5}>5. Instrutor</option>
                      </select>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button 
        className="modHistoryForm-primaryBtn" 
        onClick={handleSave}
        disabled={!linha || isSaving} // Botão desabilitado se estiver salvando
      >
        {isSaving ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        )}
        {isSaving ? "Registrando, aguarde..." : "Registrar Experiência Completa"}
      </button>
    </div>
  )
}