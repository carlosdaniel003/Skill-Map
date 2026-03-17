// src/app/(system)/operators/history/[id]/hooks/useOperatorHistory.ts
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/services/database/supabaseClient"
import {
  getProductionLines,
  getWorkstations,
  addOperatorExperience, 
  getFullOperatorHistory,
  deactivateOperatorExperience,
  activateOperatorExperience,
  getOperators,
  deactivateOperatorHistory,
  activateOperatorHistory,
  getLineSkillDifficulties 
} from "@/services/database/operatorRepository"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export interface SkillAssessment {
  posto: string
  dificuldade: number
  level: number
}

export function useOperatorHistory(operatorId: string) {
  const router = useRouter()
  const sessionUser = getSession()

  const [operator, setOperator] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [workstations, setWorkstations] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [showInactive, setShowInactive] = useState(false)

  const [linha, setLinha] = useState("")
  
  const [assessments, setAssessments] = useState<SkillAssessment[]>([])
  const [initialAssessments, setInitialAssessments] = useState<SkillAssessment[]>([])

  // ESTADO DE SALVAMENTO PARA BLOQUEAR O BOTÃO
  const [isSaving, setIsSaving] = useState(false)

  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)

  useEffect(() => {
    if (operatorId) {
      loadOperator()
      loadLines()
      loadWorkstations()
      loadHistory()
    }
  }, [operatorId])

  useEffect(() => {
    async function prepareAssessments() {
      if (!linha) {
        setAssessments([])
        setInitialAssessments([])
        return
      }
      
      const diffs = await getLineSkillDifficulties(linha)
      const existingExpForLine = history.filter((h: any) => h.linha === linha && h.origem === "experiencia" && h.ativo !== false)
      
      const loadedAssessments = workstations.map(ws => {
        const savedExp = existingExpForLine.find((e: any) => e.posto.trim() === ws.nome.trim())
        return {
          posto: ws.nome,
          dificuldade: diffs[ws.nome] || 1,
          level: savedExp ? Number(savedExp.skill_level) : 1
        }
      })

      setAssessments(loadedAssessments)
      setInitialAssessments(loadedAssessments)
    }
    prepareAssessments()
  }, [linha, workstations, history])

  async function loadOperator(){
    const operators = await getOperators()
    const op = operators.find((o:any) => o.id === operatorId)
    setOperator(op)
  }

  async function loadLines(){
    const data = await getProductionLines()
    setLines(data)
  }

  async function loadWorkstations(){
    const data = await getWorkstations()
    setWorkstations(data)
  }

  async function loadHistory(){
    const data = await getFullOperatorHistory(operatorId)
    setHistory(data)
  }

  function handleAssessmentChange(posto: string, newLevel: number) {
    setAssessments(prev => prev.map(a => 
      a.posto === posto ? { ...a, level: newLevel } : a
    ))
  }

  function handleDeactivate(id: string, origem: string){
    const targetExp = history.find(e => e.id === id)
    setConfirmConfig({
      title: "Desativar Experiência",
      message: "Deseja realmente desativar esta experiência do histórico do operador?",
      onConfirm: async () => {
        if(origem === "movimentacao") await deactivateOperatorHistory(id)
        else await deactivateOperatorExperience(id)

        if(targetExp) {
          await logAction(
            sessionUser?.username || "sistema", 
            "history_toggle", 
            `Desativou histórico de ${operator?.nome}: ${targetExp.linha} - ${targetExp.posto}`
          )
        }
        loadHistory()
      }
    })
  }

  async function handleActivate(id: string, origem: string){
    const targetExp = history.find(e => e.id === id)
    if(origem === "movimentacao") await activateOperatorHistory(id)
    else await activateOperatorExperience(id)

    if(targetExp) {
      await logAction(
        sessionUser?.username || "sistema", 
        "history_toggle", 
        `Reativou histórico de ${operator?.nome}: ${targetExp.linha} - ${targetExp.posto}`
      )
    }
    loadHistory()
  }

  // =========================================================================
  // SALVAMENTO ABSOLUTO COM BLOQUEIO DE BOTÃO
  // =========================================================================
  async function handleSave(){
    // Evita duplo clique se já estiver salvando
    if (isSaving) return

    if(!linha){
      setAlertConfig({ title: "Atenção", message: "Selecione o modelo de produção." })
      return
    }

    const changedAssessments = assessments.filter(a => {
      const initial = initialAssessments.find(init => init.posto === a.posto)
      return initial && initial.level !== a.level
    })

    if(changedAssessments.length === 0) {
       setAlertConfig({ 
         title: "Sem Alterações", 
         message: "Nenhuma mudança de nível foi detectada e as skills já estão sincronizadas." 
       })
       return
    }

    // Bloqueia o botão
    setIsSaving(true)

    try {
      const dataRegistro = new Date().toISOString().split("T")[0]
      let savedCount = 0

      // 1. Atualiza a tabela de Histórico APENAS para o que o gestor mudou na tela
      for(const assessment of changedAssessments) {
        const existing = history.find((h:any) => h.linha === linha && h.posto === assessment.posto && h.origem === "experiencia" && h.ativo !== false)

        if (existing) {
          await deactivateOperatorExperience(existing.id)
        }

        if (assessment.level > 1) {
          await addOperatorExperience({
            operator_id: operatorId,
            linha,
            posto: assessment.posto,
            data_inicio: dataRegistro,
            skill_level: assessment.level
          })
        }
        savedCount++
      }

      // 2. SINCRONIZAÇÃO GERAL COM A TELA DE SKILLS BASE
      for(const assessment of assessments) {
        const isExplicitlyChanged = changedAssessments.some(c => c.posto === assessment.posto)

        const { data: existingSkill } = await supabase
          .from("operator_skills")
          .select("id, skill_level")
          .eq("operator_id", operatorId)
          .eq("posto", assessment.posto)
          .maybeSingle()

        if (existingSkill) {
          if (isExplicitlyChanged || assessment.level > existingSkill.skill_level) {
            await supabase.from("operator_skills").update({ skill_level: assessment.level }).eq("id", existingSkill.id)
          }
        } else {
          await supabase.from("operator_skills").insert({ operator_id: operatorId, posto: assessment.posto, skill_level: assessment.level })
        }
      }

      await logAction(
        sessionUser?.username || "sistema", 
        "history_add", 
        `Atualizou/Sincronizou exp. manual p/ ${operator?.nome}: ${linha}`
      )

      setLinha("")
      setAssessments([])
      await loadHistory() // Aguarda o histórico carregar antes de mostrar a mensagem

      setAlertConfig({
        title: "Sucesso",
        message: "Avaliação registrada e sincronizada com sucesso nas Habilidades do colaborador!"
      })

    } catch (error) {
      console.error("Erro ao salvar histórico:", error)
      setAlertConfig({
        title: "Erro",
        message: "Ocorreu um erro ao salvar as informações. Tente novamente."
      })
    } finally {
      // Libera o botão independente de dar certo ou errado
      setIsSaving(false)
    }
  }

  function handleBack(){
    router.push("/operators")
  }

  return {
    operator,
    modals: { alertConfig, setAlertConfig, confirmConfig, setConfirmConfig },
    form: {
      lines,
      linha, setLinha,
      assessments, handleAssessmentChange,
      isSaving, // <-- Exportamos para o formulário
      handleSave
    },
    table: {
      history,
      showInactive, setShowInactive,
      loadHistory, handleActivate, handleDeactivate
    },
    handleBack
  }
}