// src/app/(system)/operators/skills/[id]/components/OperatorSkillsTable.tsx
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
    handleCancel,
    originalSkills // Precisamos do array original para comparar reduções drásticas (passado via data do hook, mas se não tiver, vamos tratar no estado local abaixo)
  } = data

  // Estado para armazenar o valor original das skills e detectar quedas drásticas
  const [originalLevels, setOriginalLevels] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    skillId: string
    posto: string
    oldLevel: number
    newLevel: number
  } | null>(null)

  // Ao montar, salva os níveis originais para comparação
  useEffect(() => {
    setMounted(true)
    if (Object.keys(originalLevels).length === 0 && skills.length > 0) {
      const initial: Record<string, number> = {}
      skills.forEach((s: any) => {
        initial[s.id] = s.skill_level
      })
      setOriginalLevels(initial)
    }
  }, [skills])

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

  // Interceptador para avaliar a mudança e disparar o modal se for -2
  function handleSelectChange(skillId: string, postoName: string, newLevel: number) {
    const oldLevel = originalLevels[skillId]

    // Se houver uma redução de 2 ou mais níveis
    if (oldLevel !== undefined && (oldLevel - newLevel) >= 2) {
      setConfirmModal({
        isOpen: true,
        skillId,
        posto: postoName,
        oldLevel,
        newLevel
      })
    } else {
      handleChangeSkill(skillId, newLevel)
    }
  }

  function confirmSkillReduction() {
    if (confirmModal) {
      handleChangeSkill(confirmModal.skillId, confirmModal.newLevel)
      // Opcional: Atualiza o nível original para o novo nível se quisermos que ele não pergunte novamente
      // setOriginalLevels(prev => ({ ...prev, [confirmModal.skillId]: confirmModal.newLevel }))
      setConfirmModal(null)
    }
  }

  function cancelSkillReduction() {
    setConfirmModal(null)
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
              <th className="modOpSkillDiffColumn">Dificuldade</th>
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
                      <span className="modOpSkillFw500">{skill.posto}</span>
                    </td>
                    
                    <td className="modOpSkillDiffColumn">
                      {operatorLine ? (
                        <span className={`modOpSkillDiffBadge ${getDifficultyClass(diffLevel)}`} title={`Dificuldade do posto no modelo ${operatorLine}`}>
                          {getDifficultyText(diffLevel)}
                        </span>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>

                    <td className="modOpSkillLevelColumn">
                      <div className="modOpSkillInputWrapper">
                        <svg className="modOpSkillInputIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                        <select
                          className="modOpSkillSelect"
                          value={skill.skill_level}
                          onChange={e => handleSelectChange(skill.id, skill.posto, Number(e.target.value))}
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
                <td colSpan={3} className="modOpSkillEmptyState">
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

      {/* 🆕 MODAL DE CONFIRMAÇÃO DE REDUÇÃO DE HABILIDADE (Renderizado via Portal) */}
      {confirmModal && confirmModal.isOpen && mounted && createPortal(
        <div className="modOpSkillEmergencyModalOverlay" onClick={cancelSkillReduction}>
          <div 
            className="modOpSkillEmergencyModalCard" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modOpSkillEmergencyHeader">
              <div className="modOpSkillEmergencyTitle">
                <div className="modOpSkillEmergencyIcon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <h3>Atenção: Queda Drástica de Nível</h3>
              </div>
              <button className="modOpSkillCloseEmergencyBtn" onClick={cancelSkillReduction} title="Cancelar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="modOpSkillEmergencyBody">
              <p style={{ margin: 0, color: '#555', fontSize: '15px', lineHeight: 1.6 }}>
                Você está tentando reduzir a habilidade no posto <strong>{confirmModal.posto}</strong> do <strong>Nível {confirmModal.oldLevel}</strong> diretamente para o <strong>Nível {confirmModal.newLevel}</strong>.
              </p>
              <div style={{ background: '#fff0f0', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '14px', fontWeight: 600 }}>
                Quedas acentuadas de habilidade são incomuns e afetam o ILUO e a Matriz de Polivalência de forma severa. Tem certeza de que o operador regrediu nesse nível?
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  className="modOpSkillGhostBtn" 
                  onClick={cancelSkillReduction}
                  style={{ background: '#f5f5f5', color: '#555' }}
                >
                  Cancelar, foi um engano
                </button>
                <button 
                  className="modOpSkillPrimaryBtn" 
                  onClick={confirmSkillReduction}
                  style={{ background: '#d40000' }}
                >
                  Sim, tenho certeza
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}