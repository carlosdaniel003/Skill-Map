// src/app/(system)/operators/skills/[id]/components/OperatorSkillsTable.tsx
import React from 'react'
import "./OperatorSkillsTable.css"

export default function OperatorSkillsTable({ data }: { data: any }) {
  const {
    skills,
    lineDifficulties,
    operatorLine,
    hasChanges,
    handleChangeSkill,
    isSaving,
    handleSave,
    handleCancel
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
    <div className="modOpSkillTableCard">
      <div className="modOpSkillCardHeader">
        <h2>Matriz de Habilidades (Skill Matrix)</h2>
        {operatorLine && (
          <p className="modOpSkillCardSubtitle">Mostrando dificuldades e experiências com base no modelo: <strong>{operatorLine}</strong></p>
        )}
      </div>

      <div className="modOpSkillTableContainer">
        <table className="modOpSkillTable">
          <thead>
            <tr>
              <th>Posto de Trabalho</th>
              <th className="modOpSkillLevelColumn">Nível de Habilidade do Operador</th>
            </tr>
          </thead>
          <tbody>
            {skills.length > 0 ? (
              skills.map((skill: any) => {
                const diffLevel = lineDifficulties[skill.posto] || 1

                return (
                  <tr key={skill.id}>
                    <td>
                      <div className="modOpSkillPostoInfo">
                        <span className="modOpSkillFw500">{skill.posto}</span>
                        {operatorLine && (
                          <span className={`modOpSkillDiffBadge ${getDifficultyClass(diffLevel)}`} title={`Dificuldade da skill no modelo ${operatorLine}`}>
                            {getDifficultyText(diffLevel)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="modOpSkillLevelColumn">
                      <div className="modOpSkillInputWrapper">
                        <svg className="modOpSkillInputIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                        <select
                          className="modOpSkillSelect"
                          value={skill.skill_level}
                          onChange={e => handleChangeSkill(skill.id, Number(e.target.value))}
                          disabled={isSaving}
                        >
                          <option value={1}>1 - Nunca fez / Sem Exp.</option>
                          <option value={2}>2 - Em treinamento</option>
                          <option value={3}>3 - Apto a operar</option>
                          <option value={4}>4 - Especialista</option>
                          <option value={5}>5 - Instrutor</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={2} className="modOpSkillEmptyState">
                  <div className="modOpSkillEmptyContent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    {operatorLine 
                      ? "Nenhuma habilidade cadastrada no sistema." 
                      : "Aloque o operador em um Modelo de Produção primeiro para avaliar suas habilidades atuais."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasChanges && (
        <div className="modOpSkillActionFooter">
          <div className="modOpSkillWarningText">
            <div className="warningIconWrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <span>Existem alterações de níveis de habilidade não salvas.</span>
          </div>
          <div className="modOpSkillButtonGroup">
            <button className="modOpSkillGhostBtn" onClick={handleCancel} disabled={isSaving}>
              Descartar
            </button>
            <button className="modOpSkillPrimaryBtn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              )}
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}