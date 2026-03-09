"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

export default function SkillMatrixHeatmap(){

const { filters } = useDashboardFilters()

const [operators,setOperators] = useState<any[]>([])
const [postos,setPostos] = useState<string[]>([])
const [matrix,setMatrix] = useState<Record<string,Record<string,number>>>({})

useEffect(()=>{

loadData()

},[filters.linha])

async function loadData(){

if(!filters.linha){

setOperators([])
setPostos([])
setMatrix({})
return

}

/* operadores da linha */

const { data:ops } = await supabase
.from("operators")
.select("id,nome")
.eq("linha_atual",filters.linha)
.eq("ativo",true)
.order("nome")

if(!ops){

setOperators([])
return

}

setOperators(ops)

/* skills */

const { data:skills } = await supabase
.from("operator_skills")
.select("operator_id,posto,skill_level")

if(!skills) return

/* postos únicos */

const uniquePostos = [
...new Set(skills.map(s=>s.posto))
]

setPostos(uniquePostos)

/* montar matriz */

const map:Record<string,Record<string,number>> = {}

ops.forEach(op=>{

map[op.id] = {}

uniquePostos.forEach(p=>{

map[op.id][p] = 0

})

})

skills.forEach((s:any)=>{

if(map[s.operator_id]){

map[s.operator_id][s.posto] = s.skill_level

}

})

setMatrix(map)

}

function getColor(level:number){

switch(level){

case 1: return "#ef4444"
case 2: return "#f97316"
case 3: return "#facc15"
case 4: return "#4ade80"
case 5: return "#16a34a"

default: return "#e5e7eb"

}

}

if(!filters.linha){

return(

<div
style={{
padding:20,
background:"rgba(255,255,255,0.03)",
borderRadius:12
}}
>

Selecione uma linha para visualizar a Skill Matrix

</div>

)

}

return(

<div
style={{
padding:20,
background:"rgba(255,255,255,0.03)",
borderRadius:12,
overflowX:"auto"
}}
>

<h3 style={{marginBottom:20}}>
Skill Matrix — Linha {filters.linha}
</h3>

<table
style={{
borderCollapse:"collapse",
width:"100%"
}}
>

<thead>

<tr>

<th style={{textAlign:"left",padding:8}}>
Operador
</th>

{postos.map(p=>(
<th key={p} style={{padding:8,fontSize:12}}>
{p}
</th>
))}

</tr>

</thead>

<tbody>

{operators.map(op=>(

<tr key={op.id}>

<td style={{padding:8,fontWeight:600}}>
{op.nome}
</td>

{postos.map(p=>{

const level = matrix[op.id]?.[p] ?? 0

return(

<td
key={p}
style={{
textAlign:"center",
padding:6
}}
>

<div
style={{
width:22,
height:22,
borderRadius:4,
margin:"auto",
background:getColor(level),
color:"#000",
fontSize:12,
display:"flex",
alignItems:"center",
justifyContent:"center"
}}
>

{level || ""}

</div>

</td>

)

})}

</tr>

))}

</tbody>

</table>

</div>

)

}