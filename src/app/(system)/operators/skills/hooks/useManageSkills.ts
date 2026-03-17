// src/app/(system)/operators/skills/hooks/useManageSkills.ts
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getAllWorkstations,
  createWorkstation,
  updateWorkstation,
  toggleWorkstation,
  updateWorkstationOrder,
  getAllProductionLines,
  getLineSkillDifficulties,
  saveLineSkillDifficulty
} from "@/services/database/operatorRepository"
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export function useManageSkills() {
  const router = useRouter()
  const sessionUser = getSession()

  // TABS
  const [activeTab, setActiveTab] = useState<"base" | "matrix">("base")

  // ABA BASE
  const [skills, setSkills] = useState<any[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ABA MATRIZ (Agora com sistema de Rascunho/Draft)
  const [lines, setLines] = useState<any[]>([])
  const [selectedLine, setSelectedLine] = useState("")
  const [difficulties, setDifficulties] = useState<Record<string, number>>({}) // O que está no Banco
  const [draftDifficulties, setDraftDifficulties] = useState<Record<string, number>>({}) // O que o gestor está alterando na tela
  const [hasMatrixChanges, setHasMatrixChanges] = useState(false)

  // MODAIS E CONTROLE DE NAVEGAÇÃO SEGURA
  const [alertConfig, setAlertConfig] = useState<{title:string,message:string}|null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title:string,message:string, onConfirm: () => void}|null>(null)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    loadSkills()
    loadLines()
  }, [])

  useEffect(() => {
    if(selectedLine) {
      loadDifficulties(selectedLine)
    } else {
      setDifficulties({})
      setDraftDifficulties({})
      setHasMatrixChanges(false)
    }
  }, [selectedLine])

  async function loadSkills(){
    const data = await getAllWorkstations()
    const sorted = [...data].sort((a,b)=>(a.ordem ?? 0) - (b.ordem ?? 0))
    setSkills(sorted)
  }

  async function loadLines(){
    const data = await getAllProductionLines()
    setLines(data.filter(l => l.ativo))
  }

  async function loadDifficulties(linha: string){
    const diffs = await getLineSkillDifficulties(linha)
    setDifficulties(diffs)
    setDraftDifficulties(diffs) // Copia o original para o rascunho
    setHasMatrixChanges(false)
  }

  // ==========================================
  // CONTROLE DE NAVEGAÇÃO E AVISO DE SAÍDA
  // ==========================================
  function requestAction(action: () => void) {
    if (hasMatrixChanges) {
      setPendingAction(() => action)
      setShowConfirmLeave(true)
    } else {
      action()
    }
  }

  function confirmLeave() {
    setShowConfirmLeave(false)
    setHasMatrixChanges(false)
    setDraftDifficulties(difficulties) // Limpa os rascunhos
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  function cancelLeave() {
    setShowConfirmLeave(false)
    setPendingAction(null)
  }

  function handleBackClick() {
    requestAction(() => router.push("/operators"))
  }

  function handleTabChange(tab: "base" | "matrix") {
    if (tab === activeTab) return
    requestAction(() => setActiveTab(tab))
  }

  function handleLineChange(linha: string) {
    if (linha === selectedLine) return
    requestAction(() => setSelectedLine(linha))
  }

  // ==========================================
  // MÉTODOS ABA BASE (MANTIDOS)
  // ==========================================
  async function handleCreateSkill(){
    if(!newSkill){
      setAlertConfig({ title:"Atenção", message:"Informe o nome da skill." })
      return
    }
    try{
      await createWorkstation(newSkill)
      await logAction(sessionUser?.username || "sistema", "skill_create", `Criou a skill: ${newSkill}`)
      setNewSkill("")
      loadSkills()
      setAlertConfig({ title:"Sucesso", message:"Nova skill cadastrada." })
    }catch{
      setAlertConfig({ title:"Erro", message:"Ocorreu um erro ao salvar." })
    }
  }

  function startEdit(skill:any){ setEditingId(skill.id); setEditName(skill.nome); }
  function cancelEdit(){ setEditingId(null); setEditName(""); }

  async function saveEdit(id:string){
    if(!editName){
      setAlertConfig({ title:"Nome inválido", message:"O nome não pode ficar vazio." })
      return
    }
    await updateWorkstation(id,editName)
    await logAction(sessionUser?.username || "sistema", "skill_edit", `Editou a skill para: ${editName}`)
    cancelEdit()
    loadSkills()
  }

  function handleToggleSkill(skill:any){
    setConfirmConfig({
      title: skill.ativo ? "Desativar Skill" : "Reativar Skill",
      message: `Tem certeza que deseja ${skill.ativo ? "desativar" : "reativar"} a skill "${skill.nome}"?`,
      onConfirm: async () => {
        try{
          await toggleWorkstation(skill.id, !skill.ativo)
          await logAction(sessionUser?.username || "sistema", "skill_toggle", `${!skill.ativo ? "Reativou" : "Desativou"} a skill: ${skill.nome}`)
          loadSkills()
        }catch{
          setAlertConfig({ title:"Erro", message:"Não foi possível alterar." })
        }
      }
    })
  }

  function handleDragStart(index:number){ setDragIndex(index) }
  async function handleDrop(index:number){
    if(dragIndex === null) return
    const reordered = [...skills]
    const draggedItem = reordered[dragIndex]
    reordered.splice(dragIndex,1)
    reordered.splice(index,0,draggedItem)
    setSkills(reordered)
    setDragIndex(null)
    for(let i=0;i<reordered.length;i++){
      await updateWorkstationOrder(reordered[i].id, i)
    }
    await logAction(sessionUser?.username || "sistema", "skill_edit", `Reordenou a lista de skills`)
  }

  // ==========================================
  // MÉTODOS ABA MATRIZ (RASCUNHO E SALVAMENTO LOTE)
  // ==========================================
  function handleDifficultyDraftChange(posto: string, level: number) {
    if (!selectedLine) return
    
    setDraftDifficulties(prev => {
      const next = { ...prev, [posto]: level }
      
      // Verifica inteligentemente se há diferenças reais com o banco
      let isDifferent = false
      for (const skill of skills) {
        const saved = difficulties[skill.nome] || 1
        const draft = next[skill.nome] || 1
        if (saved !== draft) {
          isDifferent = true
          break
        }
      }
      
      setHasMatrixChanges(isDifferent)
      return next
    })
  }

  async function saveMatrixChanges() {
    try {
      const promises = Object.entries(draftDifficulties).map(([posto, level]) => {
        // Salva apenas os postos que realmente tiveram o nível alterado
        if ((difficulties[posto] || 1) !== level) {
          return saveLineSkillDifficulty(selectedLine, posto, level)
        }
        return Promise.resolve()
      })
      
      await Promise.all(promises)
      await logAction(sessionUser?.username || "sistema", "matrix_update", `Atualizou a matriz de dificuldades do modelo: ${selectedLine}`)
      
      setDifficulties(draftDifficulties)
      setHasMatrixChanges(false)
      setAlertConfig({ title: "Sucesso", message: "Matriz de dificuldades salva com sucesso." })
    } catch (e) {
      setAlertConfig({ title: "Erro", message: "Falha ao salvar as dificuldades." })
      loadDifficulties(selectedLine)
    }
  }

  function cancelMatrixChanges() {
    setDraftDifficulties(difficulties)
    setHasMatrixChanges(false)
  }

  return {
    tabs: { activeTab, handleTabChange, setActiveTab },
    modals: { alertConfig, setAlertConfig, confirmConfig, setConfirmConfig, showConfirmLeave, confirmLeave, cancelLeave },
    base: {
      skills,
      newSkill, setNewSkill, handleCreateSkill,
      editingId, editName, setEditName, startEdit, cancelEdit, saveEdit,
      handleToggleSkill, handleDragStart, handleDrop
    },
    matrix: {
      lines,
      selectedLine, handleLineChange,
      skills,
      draftDifficulties, handleDifficultyDraftChange,
      hasMatrixChanges, saveMatrixChanges, cancelMatrixChanges
    },
    handleBackClick
  }
}