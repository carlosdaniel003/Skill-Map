// src/app/(system)/operators/skills/page.tsx
"use client"

import "./page.css"

import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"

import {
  getAllWorkstations,
  createWorkstation,
  updateWorkstation,
  toggleWorkstation,
  updateWorkstationOrder
} from "@/services/database/operatorRepository"

// IMPORTAÇÕES PARA AUDITORIA
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export default function SkillsPage(){

  const router = useRouter()

  const [skills,setSkills] = useState<any[]>([])
  const [newSkill,setNewSkill] = useState("")

  const [editingId,setEditingId] = useState<string | null>(null)
  const [editName,setEditName] = useState("")

  const [dragIndex,setDragIndex] = useState<number | null>(null)

  // MODAIS CORPORATIVOS
  const [alertConfig,setAlertConfig] = useState<{title:string,message:string}|null>(null)
  const [confirmConfig,setConfirmConfig] = useState<{title:string,message:string, onConfirm: () => void}|null>(null)

  // SESSÃO DO USUÁRIO
  const sessionUser = getSession()

  useEffect(()=>{
    loadSkills()
  },[])

  async function loadSkills(){
    const data = await getAllWorkstations()
    const sorted = [...data].sort((a,b)=>(a.ordem ?? 0) - (b.ordem ?? 0))
    setSkills(sorted)
  }

  async function handleCreate(){
    if(!newSkill){
      setAlertConfig({
        title:"Atenção",
        message:"Por favor, informe o nome do posto/skill para prosseguir."
      })
      return
    }

    try{
      await createWorkstation(newSkill)
      
      // LOG DE AUDITORIA
      await logAction(sessionUser?.username || "sistema", "skill_create", `Criou a skill: ${newSkill}`)

      setNewSkill("")
      loadSkills()
      
      setAlertConfig({
        title:"Sucesso",
        message:"Nova skill cadastrada com sucesso."
      })
    }catch{
      setAlertConfig({
        title:"Erro",
        message:"Ocorreu um erro ao salvar a skill no banco de dados."
      })
    }
  }

  function startEdit(skill:any){
    setEditingId(skill.id)
    setEditName(skill.nome)
  }

  function cancelEdit(){
    setEditingId(null)
    setEditName("")
  }

  async function saveEdit(id:string){
    if(!editName){
      setAlertConfig({
        title:"Nome inválido",
        message:"O nome da skill não pode ficar vazio."
      })
      return
    }
    
    await updateWorkstation(id,editName)
    
    // LOG DE AUDITORIA
    await logAction(sessionUser?.username || "sistema", "skill_edit", `Editou a skill para: ${editName}`)

    cancelEdit()
    loadSkills()
  }

  function toggleSkill(skill:any){
    setConfirmConfig({
      title: skill.ativo ? "Desativar Skill" : "Reativar Skill",
      message: `Tem certeza que deseja ${skill.ativo ? "desativar" : "reativar"} a skill "${skill.nome}"?`,
      onConfirm: async () => {
        try{
          await toggleWorkstation(skill.id, !skill.ativo)
          
          // LOG DE AUDITORIA
          const actionWord = !skill.ativo ? "Reativou" : "Desativou"
          await logAction(sessionUser?.username || "sistema", "skill_toggle", `${actionWord} a skill: ${skill.nome}`)

          loadSkills()
        }catch{
          setAlertConfig({
            title:"Erro",
            message:"Não foi possível alterar o status da skill."
          })
        }
      }
    })
  }

  /* DRAG AND DROP */
  function handleDragStart(index:number){
    setDragIndex(index)
  }

  async function handleDrop(index:number){
    if(dragIndex === null) return

    const reordered = [...skills]
    const draggedItem = reordered[dragIndex]

    reordered.splice(dragIndex,1)
    reordered.splice(index,0,draggedItem)

    setSkills(reordered)
    setDragIndex(null)

    /* atualizar ordem no banco */
    for(let i=0;i<reordered.length;i++){
      await updateWorkstationOrder(reordered[i].id, i)
    }

    // LOG DE AUDITORIA (Dispara uma vez após todo o arrasto)
    await logAction(sessionUser?.username || "sistema", "skill_edit", `Reordenou a lista de skills`)
  }

  return(

    <div className="manageSkillsPage">

      <div className="pageHeader">
        <button className="backButton" onClick={()=>router.push("/operators")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        <div className="headerTitle">
          <h1 className="pageTitle">Gerenciar Skills (Postos)</h1>
          <p className="pageSubtitle">Crie, edite e organize a ordem de exibição das habilidades e postos de trabalho.</p>
        </div>
      </div>

      <div className="skillsGrid">

        {/* CRIAR SKILL */}
        <div className="corporateCard formCard">
          <h2>Nova Skill</h2>

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
            onClick={handleCreate}
            disabled={!newSkill}
          >
            Cadastrar Skill
          </button>
        </div>

        {/* LISTA DE SKILLS */}
        <div className="corporateCard tableCard">
          <h2>Skills Cadastradas</h2>

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
                {skills.map((skill,index)=>(
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" x2="21" y1="6" y2="6"/>
                          <line x1="8" x2="21" y1="12" y2="12"/>
                          <line x1="8" x2="21" y1="18" y2="18"/>
                          <line x1="3" x2="3.01" y1="6" y2="6"/>
                          <line x1="3" x2="3.01" y1="12" y2="12"/>
                          <line x1="3" x2="3.01" y1="18" y2="18"/>
                        </svg>
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
                        <span className="statusBadge badge-active">Ativo</span>
                      ):(
                        <span className="statusBadge badge-inactive">Inativo</span>
                      )}
                    </td>

                    <td className="actionColumn">
                      {editingId === skill.id ? (
                        <div className="actionGroup">
                          <button
                            className="actionIconBtn saveBtn"
                            onClick={()=>saveEdit(skill.id)}
                            title="Salvar alterações"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5"/>
                            </svg>
                          </button>

                          <button
                            className="actionIconBtn cancelBtn"
                            onClick={cancelEdit}
                            title="Cancelar edição"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ):(
                        <div className="actionGroup">
                          <button
                            className="secondaryButton smallButton"
                            onClick={()=>startEdit(skill)}
                          >
                            Editar
                          </button>

                          <button
                            className={`smallButton ${skill.ativo ? "dangerButton" : "successButton"}`}
                            onClick={()=>toggleSkill(skill)}
                          >
                            {skill.ativo ? "Desativar" : "Reativar"}
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))}
                
                {skills.length === 0 && (
                  <tr>
                    <td colSpan={4} className="emptyState">
                      Nenhuma skill cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* =========================================
          MODAIS CORPORATIVOS
          ========================================= */}

      {/* ALERT MODAL */}
      {alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className={`modalIcon ${alertConfig.title === "Sucesso" ? "successIcon" : "warningIcon"}`}>
                {alertConfig.title === "Sucesso" ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                     <polyline points="22 4 12 14.01 9 11.01"/>
                   </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" x2="12" y1="8" y2="12"/>
                    <line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                )}
              </div>
              <h3>{alertConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{alertConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button
                className="primaryButton"
                onClick={()=>setAlertConfig(null)}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
              </div>
              <h3>{confirmConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button
                className="secondaryButton"
                onClick={()=>setConfirmConfig(null)}
              >
                Cancelar
              </button>
              <button
                className="dangerButtonSolid"
                onClick={()=>{
                  confirmConfig.onConfirm()
                  setConfirmConfig(null)
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  )

}