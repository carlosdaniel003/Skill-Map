"use client"

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

const original =
originalSkills.find(s => s.id === skill.id)

return original &&
original.skill_level !== skill.skill_level

})

if(changedSkills.length === 0){

setHasChanges(false)
return

}

/* registrar histórico */

const history = changedSkills.map(skill => {

const original =
originalSkills.find(s => s.id === skill.id)

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

<div className="page">  <div className="pageHeader"><button onClick={handleBack}>
  ← Voltar
</button>

{operator && (

  <div>

    <h1>{operator.nome}</h1>
    <span>Matrícula: {operator.matricula}</span>

  </div>

)}

  </div>  <h2>Skill Matrix do Operador</h2>  <table className="skillsTable"><thead>

  <tr>

    <th>Posto</th>
    <th>Nível</th>

  </tr>

</thead>

<tbody>

  {skills.map(skill=>(

    <tr key={skill.id}>

      <td>{skill.posto}</td>

      <td>

        <select
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

  ))}

</tbody>

  </table>{hasChanges && (

<div className="skillsActions">

  <button
    className="saveButton"
    onClick={handleSave}
  >
    Salvar Alterações
  </button>

  <button
    className="cancelButton"
    onClick={handleCancel}
  >
    Cancelar
  </button>

</div>

)}

</div>)

}