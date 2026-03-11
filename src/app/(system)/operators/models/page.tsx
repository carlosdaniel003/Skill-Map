// src/app/(system)/operators/models/page.tsx
"use client"

import "./page.css"
import { useEffect,useState } from "react"
import { useRouter } from "next/navigation"

import {
  getAllProductionLines,
  createProductionLine,
  updateProductionLine,
  toggleProductionLineActive,
  updateProductionLineOrder
} from "@/services/database/operatorRepository"

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
      await createProductionLine(
        newModel,
        newCategory
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
      await updateProductionLine(
        id,
        editName,
        editCategory
      )
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
  }

  function handleBack(){
    router.push("/operators")
  }

  return(

    <div className="modelsPage">

      <div className="pageHeader">
        <button className="backButton" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        <div className="headerTitle">
          <h1 className="pageTitle">Modelos de Produção</h1>
          <p className="pageSubtitle">Crie, edite e organize a ordem de exibição dos modelos de produção (Drag & Drop).</p>
        </div>
      </div>

      <div className="modelsGrid">

        {/* CRIAR MODELO */}
        <div className="corporateCard formCard">
          <h2>Novo Modelo</h2>

          <div className="formGroup">
            <label>Nome do Modelo (Linha)</label>
            <input
              className="corporateInput"
              placeholder="Ex: BX-18, D-14..."
              value={newModel}
              onChange={e=>setNewModel(e.target.value)}
            />
          </div>

          <div className="formGroup mt-2">
  <label>Categoria (Opcional)</label>

  <input
    className="corporateInput"
    placeholder="Ex: DVD, NBX..."
    value={newCategory}
    onChange={(e)=>handleCategoryChange(e.target.value)}
  />

  {categorySuggestions.length > 0 && (

    <div className="autocompleteList">

      {categorySuggestions.map(cat=>(
        <div
          key={cat}
          className="autocompleteItem"
          onClick={()=>{

            setNewCategory(cat)
            setCategorySuggestions([])

          }}
        >
          {cat}
        </div>
      ))}

    </div>

  )}

</div>

          <button
            className="primaryButton fullWidth mt-3"
            onClick={handleCreateModel}
            disabled={!newModel}
          >
            Salvar Modelo
          </button>
        </div>

        {/* LISTA MODELOS */}
        <div className="corporateCard tableCard">
          <h2>Modelos Cadastrados</h2>

          <div className="tableContainer">
            <table className="corporateTable">
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
                      {editingId === line.id ? (
                        <input
                          autoFocus
                          className="corporateInput"
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
                          className="corporateInput"
                          value={editCategory}
                          onChange={e=>setEditCategory(e.target.value)}
                        />
                      ) : (
                        line.categoria || <span className="emptyText">Sem categoria</span>
                      )}
                    </td>

                    <td>
                      {line.ativo ? (
                        <span className="statusBadge badge-active">Ativo</span>
                      ) : (
                        <span className="statusBadge badge-inactive">Inativo</span>
                      )}
                    </td>

                    <td className="actionColumn">
                      {editingId === line.id ? (
                        <div className="actionGroup">
                          <button
                            className="actionIconBtn saveBtn"
                            onClick={()=>saveEdit(line.id)}
                            title="Salvar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5"/>
                            </svg>
                          </button>

                          <button
                            className="actionIconBtn cancelBtn"
                            onClick={cancelEdit}
                            title="Cancelar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="actionGroup">
                          <button
                            className="secondaryButton smallButton"
                            onClick={()=>startEdit(line)}
                          >
                            Editar
                          </button>

                          <button
                            className={`smallButton ${line.ativo ? "dangerButton" : "successButton"}`}
                            onClick={()=>toggleActive(line)}
                          >
                            {line.ativo ? "Desativar" : "Reativar"}
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))}
                
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="emptyState">
                      Nenhum modelo cadastrado.
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