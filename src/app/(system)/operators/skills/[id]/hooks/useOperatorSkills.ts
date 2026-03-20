// src/app/(system)/operators/skills/[id]/hooks/useOperatorSkills.ts
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/services/database/supabaseClient"
import { 
  getOperators, 
  getLineSkillDifficulties, 
  addOperatorExperience, 
  deactivateOperatorExperience 
} from "@/services/database/operatorRepository"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export function useOperatorSkills(operatorId: string) {
  const router = useRouter()
  const sessionUser = getSession()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [operator, setOperator] = useState<any>(null)
  const [skills, setSkills] = useState<any[]>([])
  const [originalSkills, setOriginalSkills] = useState<any[]>([])
  const [lineDifficulties, setLineDifficulties] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const [showConfirmLeave, setShowConfirmLeave] = useState(false)

  useEffect(() => {
    if(operatorId) {
      initializePage()
    }
  }, [operatorId])

  async function initializePage(){
    setIsLoading(true)
    const op = await loadOperatorAndDifficulties()
    // Precisamos passar o op E as dificuldades recém carregadas para a próxima função
    await loadSkills(op)
    setIsLoading(false)
  }

  async function loadOperatorAndDifficulties(){
    const operators = await getOperators()
    const op = operators.find((o:any)=>o.id === operatorId)
    setOperator(op)

    if (op && op.linha_atual) {
      const diffs = await getLineSkillDifficulties(op.linha_atual)
      setLineDifficulties(diffs)
      return { op, diffs } // Retorna os dois juntos para não depender de estado assíncrono
    }
    return { op, diffs: {} }
  }

  async function loadSkills({ op, diffs }: { op: any, diffs: Record<string, number> }){
    if (!op || !op.linha_atual) {
      setSkills([])
      setOriginalSkills([])
      setHasChanges(false)
      return
    }

    // Busca a experiência dele APENAS na linha atual
    const { data: exp, error } = await supabase
      .from("operator_experience")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("linha", op.linha_atual)
      .eq("ativo", true)

    if (error) console.error("Erro ao buscar histórico:", error)

    // MÁGICA: Em vez de mapear todas as 'workstations', mapeamos apenas as chaves do 'diffs' (O Kit do Modelo)
    const allowedSkills = Object.keys(diffs)

    const loadedSkills = allowedSkills.map(skillName => {
      // Procura se ele já tem nota no histórico para essa skill específica (ignorando maiúsculas/minúsculas por segurança)
      const existingList = exp?.filter(e => e.posto.trim().toLowerCase() === skillName.trim().toLowerCase())
      
      // Se tiver mais de um registro ativo, pega o mais alto
      let existing = null
      if (existingList && existingList.length > 0) {
        existing = existingList.sort((a, b) => b.skill_level - a.skill_level)[0]
      }

      return {
        id: skillName, 
        posto: skillName,
        skill_level: existing ? Number(existing.skill_level) : 1, // Começa no 1 (Nunca Fez) se não tiver nada
        exp_id: existing ? existing.id : null 
      }
    })

    // Ordena alfabeticamente para a tabela ficar bonita
    loadedSkills.sort((a, b) => a.posto.localeCompare(b.posto))

    setSkills(loadedSkills)
    setOriginalSkills(JSON.parse(JSON.stringify(loadedSkills)))
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
    if (isSaving) return

    const changedSkills = skills.filter(skill => {
      const original = originalSkills.find(s => s.id === skill.id)
      return original && original.skill_level !== skill.skill_level
    })

    if(changedSkills.length === 0){
      setHasChanges(false)
      return
    }

    setIsSaving(true)

    try {
      const dataRegistro = new Date().toISOString().split("T")[0]
      const linha = operator.linha_atual

      // 1. Salva na tabela de Log (Auditoria invisível)
      const historyLog = changedSkills.map(skill => {
        const original = originalSkills.find(s => s.id === skill.id)
        return {
          operator_id: operatorId,
          posto: skill.posto,
          skill_level: skill.skill_level,
          previous_level: original?.skill_level || 1
        }
      })
      await supabase.from("operator_skills_history").insert(historyLog)

      for(const skill of changedSkills) {
        // 2. Desativa experiência antiga (se existir)
        if (skill.exp_id) {
          await deactivateOperatorExperience(skill.exp_id)
        }
        
        // 3. Adiciona nova experiência (se for > 1)
        if (skill.skill_level > 1) {
          await addOperatorExperience({
            operator_id: operatorId,
            linha,
            posto: skill.posto,
            data_inicio: dataRegistro,
            skill_level: skill.skill_level
          })
        }

        // 4. Mantém a tabela global de Dashboards atualizada (Upsert Manual)
        const { data: existingSkill } = await supabase
          .from("operator_skills")
          .select("id")
          .eq("operator_id", operatorId)
          .eq("posto", skill.posto)
          .maybeSingle()

        if (existingSkill) {
          await supabase.from("operator_skills").update({ skill_level: skill.skill_level }).eq("id", existingSkill.id)
        } else {
          await supabase.from("operator_skills").insert({ operator_id: operatorId, posto: skill.posto, skill_level: skill.skill_level })
        }
      }

      const actionDetails = changedSkills.map(skill => {
          return `[${skill.posto}: Nvl ${skill.skill_level}]`
      }).join(", ")

      await logAction(
        sessionUser?.username || "sistema", 
        "skill_level_update", 
        `Atualizou skills de ${operator?.nome} na linha ${linha}: ${actionDetails}`
      )

      // Recarrega tudo (Passando o operador e as dificuldades que já tínhamos no state)
      await loadSkills({ op: operator, diffs: lineDifficulties })

    } catch (error) {
      console.error("Erro ao salvar skills:", error)
    } finally {
      setIsSaving(false)
    }
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
      isSaving,
      handleSave,
      handleCancel
    },
    actions: { handleBackClick }
  }
}