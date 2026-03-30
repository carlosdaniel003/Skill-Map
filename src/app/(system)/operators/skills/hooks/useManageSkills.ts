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

// Atualizado: Agora o Kit guarda também a quantidade necessária de pessoas
interface SkillMatrixState {
  active: boolean
  diff: number
  qtd: number 
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

  async function loadMatrixData(linha: string){
    if (skills.length === 0) return

    // NOVO: Buscando também a qtd_necessaria
    const { data } = await supabase
      .from('line_skill_difficulty')
      .select('posto, dificuldade, qtd_necessaria')
      .eq('linha', linha)

    const newConfig: Record<string, SkillMatrixState> = {}
    
    skills.forEach(s => {
      const found = data?.find(d => d.posto === s.nome)
      newConfig[s.nome] = { 
        active: !!found,
        diff: found ? found.dificuldade : 1,
        qtd: found?.qtd_necessaria || 1 // NOVO: Mapeia a quantidade ou joga 1 como padrão
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

  // ================= ABA BASE (MANTIDOS) =================
  async function handleCreateSkill(){
    if(!newSkill){ setAlertConfig({ title:"Atenção", message:"Informe o nome da skill." }); return }
    try{
      await createWorkstation(newSkill)
      await logAction(sessionUser?.username || "sistema", "skill_create", `Criou a skill: ${newSkill}`)
      setNewSkill("")
      loadSkills()
      setAlertConfig({ title:"Sucesso", message:"Nova skill cadastrada." })
    }catch{ setAlertConfig({ title:"Erro", message:"Ocorreu um erro ao salvar." }) }
  }

  function startEdit(skill:any){ setEditingId(skill.id); setEditName(skill.nome); }
  function cancelEdit(){ setEditingId(null); setEditName(""); }

  async function saveEdit(id:string){
    if(!editName){ setAlertConfig({ title:"Nome inválido", message:"O nome não pode ficar vazio." }); return }
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
        }catch{ setAlertConfig({ title:"Erro", message:"Não foi possível alterar." }) }
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
    for(let i=0;i<reordered.length;i++){ await updateWorkstationOrder(reordered[i].id, i) }
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
      const next = { ...prev, [posto]: { ...prev[posto], active: true, diff } }
      setHasMatrixChanges(JSON.stringify(next) !== JSON.stringify(matrixConfig))
      return next
    })
  }

  // NOVO: Função para alterar a quantidade
  function changeQuantityInLine(posto: string, qtd: number) {
    if (!selectedLine) return
    setDraftMatrix(prev => {
      // Força no mínimo 1. Se mudar a qtd, já liga a skill automaticamente.
      const safeQtd = Math.max(1, qtd)
      const next = { ...prev, [posto]: { ...prev[posto], active: true, qtd: safeQtd } }
      setHasMatrixChanges(JSON.stringify(next) !== JSON.stringify(matrixConfig))
      return next
    })
  }

  function applySkillToAllLines(posto: string) {
    const draft = draftMatrix[posto]
    const actionText = draft.active 
      ? `ADICIONADA (Nível ${draft.diff} | Qtd ${draft.qtd}) em TODOS os modelos` 
      : `REMOVIDA de TODOS os modelos`

    setConfirmConfig({
      title: "Aplicar a todos os modelos?",
      message: `Atenção: A habilidade "${posto}" será ${actionText}. Deseja prosseguir?`,
      onConfirm: async () => {
        try {
          if (draft.active) {
            const upserts = lines.map(l => ({ 
              linha: l.nome, 
              posto, 
              dificuldade: draft.diff,
              qtd_necessaria: draft.qtd // NOVO: Salva a quantidade
            }))
            await supabase.from('line_skill_difficulty').upsert(upserts, { onConflict: 'linha,posto' })
          } else {
            await supabase.from('line_skill_difficulty').delete().eq('posto', posto)
          }
          await logAction(sessionUser?.username || "sistema", "matrix_bulk_update", `Aplicou regra global para skill: ${posto}`)
          setAlertConfig({ title: "Sucesso", message: "Regra aplicada a todos os modelos com sucesso!" })
          loadMatrixData(selectedLine) 
        } catch (error) {
          setAlertConfig({ title: "Erro", message: "Ocorreu um erro ao aplicar a regra global." })
        }
      }
    })
  }

  // NOVA FUNÇÃO: Aplica TODAS as configurações da matriz atual para TODAS as linhas de produção
  function applyAllSkillsToAllLines() {
    if (!selectedLine) return

    setConfirmConfig({
      title: "Aplicar TUDO a todos os modelos?",
      message: `Atenção: A configuração COMPLETA de habilidades do modelo "${selectedLine}" será copiada para TODOS os outros modelos. Deseja prosseguir?`,
      onConfirm: async () => {
        try {
          const toUpsert: any[] = []
          const toDeletePostos: string[] = []

          // Percorre a configuração atual da tela (draftMatrix)
          Object.entries(draftMatrix).forEach(([posto, draft]) => {
            if (draft.active) {
              // Prepara a inserção/atualização para TODAS as linhas ativas
              lines.forEach(l => {
                toUpsert.push({
                  linha: l.nome,
                  posto,
                  dificuldade: draft.diff,
                  qtd_necessaria: draft.qtd
                })
              })
            } else {
              // Se a skill está desativada no modelo atual, vamos remover de TODOS os modelos para manter a paridade
              toDeletePostos.push(posto)
            }
          })

          // 1. Remove as skills inativas de todas as linhas
          if (toDeletePostos.length > 0) {
            await supabase.from('line_skill_difficulty').delete().in('posto', toDeletePostos)
          }

          // 2. Faz o Upsert (cria ou atualiza) das skills ativas para todas as linhas
          if (toUpsert.length > 0) {
            await supabase.from('line_skill_difficulty').upsert(toUpsert, { onConflict: 'linha,posto' })
          }

          await logAction(sessionUser?.username || "sistema", "matrix_bulk_update_all", `Replicou a matriz do modelo ${selectedLine} para todos os outros`)
          
          setAlertConfig({ title: "Sucesso", message: "Configuração completa replicada para todos os modelos com sucesso!" })
          loadMatrixData(selectedLine) // Recarrega os dados e limpa o status de edição
        } catch (error) {
          console.error(error)
          setAlertConfig({ title: "Erro", message: "Ocorreu um erro ao replicar a configuração." })
        }
      }
    })
  }

  async function saveMatrixChanges() {
    try {
      const toDelete: string[] = []
      const toUpsert: any[] = []

      Object.entries(draftMatrix).forEach(([posto, draft]) => {
        const original = matrixConfig[posto]
        // Compara também se a quantidade mudou
        if (draft.active !== original.active || draft.diff !== original.diff || draft.qtd !== original.qtd) {
          if (!draft.active) {
            toDelete.push(posto)
          } else {
            toUpsert.push({ 
              linha: selectedLine, 
              posto, 
              dificuldade: draft.diff,
              qtd_necessaria: draft.qtd // NOVO
            })
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
      draftMatrix, 
      toggleSkillInLine, 
      changeDifficultyInLine, 
      changeQuantityInLine, 
      applySkillToAllLines,
      applyAllSkillsToAllLines, // <--- EXPORTADA AQUI AGORA
      hasMatrixChanges, 
      saveMatrixChanges, 
      cancelMatrixChanges
    },
    handleBackClick
  }
}