"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

export default function OperatorSkillGrade(){

const { filters } = useDashboardFilters()

const [totalPoints,setTotalPoints] = useState(0)
const [maxPoints,setMaxPoints] = useState(0)
const [ratio,setRatio] = useState(0)
const [grade,setGrade] = useState("")
const [color,setColor] = useState("#ef4444")

useEffect(()=>{

loadData()

},[filters.operatorId])

async function loadData(){

if(!filters.operatorId){

setTotalPoints(0)
setMaxPoints(0)
setRatio(0)
setGrade("")
return

}

const { data,error } = await supabase
.from("operator_skills")
.select("skill_level")
.eq("operator_id",filters.operatorId)

if(error){

console.error(error)
return

}

if(!data) return

const total = data.reduce(
(acc,row)=> acc + row.skill_level,
0
)

const max = data.length * 5

const sr = max > 0
? Math.round((total / max) * 100)
: 0

setTotalPoints(total)
setMaxPoints(max)
setRatio(sr)

/* classificação */

let gradeText = ""
let barColor = "#ef4444"

if(sr <= 30){

gradeText = "Operador Iniciante"
barColor = "#ef4444"

}else if(sr <= 60){

gradeText = "Operador em Desenvolvimento"
barColor = "#f59e0b"

}else if(sr <= 80){

gradeText = "Operador Especialista"
barColor = "#22c55e"

}else{

gradeText = "Operador Instrutor"
barColor = "#16a34a"

}

setGrade(gradeText)
setColor(barColor)

}

if(!filters.operatorId){

return(

<div
style={{
padding:20,
background:"rgba(255,255,255,0.03)",
borderRadius:12
}}
>

Selecione um operador para visualizar o Skill Grade

</div>

)

}

return(

<div
style={{
padding:20,
background:"rgba(255,255,255,0.03)",
borderRadius:12,
maxWidth:350
}}
>

<h3 style={{marginBottom:15}}>
Skill Level Grade
</h3>

<div style={{fontSize:14,marginBottom:15}}>

<div>Total Points: {totalPoints}</div>

<div>Skill Ratio: {ratio}%</div>

<div>Classificação: {grade}</div>

<div>Min SR: 80%</div>

</div>

{/* BARRA DE PROGRESSO */}

<div
style={{
height:12,
background:"#1f2937",
borderRadius:6,
overflow:"hidden",
marginBottom:10
}}
>

<div
style={{
width:`${ratio}%`,
height:"100%",
background:color,
transition:"width 0.4s ease"
}}
/>

</div>

<div style={{fontSize:12,color:"#9ca3af"}}>
Progresso de desenvolvimento de habilidades
</div>

</div>

)

}