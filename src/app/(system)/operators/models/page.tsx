// src/app/(system)/operators/models/page.tsx
"use client"

import "./page.css"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  getAllProductionLines,
  createProductionLine,
  updateProductionLine,
  toggleProductionLineActive,
  updateProductionLineOrder
} from "@/services/database/operatorRepository"

// IMPORTAÇÕES PARA AUDITORIA
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export default function ModelsPage(){
  const [categories,setCategories] = useState<string[]>([])
  const [categorySuggestions,setCategorySuggestions] = useState<string[]>([])

  const router = useRouter()

  const [lines,setLines] = useState<any[]>([])

  const [newModel,setNewModel] = useState("")
  const [newCategory,setNewCategory] = useState("")

  const [editingId,setEditingId] = useState<string | null>(null)
  const [editName,setEditName] = useState("")
  const [editCategory,setEditCategory] = useState("")

  const [dragIndex,setDragIndex] = useState<number | null>(null)

  // MODAIS CORPORATIVOS
  const [alertConfig,setAlertConfig] = useState<{title:string,message:string}|null>(null)
  const [confirmConfig,setConfirmConfig] = useState<{title:string,message:string, onConfirm: () => void}|null>(null)

  // SESSÃO DO USUÁRIO
  const sessionUser = getSession()

  useEffect(()=>{
    loadLines()
  },[])

  async function loadLines(){
    const data = await getAllProductionLines()
    const sorted = [...data].sort((a,b)=>(a.ordem ?? 0) - (b.ordem ?? 0))
    
    setLines(sorted)

    const uniqueCategories = Array.from(
      new Set(
        sorted
          .map(l=>l.categoria)
          .filter(Boolean)
      )
    )

    setCategories(uniqueCategories)
  }

  function handleCategoryChange(value:string){
    setNewCategory(value)

    if(!value){
      setCategorySuggestions([])
      return
    }

    const filtered = categories.filter(cat =>
      cat.toLowerCase().includes(value.toLowerCase())
    )

    setCategorySuggestions(filtered)
  }

  async function handleCreateModel(){
    if(!newModel){
      setAlertConfig({
        title:"Modelo obrigatório",
        message:"Informe o nome do modelo para prosseguir."
      })
      return
    }

    try{
      await createProductionLine(newModel, newCategory)
      
      // LOG DE AUDITORIA
      await logAction(
        sessionUser?.username || "sistema", 
        "model_create", 
        `Criou o modelo: ${newModel} ${newCategory ? `(${newCategory})` : ''}`
      )

      setNewModel("")
      setNewCategory("")
      loadLines()
      setAlertConfig({
        title:"Sucesso",
        message:"Modelo criado com sucesso."
      })
    }catch{
      setAlertConfig({
        title:"Erro",
        message:"Não foi possível criar o modelo."
      })
    }
  }

  function startEdit(line:any){
    setEditingId(line.id)
    setEditName(line.nome)
    setEditCategory(line.categoria || "")
  }

  function cancelEdit(){
    setEditingId(null)
    setEditName("")
    setEditCategory("")
  }

  async function saveEdit(id:string){
    try{
      await updateProductionLine(id, editName, editCategory)
      
      // LOG DE AUDITORIA
      await logAction(sessionUser?.username || "sistema", "model_edit", `Editou o modelo para: ${editName}`)

      cancelEdit()
      loadLines()
      setAlertConfig({
        title:"Sucesso",
        message:"Modelo atualizado com sucesso."
      })
    }catch{
      setAlertConfig({
        title:"Erro",
        message:"Não foi possível atualizar o modelo."
      })
    }
  }

  function toggleActive(line:any){
    // Exibe o modal de confirmação antes de desativar/reativar
    setConfirmConfig({
      title: line.ativo ? "Desativar Modelo" : "Reativar Modelo",
      message: `Tem certeza que deseja ${line.ativo ? "desativar" : "reativar"} o modelo "${line.nome}"?`,
      onConfirm: async () => {
        try{
          await toggleProductionLineActive(line.id, !line.ativo)
          
          // LOG DE AUDITORIA
          const actionWord = !line.ativo ? "Reativou" : "Desativou"
          await logAction(sessionUser?.username || "sistema", "model_toggle", `${actionWord} o modelo: ${line.nome}`)

          loadLines()
        }catch{
          setAlertConfig({
            title:"Erro",
            message:"Não foi possível alterar o status do modelo."
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

    const reordered = [...lines]
    const draggedItem = reordered[dragIndex]

    reordered.splice(dragIndex,1)
    reordered.splice(index,0,draggedItem)

    setLines(reordered)
    setDragIndex(null)

    /* atualizar ordem no banco */
    for(let i=0;i<reordered.length;i++){
      await updateProductionLineOrder(reordered[i].id, i)
    }

    // LOG DE AUDITORIA
    await logAction(sessionUser?.username || "sistema", "model_edit", `Reordenou a lista de modelos`)
  }

  function handleBack(){
    router.push("/operators")
  }

  return(

    <div className="modModelsPage">

      <div className="modModelsHeader">
        <div className="modModelsHeaderLeft">
          <div className="modModelsIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div className="modModelsTitleBlock">
            <h1 className="modModelsTitle">Modelos de Produção</h1>
            <p className="modModelsSubtitle">Crie, edite e organize a ordem de exibição dos modelos de produção (Drag & Drop).</p>
          </div>
        </div>

        <button className="modModelsSecondaryBtn" onClick={handleBack} title="Voltar para Gestão">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </button>
      </div>

      <div className="modModelsGrid">

        {/* CRIAR MODELO */}
        <div className="modModelsCard formCard">
          <h2>Novo Modelo</h2>

          <div className="modModelsFormGroup">
            <label>Nome do Modelo (Linha)</label>
            <div className="modModelsInputWrapper">
              <svg className="modModelsInputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              <input
                className="modModelsInput"
                placeholder="Ex: BX-18, D-14..."
                value={newModel}
                onChange={e=>setNewModel(e.target.value)}
              />
            </div>
          </div>

          <div className="modModelsFormGroup mt-3 relativeGroup">
            <label>Categoria (Opcional)</label>
            <div className="modModelsInputWrapper">
              <svg className="modModelsInputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <input
                className="modModelsInput"
                placeholder="Ex: DVD, NBX..."
                value={newCategory}
                onChange={(e)=>handleCategoryChange(e.target.value)}
              />
            </div>

            {categorySuggestions.length > 0 && (
              <div className="modModelsAutocomplete">
                {categorySuggestions.map(cat=>(
                  <div
                    key={cat}
                    className="modModelsAutoItem"
                    onClick={()=>{
                      setNewCategory(cat)
                      setCategorySuggestions([])
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="modModelsPrimaryBtn fullWidth mt-4"
            onClick={handleCreateModel}
            disabled={!newModel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Salvar Novo Modelo
          </button>
        </div>

        {/* LISTA MODELOS */}
        <div className="modModelsCard tableCard">
          <h2>Modelos Cadastrados</h2>

          <div className="modModelsTableWrapper">
            <table className="modModelsTable">
              <thead>
                <tr>
                  <th className="dragCol">Ordem</th>
                  <th>Nome do Modelo</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th className="actionColumn">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line,index)=>(
                  <tr
                    key={line.id}
                    draggable
                    onDragStart={()=>handleDragStart(index)}
                    onDragOver={(e)=>e.preventDefault()}
                    onDrop={()=>handleDrop(index)}
                    className={`dragRow ${!line.ativo ? "inactiveRow" : ""}`}
                    title="Clique e segure para reordenar"
                  >
                    
                    <td className="dragCol">
                      <div className="modModelsDragHandle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                        <span>{index+1}</span>
                      </div>
                    </td>

                    <td className="fw-600">
                      {editingId === line.id ? (
                        <input
                          autoFocus
                          className="modModelsInlineInput"
                          value={editName}
                          onChange={e=>setEditName(e.target.value)}
                        />
                      ) : (
                        line.nome
                      )}
                    </td>

                    <td>
                      {editingId === line.id ? (
                        <input
                          className="modModelsInlineInput"
                          value={editCategory}
                          onChange={e=>setEditCategory(e.target.value)}
                          placeholder="Sem Categoria"
                        />
                      ) : (
                        line.categoria || <span className="emptyText">Sem categoria</span>
                      )}
                    </td>

                    <td>
                      {line.ativo ? (
                        <span className="modModelsBadge active">Ativo</span>
                      ) : (
                        <span className="modModelsBadge inactive">Inativo</span>
                      )}
                    </td>

                    <td className="actionColumn">
                      {editingId === line.id ? (
                        <div className="modModelsActionGroup">
                          <button
                            className="modModelsIconBtn save"
                            onClick={()=>saveEdit(line.id)}
                            title="Salvar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>

                          <button
                            className="modModelsIconBtn cancel"
                            onClick={cancelEdit}
                            title="Cancelar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="modModelsActionGroup">
                          <button
                            className="modModelsActionBtn edit"
                            onClick={()=>startEdit(line)}
                            title="Editar Modelo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                          </button>

                          <button
                            className={`modModelsActionBtn ${line.ativo ? "danger" : "success"}`}
                            onClick={()=>toggleActive(line)}
                            title={line.ativo ? "Desativar Modelo" : "Reativar Modelo"}
                          >
                            {line.ativo ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))}
                
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="modModelsEmptyState">
                      <div className="emptyStateContent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                        Nenhum modelo cadastrado.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* =========================================
          MODAIS CORPORATIVOS (BLUR)
          ========================================= */}

      {/* ALERT MODAL */}
      {alertConfig && (
        <div className="modModelsModalOverlay">
          <div className="modModelsModal">
            <div className="modModelsModalHeader">
              <div className={`modModelsModalIcon ${alertConfig.title === "Sucesso" ? "success" : "warning"}`}>
                {alertConfig.title === "Sucesso" ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                     <polyline points="22 4 12 14.01 9 11.01"/>
                   </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" x2="12" y1="8" y2="12"/>
                    <line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                )}
              </div>
              <h3>{alertConfig.title}</h3>
            </div>
            <div className="modModelsModalBody">
              <p>{alertConfig.message}</p>
            </div>
            <div className="modModelsModalFooter">
              <button
                className="modModelsPrimaryBtn"
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
        <div className="modModelsModalOverlay">
          <div className="modModelsModal">
            <div className="modModelsModalHeader">
              <div className="modModelsModalIcon warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
              </div>
              <h3>{confirmConfig.title}</h3>
            </div>
            <div className="modModelsModalBody">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modModelsModalFooter">
              <button
                className="modModelsGhostBtn"
                onClick={()=>setConfirmConfig(null)}
              >
                Cancelar
              </button>
              <button
                className="modModelsDangerBtn"
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