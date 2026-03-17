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
    if (level === 1) return "diff-simple"
    if (level === 2) return "diff-medium"
    if (level === 3) return "diff-complex"
    return ""
  }
  
  return (
    <div className="corporateCard formCard">
      <h2>Entrevista de Qualificação</h2>
      <p style={{fontSize: 13, color: '#666', marginBottom: 20}}>
        Selecione um modelo de produção para avaliar a experiência do colaborador nas funções daquela linha de uma só vez.
      </p>

      <div className="formGrid">
        
        <div className="inputGroup">
          <label>1. Modelo de Produção</label>
          <select 
            className="corporateInput" 
            value={linha} 
            onChange={e=>setLinha(e.target.value)}
            disabled={isSaving} // Bloqueia mudança de linha enquanto salva
          >
            <option value="">Selecione o modelo</option>
            {lines.map((line: any) => (
              <option key={line.id} value={line.nome}>{line.nome}</option>
            ))}
          </select>
        </div>

        {linha && (
          <>
            <div 
              className="assessmentContainer" 
              style={{ marginTop: 12, gridColumn: "1 / -1" }}
            >
              <label>2. Avaliação das Habilidades</label>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                Aponte o nível atual dele em cada posto (deixe nível 1 se não tiver experiência).
              </p>
              
              <div className="assessmentList">
                {assessments.map((a: SkillAssessment) => (
                  <div key={a.posto} className="assessmentRow">
                    <div className="assessmentInfo">
                      <span className="assName">{a.posto}</span>
                      <span className={`assDiffBadge ${getDifficultyClass(a.dificuldade)}`}>
                        {getDifficultyText(a.dificuldade)}
                      </span>
                    </div>
                    <div className="assessmentLevels">
                      <select 
                        className="corporateInput slimSelect" 
                        value={a.level} 
                        onChange={e => handleAssessmentChange(a.posto, Number(e.target.value))}
                        disabled={isSaving} // Bloqueia as estrelas enquanto salva
                      >
                        <option value={1}>1. Nunca fez / Sem exp.</option>
                        <option value={2}>2. Em treinamento</option>
                        <option value={3}>3. Apto a operar</option>
                        <option value={4}>4. Especialista</option>
                        <option value={5}>5. Instrutor</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <button 
        className="primaryButton fullWidth mt-3" 
        onClick={handleSave}
        disabled={!linha || isSaving} // Botão desabilitado se estiver salvando
      >
        {isSaving ? "Registrando, aguarde..." : "Registrar Experiência Completa"}
      </button>
    </div>
  )
}