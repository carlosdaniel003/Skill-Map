// src/app/(system)/operators/skills/hooks/useManageSkills.ts
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/services/database/supabaseClient"
import {
  getAllWorkstations,
  createWorkstation,
  updateWorkstation,
  toggleWorkstation,
  updateWorkstationOrder,
  getAllProductionLines
} from "@/services/database/operatorRepository"
import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

// Tipo para controlar o estado da Skill na Linha
interface SkillMatrixState {
  active: boolean
  diff: number
}

export function useManageSkills() {
  const router = useRouter()
  const sessionUser = getSession()

  const [activeTab, setActiveTab] = useState<"base" | "matrix">("base")

  // ABA BASE
  const [skills, setSkills] = useState<any[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ABA MATRIZ (Kit por Modelo)
  const [lines, setLines] = useState<any[]>([])
  const [selectedLine, setSelectedLine] = useState("")
  const [matrixConfig, setMatrixConfig] = useState<Record<string, SkillMatrixState>>({}) 
  const [draftMatrix, setDraftMatrix] = useState<Record<string, SkillMatrixState>>({})
  const [hasMatrixChanges, setHasMatrixChanges] = useState(false)

  // MODAIS
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
      loadMatrixData(selectedLine)
    } else {
      setMatrixConfig({})
      setDraftMatrix({})
      setHasMatrixChanges(false)
    }
  }, [selectedLine, skills])

  async function loadSkills(){
    const data = await getAllWorkstations()
    const sorted = [...data].sort((a,b)=>(a.ordem ?? 0) - (b.ordem ?? 0))
    setSkills(sorted)
  }

  async function loadLines(){
    const data = await getAllProductionLines()
    setLines(data.filter(l => l.ativo))
  }

  // Carrega o "Kit" do banco para a linha selecionada
  async function loadMatrixData(linha: string){
    if (skills.length === 0) return

    const { data } = await supabase
      .from('line_skill_difficulty')
      .select('posto, dificuldade')
      .eq('linha', linha)

    const newConfig: Record<string, SkillMatrixState> = {}
    
    skills.forEach(s => {
      const found = data?.find(d => d.posto === s.nome)
      newConfig[s.nome] = { 
        active: !!found, // Se encontrou no banco, faz parte do kit
        diff: found ? found.dificuldade : 1 
      }
    })

    setMatrixConfig(newConfig)
    setDraftMatrix(JSON.parse(JSON.stringify(newConfig)))
    setHasMatrixChanges(false)
  }

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
    setDraftMatrix(JSON.parse(JSON.stringify(matrixConfig)))
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  function cancelLeave() {
    setShowConfirmLeave(false)
    setPendingAction(null)
  }

  function handleBackClick() { requestAction(() => router.push("/operators")) }
  function handleTabChange(tab: "base" | "matrix") {
    if (tab === activeTab) return
    requestAction(() => setActiveTab(tab))
  }
  function handleLineChange(linha: string) {
    if (linha === selectedLine) return
    requestAction(() => setSelectedLine(linha))
  }

  // ================= ABA BASE =================
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

  // ================= ABA MATRIZ (KITS) =================
  function toggleSkillInLine(posto: string) {
    if (!selectedLine) return
    setDraftMatrix(prev => {
      const next = { ...prev, [posto]: { ...prev[posto], active: !prev[posto].active } }
      setHasMatrixChanges(JSON.stringify(next) !== JSON.stringify(matrixConfig))
      return next
    })
  }

  function changeDifficultyInLine(posto: string, diff: number) {
    if (!selectedLine) return
    setDraftMatrix(prev => {
      // Se mudar a dificuldade, liga a skill automaticamente
      const next = { ...prev, [posto]: { active: true, diff } }
      setHasMatrixChanges(JSON.stringify(next) !== JSON.stringify(matrixConfig))
      return next
    })
  }

  // A FUNÇÃO MÁGICA: Aplica a configuração atual de uma skill para TODAS as linhas de produção
  function applySkillToAllLines(posto: string) {
    const draft = draftMatrix[posto]
    const actionText = draft.active 
      ? `ADICIONADA como Nível ${draft.diff} em TODOS os modelos de produção` 
      : `REMOVIDA de TODOS os modelos de produção`

    setConfirmConfig({
      title: "Aplicar a todos os modelos?",
      message: `Atenção: A habilidade "${posto}" será ${actionText}. Deseja prosseguir?`,
      onConfirm: async () => {
        try {
          if (draft.active) {
            // Upsert em todas as linhas ativas
            const upserts = lines.map(l => ({ linha: l.nome, posto, dificuldade: draft.diff }))
            await supabase.from('line_skill_difficulty').upsert(upserts, { onConflict: 'linha,posto' })
          } else {
            // Deleta de todas as linhas
            await supabase.from('line_skill_difficulty').delete().eq('posto', posto)
          }

          await logAction(sessionUser?.username || "sistema", "matrix_bulk_update", `Aplicou regra global para skill: ${posto}`)
          setAlertConfig({ title: "Sucesso", message: "Regra aplicada a todos os modelos com sucesso!" })
          
          // Se tiver outras alterações na tela, não perde elas. Apenas recarrega a foto do banco.
          loadMatrixData(selectedLine) 
        } catch (error) {
          setAlertConfig({ title: "Erro", message: "Ocorreu um erro ao aplicar a regra global." })
        }
      }
    })
  }

  async function saveMatrixChanges() {
    try {
      const toDelete: string[] = []
      const toUpsert: any[] = []

      // Compara o rascunho com a configuração original para saber o que mudou
      Object.entries(draftMatrix).forEach(([posto, draft]) => {
        const original = matrixConfig[posto]
        if (draft.active !== original.active || draft.diff !== original.diff) {
          if (!draft.active) {
            toDelete.push(posto) // Se desligou, deleta do banco
          } else {
            toUpsert.push({ linha: selectedLine, posto, dificuldade: draft.diff }) // Se ligou ou mudou, upsert
          }
        }
      })

      if (toDelete.length > 0) {
        await supabase.from('line_skill_difficulty').delete().eq('linha', selectedLine).in('posto', toDelete)
      }
      
      if (toUpsert.length > 0) {
        await supabase.from('line_skill_difficulty').upsert(toUpsert, { onConflict: 'linha,posto' })
      }

      await logAction(sessionUser?.username || "sistema", "matrix_update", `Atualizou a matriz do modelo: ${selectedLine}`)
      
      setMatrixConfig(draftMatrix)
      setHasMatrixChanges(false)
      setAlertConfig({ title: "Sucesso", message: "Kit de habilidades do modelo salvo com sucesso." })
    } catch (e) {
      setAlertConfig({ title: "Erro", message: "Falha ao salvar as alterações." })
    }
  }

  function cancelMatrixChanges() {
    setDraftMatrix(JSON.parse(JSON.stringify(matrixConfig)))
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
      draftMatrix, toggleSkillInLine, changeDifficultyInLine, applySkillToAllLines,
      hasMatrixChanges, saveMatrixChanges, cancelMatrixChanges
    },
    handleBackClick
  }
}