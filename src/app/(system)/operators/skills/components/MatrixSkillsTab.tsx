// src/app/(system)/operators/skills/components/MatrixSkillsTab.tsx
import React from 'react'
import "./MatrixSkillsTab.css"

export default function MatrixSkillsTab({ data }: { data: any }) {
  const { 
    lines, selectedLine, handleLineChange, 
    skills, draftMatrix, toggleSkillInLine, changeDifficultyInLine, changeQuantityInLine, applySkillToAllLines,
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
          <p style={{marginTop: 12}}>Selecione um Modelo acima para configurar o Kit de Habilidades dele.</p>
        </div>
      ) : (
        <div className="tableContainer mt-3">
          <table className="corporateTable kitTable">
            <thead>
              <tr>
                <th className="statusCol">Status</th>
                <th>Posto / Habilidade Global</th>
                <th>Qtd. Necessária</th>
                <th>Nível de Dificuldade (1 a 3)</th>
                <th className="globalCol">Ação Global</th>
              </tr>
            </thead>
            <tbody>
              {skills.filter((s: any) => s.ativo).map((skill: any) => {
                const config = draftMatrix[skill.nome] || { active: false, diff: 1, qtd: 1 }

                return (
                  <tr key={skill.id} className={!config.active ? 'inactiveKitRow' : ''}>
                    <td className="statusCol">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={config.active}
                          onChange={() => toggleSkillInLine(skill.nome)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                    
                    <td className="fontWeight600">{skill.nome}</td>
                    
                    {/* NOVO CAMPO: Quantidade */}
                    <td>
                      <div className={`qtdSelector ${!config.active ? 'disabled' : ''}`}>
                        <input 
                          type="number"
                          min="1"
                          className="qtdInput"
                          value={config.qtd}
                          onChange={(e) => changeQuantityInLine(skill.nome, parseInt(e.target.value) || 1)}
                          disabled={!config.active}
                          title="Quantidade de operadores necessários neste posto"
                        />
                        <span className="qtdLabel">operador(es)</span>
                      </div>
                    </td>

                    <td>
                      <div className={`difficultySelector ${!config.active ? 'disabled' : ''}`}>
                        {[1, 2, 3].map(level => (
                          <button
                            key={level}
                            className={`diffBtn ${config.diff === level ? 'active level-'+level : ''}`}
                            onClick={() => changeDifficultyInLine(skill.nome, level)}
                            title={`Nível ${level}`}
                            disabled={!config.active}
                          >
                            {level}
                          </button>
                        ))}
                        <span className="diffLabel">
                          {!config.active ? "Desabilitado" : (
                            <>
                              {config.diff === 1 && "Simples"}
                              {config.diff === 2 && "Médio"}
                              {config.diff === 3 && "Complexo"}
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="globalCol">
                      <button 
                        className="globalActionBtn" 
                        onClick={() => applySkillToAllLines(skill.nome)}
                        title="Aplicar configuração desta skill para TODOS os modelos"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        Aplicar em Todos
                      </button>
                    </td>
                  </tr>
                )
              })}
              {skills.filter((s: any) => s.ativo).length === 0 && (
                <tr><td colSpan={5} className="emptyState">Nenhuma skill global ativa cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {hasMatrixChanges && (
        <div className="actionFooter">
          <span className="warningText">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            Alterações de modelo não salvas
          </span>
          <div className="buttonGroup">
            <button className="secondaryButton" onClick={cancelMatrixChanges}>
              Cancelar
            </button>
            <button className="primaryButton saveButton" onClick={saveMatrixChanges}>
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  )
}