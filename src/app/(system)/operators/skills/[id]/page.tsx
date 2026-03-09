// src/app/(system)/operators/skills/[id]/page.tsx
"use client"

import "./page.css"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { supabase } from "@/services/database/supabaseClient"
import { getOperators } from "@/services/database/operatorRepository"

export default function OperatorSkillsPage(){

  const params = useParams()
  const router = useRouter()

  const operatorId = params.id as string

  const [operator,setOperator] = useState<any>(null)

  const [skills,setSkills] = useState<any[]>([])
  const [originalSkills,setOriginalSkills] = useState<any[]>([])

  const [hasChanges,setHasChanges] = useState(false)

  useEffect(()=>{
    loadOperator()
    loadSkills()
  },[])

  async function loadOperator(){
    const operators = await getOperators()
    const op = operators.find((o:any)=>o.id === operatorId)
    setOperator(op)
  }

  async function loadSkills(){
    const { data, error } = await supabase
      .from("operator_skills")
      .select("*")
      .eq("operator_id",operatorId)
      .order("posto")

    if(error){
      console.error(error)
      return
    }

    setSkills(data || [])
    setOriginalSkills(JSON.parse(JSON.stringify(data || [])))
    setHasChanges(false)
  }

  function handleChangeSkill(id:string,level:number){
    const updated = skills.map(skill => {
      if(skill.id === id){
        return {
          ...skill,
          skill_level:level
        }
      }
      return skill
    })

    setSkills(updated)
    setHasChanges(true)
  }

  async function handleSave(){
    /* identificar mudanças */
    const changedSkills = skills.filter(skill => {
      const original = originalSkills.find(s => s.id === skill.id)
      return original && original.skill_level !== skill.skill_level
    })

    if(changedSkills.length === 0){
      setHasChanges(false)
      return
    }

    /* registrar histórico */
    const history = changedSkills.map(skill => {
      const original = originalSkills.find(s => s.id === skill.id)
      return {
        operator_id: operatorId,
        posto: skill.posto,
        skill_level: skill.skill_level,
        previous_level: original?.skill_level
      }
    })

    const { error:historyError } = await supabase
      .from("operator_skills_history")
      .insert(history)

    if(historyError){
      console.error(
        "Erro ao salvar histórico:",
        JSON.stringify(historyError,null,2)
      )
    }

    /* atualizar skills (update seguro) */
    const updates = changedSkills.map(skill => {
      return supabase
        .from("operator_skills")
        .update({
          skill_level: skill.skill_level
        })
        .eq("id", skill.id)
    })

    const results = await Promise.all(updates)

    for(const r of results){
      if(r.error){
        console.error(
          "Erro update skills:",
          JSON.stringify(r.error,null,2)
        )
      }
    }

    await loadSkills()
  }

  function handleCancel(){
    setSkills(JSON.parse(JSON.stringify(originalSkills)))
    setHasChanges(false)
  }

  function handleBack(){
    if(hasChanges){
      const confirmLeave = confirm(
        "Existem alterações não salvas. Deseja sair sem salvar?"
      )
      if(!confirmLeave) return
    }
    router.push("/operators")
  }

  return(

    <div className="skillsPage">

      <div className="pageHeader">
        <button className="backButton" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        {operator && (
          <div className="headerInfo">
            <h1 className="pageTitle">{operator.nome}</h1>
            <span className="pageSubtitle">Matrícula: {operator.matricula}</span>
          </div>
        )}
      </div>

      <div className="corporateCard">
        
        <div className="cardHeader">
          <h2>Matriz de Habilidades (Skill Matrix)</h2>
        </div>

        <div className="tableContainer">
          <table className="corporateTable">
            
            <thead>
              <tr>
                <th>Posto de Trabalho</th>
                <th className="levelColumn">Nível de Habilidade</th>
              </tr>
            </thead>

            <tbody>
              {skills.length > 0 ? (
                skills.map(skill=>(
                  <tr key={skill.id}>
                    <td className="fontWeight500">{skill.posto}</td>
                    <td className="levelColumn">
                      <select
                        className="corporateSelect"
                        value={skill.skill_level}
                        onChange={e=>
                          handleChangeSkill(
                            skill.id,
                            Number(e.target.value)
                          )
                        }
                      >
                        <option value={1}>1 - Nunca fez</option>
                        <option value={2}>2 - Em treinamento</option>
                        <option value={3}>3 - Apto a operar</option>
                        <option value={4}>4 - Especialista</option>
                        <option value={5}>5 - Instrutor</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="emptyState">
                    Nenhuma habilidade cadastrada para este operador.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {hasChanges && (
          <div className="actionFooter">
            <span className="warningText">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" x2="12" y1="8" y2="12"/>
                <line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              Alterações não salvas
            </span>
            <div className="buttonGroup">
              <button className="secondaryButton" onClick={handleCancel}>
                Cancelar
              </button>
              <button className="primaryButton saveButton" onClick={handleSave}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

      </div>

    </div>

  )

}