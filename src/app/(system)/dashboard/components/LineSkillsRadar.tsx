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
  Tooltip,
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
    /* MODO HABILIDADES (Apenas a linha filtrada)       */
    /* ------------------------------------------------ */
    if(mode === "skills"){
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

      if(error || !skills){
        setData([])
        return
      }

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
    /* MODO CATEGORIAS (Fábrica Inteira)                */
    /* ------------------------------------------------ */
    if(mode === "categories"){
      // 1. Pegar a categoria de cada linha para fazer o "de-para"
      const { data: linesData } = await supabase.from("production_lines").select("nome, categoria")
      const lineCategoryMap: Record<string, string> = {}
      
      if(linesData){
        linesData.forEach(l => {
          if(l.nome && l.categoria) lineCategoryMap[l.nome] = l.categoria
        })
      }

      // 2. Pegar os dados de TODOS os operadores
      const { data: allSkills, error } = await supabase
        .from("operator_skills")
        .select(`skill_level, operators!inner(linha_atual)`)

      if(error || !allSkills){
        setData([])
        return
      }

      const map:Record<string,{total:number,count:number}> = {}
      CATEGORIES.forEach(cat=>{
        map[cat] = { total:0,count:0 }
      })

      // 3. Agrupar por categoria usando o de-para
      allSkills.forEach((row:any)=>{
        const linha = row.operators?.linha_atual
        if(!linha) return

        const cat = lineCategoryMap[linha]
        if(cat && map[cat] !== undefined){
          map[cat].total += row.skill_level
          map[cat].count++
        }
      })

      const result:Skill[] = CATEGORIES.map(cat=>({
        label:cat,
        value: map[cat].count > 0 ? Number((map[cat].total / map[cat].count).toFixed(2)) : 0
      }))

      setData(result)
    }

    /* ------------------------------------------------ */
    /* MODO MODELOS (Fábrica Inteira)                   */
    /* ------------------------------------------------ */
    if(mode === "models"){
      // 1. Pegar o nome de todos os modelos
      const { data:models,error:modelError } = await supabase
        .from("production_lines")
        .select("nome")

      if(modelError || !models){
        setData([])
        return
      }

      // 2. Pegar as skills de TODOS os operadores
      const { data: allSkills, error } = await supabase
        .from("operator_skills")
        .select(`skill_level, operators!inner(linha_atual)`)

      if(error || !allSkills){
        setData([])
        return
      }

      const map:Record<string,{total:number,count:number}> = {}

      models.forEach((m:any)=>{
        map[m.nome] = { total:0,count:0 }
      })

      // 3. Agrupar por modelo/linha
      allSkills.forEach((row:any)=>{
        const linha = row.operators?.linha_atual
        if(!linha) return
        
        if(!map[linha]) map[linha] = { total:0,count:0 }
        map[linha].total += row.skill_level
        map[linha].count++
      })

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
        <p>Selecione uma linha de produção no filtro acima para visualizar o radar de skills coletivo.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* CORES DO GRÁFICO              */
  /* ----------------------------- */
  const getChartColor = () => {
    if(mode === "skills") return "#d40000" // Vermelho corporativo
    if(mode === "categories") return "#3b82f6" // Azul
    return "#f59e0b" // Laranja
  }

  const chartColor = getChartColor()

  /* ----------------------------- */
  /* RENDER                        */
  /* ----------------------------- */
  return(
    <div className="corporateCard radarCard">

      <div className="radarHeader">
        <h3>Radar da Linha — <span>{filters.linha}</span></h3>

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
              tick={{
                fill:"#555555",
                fontSize:12,
                fontWeight:600
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0,5]}
              tick={{fill:"#888888"}}
            />
            
            {/* Tooltip super elegante ao passar o mouse */}
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontWeight: 'bold', color: chartColor }}
              formatter={(value) => [value, "Média"]}
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

      {/* ----------------------------- */}
      <div className="skillsAverageTable">
        <h4>Média de Habilidades</h4>

        <div className="skillsList">
          {data.map(skill=>{
            
            // Cores de status de performance para os números
            let color = "#2e7d32" // Verde (bom)
            if(skill.value < 2) color = "#d40000" // Vermelho (crítico)
            else if(skill.value < 3) color = "#f59e0b" // Amarelo (atenção)

            return(
              <div key={skill.label} className="skillRow">
                <span className="skillName">{skill.label}</span>
                <span className="skillValue" style={{color}}>
                  {skill.value}
                </span>
              </div>
            )
          })}
        </div>

      </div>

    </div>
  )

}