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
  ResponsiveContainer,
  Legend
} from "recharts"

import { supabase } from "@/services/database/supabaseClient"
import { useDashboardFilters } from "../context/DashboardFilterContext"

interface SkillData {
  label: string
  [key: string]: string | number 
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

// Função utilitária para normalizar o nome do turno
function normalizeTurno(turno: string | null | undefined): string {
  return turno || "Sem Turno"
}

export default function LineSkillsRadar() {

  const { filters } = useDashboardFilters()

  const [mode, setMode] = useState<"skills" | "categories" | "models">("categories")
  const [data, setData] = useState<SkillData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTurns, setActiveTurns] = useState<string[]>([]) 

  useEffect(() => {
    if (!filters.linha && mode === "skills") {
      setMode("categories")
    }
  }, [filters.linha])

  useEffect(() => {
    loadData()
  }, [filters, mode])

  async function loadData() {
    setIsLoading(true)
    setData([])
    setActiveTurns([])

    try {
      let opQuery = supabase.from("operators").select("id, linha_atual, turno").eq("ativo", true)

      if (filters.linha) opQuery = opQuery.eq("linha_atual", filters.linha)
      if (filters.turno) opQuery = opQuery.eq("turno", filters.turno)

      const { data: operators, error: opError } = await opQuery

      if (opError || !operators || operators.length === 0) {
        setIsLoading(false)
        return
      }

      const teamIds = operators.map(op => op.id)
      const opMap = new Map(operators.map(op => [op.id, op]))

      // ✅ CORREÇÃO: Normaliza ANTES de deduplicar com Set
      // Isso evita keys duplicadas quando existem operadores com
      // turno="1º Turno" e turno="Comercial" ao mesmo tempo no banco.
      const turnosProcessados = Array.from(
        new Set(
          operators.map(o => normalizeTurno(o.turno))
        )
      )
      setActiveTurns(turnosProcessados)

      if (mode === "skills" && filters.linha) {
        const { data: skills, error } = await supabase
          .from("operator_skills")
          .select("operator_id, posto, skill_level")
          .in("operator_id", teamIds)

        if (error || !skills) throw error

        const map: Record<string, Record<string, { total: number, count: number }>> = {}

        skills.forEach((row: any) => {
          const op = opMap.get(row.operator_id)
          if (!op) return

          const tName = normalizeTurno(op.turno)

          if (!map[row.posto]) map[row.posto] = {}
          if (!map[row.posto][tName]) map[row.posto][tName] = { total: 0, count: 0 }

          map[row.posto][tName].total += row.skill_level
          map[row.posto][tName].count++
        })

        const result: SkillData[] = Object.keys(map).map(posto => {
          const entry: SkillData = { label: posto }
          turnosProcessados.forEach(t => {
            if (map[posto][t]) {
              entry[t] = Number((map[posto][t].total / map[posto][t].count).toFixed(2))
            } else {
              entry[t] = 0
            }
          })
          return entry
        })

        setData(result)
      }

      if (mode === "categories") {
        const { data: linesData } = await supabase.from("production_lines").select("nome, categoria")
        const lineCategoryMap: Record<string, string> = {}
        if (linesData) {
          linesData.forEach(l => {
            if (l.nome && l.categoria) lineCategoryMap[l.nome] = l.categoria
          })
        }

        const { data: teamExperience, error } = await supabase
          .from("operator_experience")
          .select("operator_id, linha, skill_level")
          .in("operator_id", teamIds)
          .eq("ativo", true)

        if (error || !teamExperience) throw error

        const map: Record<string, Record<string, { total: number, count: number }>> = {}
        CATEGORIES.forEach(cat => { map[cat] = {} })

        teamExperience.forEach((row: any) => {
          const op = opMap.get(row.operator_id)
          if (!op || !row.linha) return

          const cat = lineCategoryMap[row.linha]
          if (cat && map[cat] !== undefined) {
            const tName = normalizeTurno(op.turno)

            if (!map[cat][tName]) map[cat][tName] = { total: 0, count: 0 }

            map[cat][tName].total += row.skill_level
            map[cat][tName].count++
          }
        })

        const result: SkillData[] = CATEGORIES.map(cat => {
          const entry: SkillData = { label: cat }
          turnosProcessados.forEach(t => {
            if (map[cat][t] && map[cat][t].count > 0) {
              entry[t] = Number((map[cat][t].total / map[cat][t].count).toFixed(2))
            } else {
              entry[t] = 0
            }
          })
          return entry
        })

        setData(result)
      }


      if (mode === "models") {
        const { data: teamExperience, error } = await supabase
          .from("operator_experience")
          .select("operator_id, linha, skill_level")
          .in("operator_id", teamIds)
          .eq("ativo", true)

        if (error || !teamExperience) throw error

        const map: Record<string, Record<string, { total: number, count: number }>> = {}

        teamExperience.forEach((row: any) => {
          const op = opMap.get(row.operator_id)
          if (!op || !row.linha) return

          const tName = normalizeTurno(op.turno)

          if (!map[row.linha]) map[row.linha] = {}
          if (!map[row.linha][tName]) map[row.linha][tName] = { total: 0, count: 0 }
          
          map[row.linha][tName].total += row.skill_level
          map[row.linha][tName].count++
        })

        let allModels = Object.keys(map)
        if (!filters.linha && allModels.length > 12) {
           allModels = allModels.slice(0, 12)
        }

        const result: SkillData[] = allModels.map(model => {
          const entry: SkillData = { label: model }
          turnosProcessados.forEach(t => {
            if (map[model][t] && map[model][t].count > 0) {
              entry[t] = Number((map[model][t].total / map[model][t].count).toFixed(2))
            } else {
              entry[t] = 0
            }
          })
          return entry
        })

        setData(result)
      }

    } catch (err) {
      console.error("Erro ao carregar dados do Radar:", err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  const getColorForTurn = (turnName: string) => {
    if (turnName === "Comercial") return "#3b82f6" 
    if (turnName === "2º Turno estendido") return "#8b5cf6" 
    return "#f59e0b" 
  }


  return (
    <div className="corporateCard radarCard">

      <div className="radarHeader">
        <h3>
          Radar da Equipe — <span>{filters.linha ? filters.linha : "Visão Global"}</span>
        </h3>

        <div className="radarModeToggle">
          <button
            className={`toggleBtn ${mode === "skills" ? "active red" : ""}`}
            onClick={() => setMode("skills")}
            title="Postos de trabalho"
            disabled={!filters.linha} 
            style={{ opacity: !filters.linha ? 0.3 : 1 }}
          >
            Postos Atuais
          </button>

          <button
            className={`toggleBtn ${mode === "categories" ? "active blue" : ""}`}
            onClick={() => setMode("categories")}
          >
            Categorias
          </button>

          <button
            className={`toggleBtn ${mode === "models" ? "active orange" : ""}`}
            onClick={() => setMode("models")}
          >
            Modelos
          </button>
        </div>
      </div>

      <div className="radarChartContainer">
        {isLoading ? (
          <div className="radarLoading" style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <div className="pageLoader" style={{ height: '40px', width: '40px' }} />
          </div>
        ) : data.length === 0 ? (
          <div className="emptyRadarData">
             Nenhuma experiência registrada.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis
                dataKey="label"
                tick={{
                  fill: "#555555",
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 5]}
                tick={{ fill: "#888888" }}
              />

              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value) => [value, "Lvl Médio"]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              {activeTurns.map((turno) => (
                <Radar
                  key={turno}
                  name={turno}
                  dataKey={turno}
                  stroke={getColorForTurn(turno)}
                  strokeWidth={2}
                  fill={getColorForTurn(turno)}
                  fillOpacity={0.3}
                  animationDuration={600}
                />
              ))}

            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}