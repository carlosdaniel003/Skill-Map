// src/app/(system)/operators/skills/components/MatrixSkillsTab.tsx
import React from 'react'
import "./MatrixSkillsTab.css"

export default function MatrixSkillsTab({ data }: { data: any }) {
  const { 
    lines, selectedLine, handleLineChange, 
    skills, draftMatrix, toggleSkillInLine, changeDifficultyInLine, changeQuantityInLine, applySkillToAllLines,
    applyAllSkillsToAllLines,
    hasMatrixChanges, saveMatrixChanges, cancelMatrixChanges
  } = data

  return (
    <div className="modMatrix-card">
      <div className="modMatrix-header">
        
        <div className="modMatrix-formGroup">
          <label>Selecione o Modelo de Produção</label>
          <div className="modMatrix-inputWrapper">
            <svg className="modMatrix-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <select 
              className="modMatrix-select"
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

        {/* BOTÃO DE AÇÃO GLOBAL EM MASSA */}
        {selectedLine && (
          <button 
            className="modMatrix-bulkBtn" 
            onClick={() => applyAllSkillsToAllLines()}
            title="Copiar TODA a configuração atual deste modelo para TODOS os outros modelos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <polyline points="9 14 11 16 15 12"></polyline>
            </svg>
            Aplicar TUDO em Todos os Modelos
          </button>
        )}
      </div>

      {!selectedLine ? (
        <div className="modMatrix-emptyState">
          <div className="modMatrix-emptyContent">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <p>Selecione um Modelo acima para configurar o padrão de Habilidades.</p>
          </div>
        </div>
      ) : (
        <div className="modMatrix-tableWrapper">
          <table className="modMatrix-table">
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
                      <label className="modMatrix-switch">
                        <input 
                          type="checkbox" 
                          checked={config.active}
                          onChange={() => toggleSkillInLine(skill.nome)}
                        />
                        <span className="modMatrix-slider round"></span>
                      </label>
                    </td>
                    
                    <td className="modMatrix-fw600">{skill.nome}</td>
                    
                    <td>
                      <div className={`modMatrix-qtdSelector ${!config.active ? 'disabled' : ''}`}>
                        <input 
                          type="number"
                          min="1"
                          className="modMatrix-qtdInput"
                          value={config.qtd}
                          onChange={(e) => changeQuantityInLine(skill.nome, parseInt(e.target.value) || 1)}
                          disabled={!config.active}
                          title="Quantidade de operadores necessários neste posto"
                        />
                        <span className="modMatrix-qtdLabel">operador(es)</span>
                      </div>
                    </td>

                    <td>
                      <div className={`modMatrix-diffSelector ${!config.active ? 'disabled' : ''}`}>
                        {[1, 2, 3].map(level => (
                          <button
                            key={level}
                            className={`modMatrix-diffBtn ${config.diff === level ? 'active level-'+level : ''}`}
                            onClick={() => changeDifficultyInLine(skill.nome, level)}
                            title={`Nível ${level}`}
                            disabled={!config.active}
                          >
                            {level}
                          </button>
                        ))}
                        <span className="modMatrix-diffLabel">
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
                        className="modMatrix-globalBtn" 
                        onClick={() => applySkillToAllLines(skill.nome)}
                        title="Aplicar configuração desta skill para TODOS os modelos"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span>Aplicar em Todos</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {skills.filter((s: any) => s.ativo).length === 0 && (
                <tr>
                  <td colSpan={5} className="modMatrix-emptyState" style={{ padding: '40px' }}>
                    <div className="modMatrix-emptyContent">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <p>Nenhuma skill global ativa cadastrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {hasMatrixChanges && (
        <div className="modMatrix-actionFooter">
          <div className="modMatrix-warningText">
            <div className="warningIconWrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
            </div>
            <span>Você tem alterações não salvas neste modelo.</span>
          </div>
          <div className="modMatrix-buttonGroup">
            <button className="modMatrix-ghostBtn" onClick={cancelMatrixChanges}>
              Cancelar Alterações
            </button>
            <button className="modMatrix-primaryBtn" onClick={saveMatrixChanges}>
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  )
}