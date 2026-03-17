// src/app/(system)/operators/skills/[id]/hooks/useOperatorSkills.ts
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/services/database/supabaseClient"
import { getOperators, getLineSkillDifficulties } from "@/services/database/operatorRepository"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export function useOperatorSkills(operatorId: string) {
  const router = useRouter()
  const sessionUser = getSession()

  const [isLoading, setIsLoading] = useState(true)

  const [operator, setOperator] = useState<any>(null)
  const [skills, setSkills] = useState<any[]>([])
  const [originalSkills, setOriginalSkills] = useState<any[]>([])
  const [lineDifficulties, setLineDifficulties] = useState<Record<string, number>>({}) // Guarda as dificuldades
  const [hasChanges, setHasChanges] = useState(false)

  const [showConfirmLeave, setShowConfirmLeave] = useState(false)

  useEffect(() => {
    if(operatorId) {
      initializePage()
    }
  }, [operatorId])

  async function initializePage(){
    setIsLoading(true)
    
    // REMOVIDO: await recalculateOperatorSkills(operatorId)
    // O recálculo apagava a avaliação manual do gestor se o tempo de histórico não fosse suficiente.

    await loadOperatorAndDifficulties()
    await loadSkills()
    setIsLoading(false)
  }

  async function loadOperatorAndDifficulties(){
    const operators = await getOperators()
    const op = operators.find((o:any)=>o.id === operatorId)
    setOperator(op)

    // Se o operador estiver em uma linha, carrega as dificuldades dela
    if (op && op.linha_atual) {
      const diffs = await getLineSkillDifficulties(op.linha_atual)
      setLineDifficulties(diffs)
    }
  }

  async function loadSkills(){
    const { data, error } = await supabase
      .from("operator_skills")
      .select("*")
      .eq("operator_id", operatorId)
      .order("posto")

    if(error){
      console.error(error)
      return
    }

    setSkills(data || [])
    setOriginalSkills(JSON.parse(JSON.stringify(data || [])))
    setHasChanges(false)
  }

  function handleChangeSkill(id: string, level: number){
    const updated = skills.map(skill => {
      if(skill.id === id){
        return { ...skill, skill_level: level }
      }
      return skill
    })

    setSkills(updated)
    setHasChanges(true)
  }

  async function handleSave(){
    const changedSkills = skills.filter(skill => {
      const original = originalSkills.find(s => s.id === skill.id)
      return original && original.skill_level !== skill.skill_level
    })

    if(changedSkills.length === 0){
      setHasChanges(false)
      return
    }

    const history = changedSkills.map(skill => {
      const original = originalSkills.find(s => s.id === skill.id)
      return {
        operator_id: operatorId,
        posto: skill.posto,
        skill_level: skill.skill_level,
        previous_level: original?.skill_level
      }
    })

    const { error: historyError } = await supabase.from("operator_skills_history").insert(history)

    if(historyError) console.error("Erro histórico:", historyError)

    const updates = changedSkills.map(skill => {
      return supabase
        .from("operator_skills")
        .update({ skill_level: skill.skill_level })
        .eq("id", skill.id)
    })

    await Promise.all(updates)

    const actionDetails = changedSkills.map(skill => {
        const original = originalSkills.find(s => s.id === skill.id)
        return `[${skill.posto}: de Nvl ${original?.skill_level || 0} para Nvl ${skill.skill_level}]`
    }).join(", ")

    await logAction(
      sessionUser?.username || "sistema", 
      "skill_level_update", 
      `Avaliou ${operator?.nome || 'o operador'}: ${actionDetails}`
    )

    await loadSkills()
  }

  function handleCancel(){
    setSkills(JSON.parse(JSON.stringify(originalSkills)))
    setHasChanges(false)
  }

  function handleBackClick(){
    if(hasChanges){
      setShowConfirmLeave(true)
    } else {
      router.push("/operators")
    }
  }

  function confirmLeavePage(){
    setShowConfirmLeave(false)
    router.push("/operators")
  }

  return {
    isLoading,
    operator,
    modals: { showConfirmLeave, setShowConfirmLeave, confirmLeavePage },
    table: {
      skills,
      lineDifficulties,
      operatorLine: operator?.linha_atual,
      hasChanges,
      handleChangeSkill,
      handleSave,
      handleCancel
    },
    actions: { handleBackClick }
  }
}