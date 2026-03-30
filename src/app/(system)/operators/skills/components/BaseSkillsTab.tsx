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
    <div className="modBase-skillsGrid">
      
      {/* CRIAR SKILL */}
      <div className="corporateCard">
        <div className="modBase-formHeader">
          <div className="modBase-iconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h2>Nova Skill Global</h2>
        </div>
        
        <div className="formGroup">
          <label>Nome do Posto / Habilidade</label>
          <div className="modBase-inputWrapper">
            <svg className="modBase-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <input
              className="corporateInput modBase-overrideInput"
              placeholder="Ex: Embalagem, Solda TIG..."
              value={newSkill}
              onChange={e=>setNewSkill(e.target.value)}
            />
          </div>
        </div>
        
        <button
          className="primaryButton fullWidth mt-3"
          onClick={handleCreateSkill}
          disabled={!newSkill}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Cadastrar Skill
        </button>
      </div>

      {/* LISTA DE SKILLS */}
      <div className="corporateCard tableCard">
        <div className="modBase-formHeader">
          <div className="modBase-iconWrapper" style={{ background: '#fff0f0', color: '#d40000' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </div>
          <h2>Skills Cadastradas (Globais)</h2>
        </div>
        
        <div className="tableContainer">
          <table className="corporateTable">
            <thead>
              <tr>
                <th className="modBase-dragCol">Ordem</th>
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
                  className={`modBase-dragRow ${!skill.ativo ? "modBase-inactiveRow" : ""}`}
                  title="Clique e segure para reordenar"
                >
                  <td className="modBase-dragCol">
                    <div className="modBase-dragHandle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                      <span>{index+1}</span>
                    </div>
                  </td>

                  <td className="fontWeight600">
                    {editingId === skill.id ? (
                      <input
                        autoFocus
                        className="corporateInput"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        value={editName}
                        onChange={e=>setEditName(e.target.value)}
                      />
                    ):(
                      skill.nome
                    )}
                  </td>

                  <td>
                    {skill.ativo ? (
                      <span className="modBase-badge active">Ativa</span>
                    ):(
                      <span className="modBase-badge inactive">Inativa</span>
                    )}
                  </td>

                  <td className="actionColumn">
                    {editingId === skill.id ? (
                      <div className="modBase-actionGroup">
                        <button className="modBase-iconBtn save" onClick={()=>saveEdit(skill.id)} title="Salvar Alteração">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button className="modBase-iconBtn cancel" onClick={cancelEdit} title="Cancelar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ):(
                      <div className="modBase-actionGroup">
                        <button className="modBase-actionBtn edit" onClick={()=>startEdit(skill)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          Editar
                        </button>
                        <button className={`modBase-actionBtn ${skill.ativo ? "disable" : "enable"}`} onClick={()=>handleToggleSkill(skill)}>
                          {skill.ativo ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              Desativar
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Reativar
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {skills.length === 0 && (
                <tr>
                  <td colSpan={4} className="emptyState">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      Nenhuma skill cadastrada.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}