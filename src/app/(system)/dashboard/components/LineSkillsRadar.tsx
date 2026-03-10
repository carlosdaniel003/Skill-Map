// src/app/(system)/dashboard/components/LineSkillsRadar.tsx
"use client"

import "./LineSkillsRadar.css"
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
  label:string
  value:number
}

const CATEGORIES = [
  "BBS",
  "CM",
  "MWO",
  "TM",
  "TV",
  "TW",
  "ARCON"
]

export default function LineSkillsRadar(){

  const { filters } = useDashboardFilters()

  const [mode,setMode] = useState<"skills" | "categories" | "models">("skills")
  const [data,setData] = useState<Skill[]>([])

  useEffect(()=>{
    loadData()
  },[filters.linha,mode])

  async function loadData(){
    if(!filters.linha){
      setData([])
      return
    }

    /* ------------------------------------------------ */
    /* 1️⃣ BUSCAR SKILLS DOS OPERADORES DA LINHA        */
    /* ------------------------------------------------ */
    const { data:skills,error } = await supabase
      .from("operator_skills")
      .select(`
        skill_level,
        posto,
        operators!inner(
          linha_atual
        )
      `)
      .eq("operators.linha_atual",filters.linha)

    if(error){
      console.error("SKILLS QUERY ERROR:", error)
      return
    }

    if(!skills || skills.length === 0){
      setData([])
      return
    }

    /* ------------------------------------------------ */
    /* 2️⃣ BUSCAR DADOS DA LINHA (MODELO / CATEGORIA)    */
    /* ------------------------------------------------ */
    const { data:line,error:lineError } = await supabase
      .from("production_lines")
      .select("nome,categoria")
      .eq("nome",filters.linha)
      .single()

    if(lineError){
      console.error("LINE QUERY ERROR:", lineError)
      return
    }

    /* ------------------------------------------------ */
    /* MODO HABILIDADES                                 */
    /* ------------------------------------------------ */
    if(mode === "skills"){
      const map:Record<string,{total:number,count:number}> = {}

      skills.forEach((row:any)=>{
        if(!map[row.posto]){
          map[row.posto] = { total:0,count:0 }
        }
        map[row.posto].total += row.skill_level
        map[row.posto].count++
      })

      const result:Skill[] = Object.keys(map).map(posto=>({
        label: posto,
        value:Number((map[posto].total / map[posto].count).toFixed(2))
      }))

      setData(result)
    }

    /* ------------------------------------------------ */
    /* MODO CATEGORIAS                                  */
    /* ------------------------------------------------ */
    if(mode === "categories"){
      const map:Record<string,{total:number,count:number}> = {}

      CATEGORIES.forEach(cat=>{
        map[cat] = { total:0,count:0 }
      })

      const categoria = line?.categoria

      if(categoria){
        skills.forEach((row:any)=>{
          map[categoria].total += row.skill_level
          map[categoria].count++
        })
      }

      const result:Skill[] = Object.keys(map).map(cat=>({
        label:cat,
        value: map[cat].count > 0 ? Number((map[cat].total / map[cat].count).toFixed(2)) : 0
      }))

      setData(result)
    }

    /* ------------------------------------------------ */
    /* MODO MODELOS                                     */
    /* ------------------------------------------------ */
    if(mode === "models"){
      /* BUSCAR TODOS OS MODELOS DO BANCO */
      const { data:models, error:modelError } = await supabase
        .from("production_lines")
        .select("nome")

      if(modelError){
        console.error("MODEL QUERY ERROR:", modelError)
        return
      }

      if(!models){
        setData([])
        return
      }

      /* MAPA DE MODELOS */
      const map:Record<string,{total:number,count:number}> = {}

      models.forEach((m:any)=>{
        map[m.nome] = { total:0,count:0 }
      })

      /* SOMAR SKILLS APENAS PARA A LINHA ATUAL */
      skills.forEach((row:any)=>{
        const model = line?.nome
        if(!model) return
        map[model].total += row.skill_level
        map[model].count++
      })

      /* GERAR RESULTADO */
      const result:Skill[] = Object.keys(map).map(model=>({
        label:model,
        value: map[model].count > 0 ? Number((map[model].total / map[model].count).toFixed(2)) : 0
      }))

      setData(result)
    }
  }

  /* ----------------------------- */
  /* ESTADO SEM LINHA (EMPTY STATE)*/
  /* ----------------------------- */
  if(!filters.linha){
    return(
      <div className="corporateCard radarCard emptyRadarCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
          <line x1="12" y1="22" x2="12" y2="15.5"/>
          <polyline points="22 8.5 12 15.5 2 8.5"/>
          <polyline points="2 15.5 12 8.5 22 15.5"/>
          <line x1="12" y1="2" x2="12" y2="8.5"/>
        </svg>
        <p>Selecione um modelo de produção no filtro acima para visualizar o radar de skills coletivo.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* RENDER DO GRÁFICO             */
  /* ----------------------------- */
  
  // Define a cor do gráfico com base no modo ativo para dar feedback visual
  const getChartColor = () => {
    if(mode === "skills") return "#d40000" // Vermelho da marca
    if(mode === "categories") return "#3b82f6" // Azul
    return "#f59e0b" // Laranja
  }

  const chartColor = getChartColor()

  return(
    <div className="corporateCard radarCard">
      
      <div className="radarHeader">
        <h3>Radar de Modelo — <span>{filters.linha}</span></h3>
        
        <div className="radarModeToggle">
          <button
            className={`toggleBtn ${mode === "skills" ? "active red" : ""}`}
            onClick={()=>setMode("skills")}
          >
            Habilidades
          </button>
          
          <button
            className={`toggleBtn ${mode === "categories" ? "active blue" : ""}`}
            onClick={()=>setMode("categories")}
          >
            Categorias
          </button>
          
          <button
            className={`toggleBtn ${mode === "models" ? "active orange" : ""}`}
            onClick={()=>setMode("models")}
          >
            Modelos
          </button>
        </div>
      </div>

      <div className="radarChartContainer">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis 
              dataKey="label" 
              tick={{fill: "#555555", fontSize: 12, fontWeight: 600}} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0,5]} 
              tick={{fill: "#888888"}}
            />
            <Radar
              name="Média"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              fill={chartColor}
              fillOpacity={0.4}
              animationDuration={600}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )

}