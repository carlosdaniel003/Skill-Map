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
    if (level === 1) return "diff-simple"
    if (level === 2) return "diff-medium"
    if (level === 3) return "diff-complex"
    return ""
  }

  return (
    <div className="corporateCard">
      <div className="cardHeader">
        <h2>Matriz de Habilidades (Skill Matrix)</h2>
        {operatorLine && (
          <p className="cardSubtitle">Mostrando dificuldades e experiências com base no modelo: <strong>{operatorLine}</strong></p>
        )}
      </div>

      <div className="tableContainer">
        <table className="corporateTable">
          <thead>
            <tr>
              <th>Posto de Trabalho</th>
              <th className="levelColumn">Nível de Habilidade do Operador</th>
            </tr>
          </thead>
          <tbody>
            {skills.length > 0 ? (
              skills.map((skill: any) => {
                const diffLevel = lineDifficulties[skill.posto] || 1

                return (
                  <tr key={skill.id}>
                    <td>
                      <div className="postoInfo">
                        <span className="fontWeight500">{skill.posto}</span>
                        {operatorLine && (
                          <span className={`diffBadge ${getDifficultyClass(diffLevel)}`} title={`Dificuldade da skill no modelo ${operatorLine}`}>
                            {getDifficultyText(diffLevel)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="levelColumn">
                      <select
                        className="corporateSelect"
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
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={2} className="emptyState">
                  {operatorLine 
                    ? "Nenhuma habilidade cadastrada no sistema." 
                    : "Aloque o operador em um Modelo de Produção primeiro para avaliar suas habilidades atuais."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasChanges && (
        <div className="actionFooter">
          <span className="warningText">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            Alterações não salvas
          </span>
          <div className="buttonGroup">
            <button className="secondaryButton" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </button>
            <button className="primaryButton saveButton" onClick={handleSave} disabled={isSaving}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}