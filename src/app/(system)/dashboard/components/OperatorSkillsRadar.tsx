"use client"

import { useEffect, useState } from "react"

import {
RadarChart,
PolarGrid,
PolarAngleAxis,
PolarRadiusAxis,
Radar,
ResponsiveContainer
} from "recharts"

import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

interface Skill{
posto:string
skill_level:number
}

export default function OperatorSkillsRadar(){

const { filters } = useDashboardFilters()

const [skills,setSkills] = useState<Skill[]>([])
const [operatorName,setOperatorName] = useState("")

useEffect(()=>{

loadSkills()

},[filters.operatorId])

async function loadSkills(){

if(!filters.operatorId){

setSkills([])
setOperatorName("")
return

}

/* buscar operador */

const { data:operator } = await supabase
.from("operators")
.select("nome")
.eq("id",filters.operatorId)
.single()

if(operator){

setOperatorName(operator.nome)

}

/* buscar skills */

const { data,error } = await supabase
.from("operator_skills")
.select("posto,skill_level")
.eq("operator_id",filters.operatorId)
.order("posto")

if(error){

console.error(error)
return

}

setSkills(data || [])

}

const data = skills.map(skill => ({

posto: skill.posto,
nivel: skill.skill_level

}))

if(!filters.operatorId){

return(

<div
style={{
width:"100%",
height:400,
background:"rgba(255,255,255,0.03)",
padding:20,
borderRadius:12,
display:"flex",
alignItems:"center",
justifyContent:"center"
}}
>Selecione um operador para visualizar o radar

</div>)

}

return(

<div
style={{
width:"100%",
height:400,
background:"rgba(255,255,255,0.03)",
padding:20,
borderRadius:12
}}
><h3 style={{marginBottom:20}}>
Radar de Habilidades — {operatorName}
</h3><ResponsiveContainer width="100%" height="100%"><RadarChart data={data}><PolarGrid /><PolarAngleAxis
dataKey="posto"
tick={{fontSize:12}}
/>

<PolarRadiusAxis
angle={30}
domain={[0,5]}
/>

<Radar
name="Skill"
dataKey="nivel"
stroke="#3b82f6"
fill="#3b82f6"
fillOpacity={0.6}
/>

</RadarChart></ResponsiveContainer></div>)

}