// src/app/(system)/operators/skills/components/MatrixSkillsTab.tsx
import React from 'react'
import "./MatrixSkillsTab.css"

export default function MatrixSkillsTab({ data }: { data: any }) {
  const { 
    lines, selectedLine, handleLineChange, 
    skills, draftDifficulties, handleDifficultyDraftChange,
    hasMatrixChanges, saveMatrixChanges, cancelMatrixChanges
  } = data

  return (
    <div className="corporateCard matrixCard">
      <div className="matrixHeader">
        <div className="formGroup" style={{maxWidth: 400}}>
          <label>Selecione o Modelo de Produção</label>
          <select 
            className="corporateInput"
            value={selectedLine}
            onChange={(e) => handleLineChange(e.target.value)}
          >
            <option value="">-- Selecione uma Linha --</option>
            {lines.map((l: any) => (
              <option key={l.id} value={l.nome}>{l.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedLine ? (
        <div className="emptyState">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p style={{marginTop: 12}}>Selecione um Modelo acima para configurar as dificuldades das skills.</p>
        </div>
      ) : (
        <div className="tableContainer mt-3">
          <table className="corporateTable">
            <thead>
              <tr>
                <th>Posto / Skill</th>
                <th>Nível de Dificuldade (1 a 3)</th>
              </tr>
            </thead>
            <tbody>
              {skills.filter((s: any) => s.ativo).map((skill: any) => {
                const currentLevel = draftDifficulties[skill.nome] || 1

                return (
                  <tr key={skill.id}>
                    <td className="fontWeight600">{skill.nome}</td>
                    <td>
                      <div className="difficultySelector">
                        {[1, 2, 3].map(level => (
                          <button
                            key={level}
                            className={`diffBtn ${currentLevel === level ? 'active level-'+level : ''}`}
                            onClick={() => handleDifficultyDraftChange(skill.nome, level)}
                            title={`Nível ${level}`}
                          >
                            {level}
                          </button>
                        ))}
                        <span className="diffLabel">
                          {currentLevel === 1 && "Simples"}
                          {currentLevel === 2 && "Médio"}
                          {currentLevel === 3 && "Complexo"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {skills.filter((s: any) => s.ativo).length === 0 && (
                <tr><td colSpan={2} className="emptyState">Nenhuma skill ativa para configurar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAINEL FLUTUANTE DE AVISO: ALTERAÇÕES NÃO SALVAS */}
      {hasMatrixChanges && (
        <div className="actionFooter">
          <span className="warningText">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            Alterações não salvas
          </span>
          <div className="buttonGroup">
            <button className="secondaryButton" onClick={cancelMatrixChanges}>
              Cancelar
            </button>
            <button className="primaryButton saveButton" onClick={saveMatrixChanges}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  )
}