// src/app/(system)/operators/skills/components/BaseSkillsTab.tsx
import React from 'react'
import "./BaseSkillsTab.css"

export default function BaseSkillsTab({ data }: { data: any }) {
  const { 
    skills, newSkill, setNewSkill, handleCreateSkill,
    editingId, editName, setEditName, startEdit, cancelEdit, saveEdit,
    handleToggleSkill, handleDragStart, handleDrop 
  } = data

  return (
    <div className="skillsGrid">
      {/* CRIAR SKILL */}
      <div className="corporateCard formCard">
        <h2>Nova Skill Global</h2>
        <div className="formGroup">
          <label>Nome do Posto / Habilidade</label>
          <input
            className="corporateInput"
            placeholder="Ex: Embalagem, Solda TIG..."
            value={newSkill}
            onChange={e=>setNewSkill(e.target.value)}
          />
        </div>
        <button
          className="primaryButton fullWidth mt-3"
          onClick={handleCreateSkill}
          disabled={!newSkill}
        >
          Cadastrar Skill
        </button>
      </div>

      {/* LISTA DE SKILLS */}
      <div className="corporateCard tableCard">
        <h2>Skills Cadastradas (Globais)</h2>
        <div className="tableContainer">
          <table className="corporateTable">
            <thead>
              <tr>
                <th className="dragCol">Ordem</th>
                <th>Nome da Skill</th>
                <th>Status</th>
                <th className="actionColumn">Ações</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill: any, index: number) => (
                <tr
                  key={skill.id}
                  draggable
                  onDragStart={()=>handleDragStart(index)}
                  onDragOver={(e)=>e.preventDefault()}
                  onDrop={()=>handleDrop(index)}
                  className={`dragRow ${!skill.ativo ? "inactiveRow" : ""}`}
                  title="Clique e segure para reordenar"
                >
                  <td className="dragCol">
                    <div className="dragHandle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                      <span>{index+1}</span>
                    </div>
                  </td>

                  <td className="fontWeight600">
                    {editingId === skill.id ? (
                      <input
                        autoFocus
                        className="corporateInput"
                        value={editName}
                        onChange={e=>setEditName(e.target.value)}
                      />
                    ):(
                      skill.nome
                    )}
                  </td>

                  <td>
                    {skill.ativo ? (
                      <span className="statusBadge badge-active">Ativa</span>
                    ):(
                      <span className="statusBadge badge-inactive">Inativa</span>
                    )}
                  </td>

                  <td className="actionColumn">
                    {editingId === skill.id ? (
                      <div className="actionGroup">
                        <button className="actionIconBtn saveBtn" onClick={()=>saveEdit(skill.id)}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></button>
                        <button className="actionIconBtn cancelBtn" onClick={cancelEdit}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                      </div>
                    ):(
                      <div className="actionGroup">
                        <button className="secondaryButton smallButton" onClick={()=>startEdit(skill)}>Editar</button>
                        <button className={`smallButton ${skill.ativo ? "dangerButton" : "successButton"}`} onClick={()=>handleToggleSkill(skill)}>
                          {skill.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {skills.length === 0 && (
                <tr><td colSpan={4} className="emptyState">Nenhuma skill cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}