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

interface Skill {
  label: string
  value: number
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

export default function LineSkillsRadar() {

  const { filters } = useDashboardFilters()

  const [mode, setMode] = useState<"skills" | "categories" | "models">("skills")
  const [data, setData] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [filters.linha, mode])

  async function loadData() {

    if (!filters.linha) {
      setData([])
      return
    }

    setIsLoading(true)

    try {
      /* 1. Primeiro pegamos TODOS os operadores que estão AGORA nesta linha */
      const { data: operatorsInLine, error: opError } = await supabase
        .from("operators")
        .select("id")
        .eq("linha_atual", filters.linha)
        .eq("ativo", true)

      if (opError || !operatorsInLine || operatorsInLine.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      // Extrai apenas os IDs da equipe atual
      const teamIds = operatorsInLine.map(op => op.id)


      /* ------------------------------------------------ */
      /* MODO HABILIDADES (Skills Atuais da Equipe)       */
      /* ------------------------------------------------ */
      if (mode === "skills") {
        // Pega as skills desses operadores na linha atual
        const { data: skills, error } = await supabase
          .from("operator_skills")
          .select("posto, skill_level")
          .in("operator_id", teamIds)

        if (error || !skills) throw error

        const map: Record<string, { total: number, count: number }> = {}

        skills.forEach((row: any) => {
          if (!map[row.posto]) {
            map[row.posto] = { total: 0, count: 0 }
          }
          map[row.posto].total += row.skill_level
          map[row.posto].count++
        })

        const result: Skill[] = Object.keys(map).map(posto => ({
          label: posto,
          value: Number((map[posto].total / map[posto].count).toFixed(2))
        }))

        setData(result)
      }


      /* ------------------------------------------------ */
      /* MODO CATEGORIAS (Bagagem da Equipe)              */
      /* ------------------------------------------------ */
      if (mode === "categories") {
        // 1. Pega as linhas e suas categorias para o De-Para
        const { data: linesData } = await supabase.from("production_lines").select("nome, categoria")
        const lineCategoryMap: Record<string, string> = {}
        if (linesData) {
          linesData.forEach(l => {
            if (l.nome && l.categoria) lineCategoryMap[l.nome] = l.categoria
          })
        }

        // 2. Busca TODA a experiência histórica DESSA EQUIPE
        const { data: teamExperience, error } = await supabase
          .from("operator_experience")
          .select("linha, skill_level")
          .in("operator_id", teamIds)
          .eq("ativo", true)

        if (error || !teamExperience) throw error

        const map: Record<string, { total: number, count: number }> = {}
        CATEGORIES.forEach(cat => {
          map[cat] = { total: 0, count: 0 }
        })

        // 3. Agrupa as experiências por categoria
        teamExperience.forEach((row: any) => {
          const linhaHistorica = row.linha
          if (!linhaHistorica) return

          const cat = lineCategoryMap[linhaHistorica]
          // Se a linha tem categoria mapeada e ela está na nossa lista de CATEGORIES
          if (cat && map[cat] !== undefined) {
            map[cat].total += row.skill_level
            map[cat].count++
          }
        })

        const result: Skill[] = CATEGORIES.map(cat => ({
          label: cat,
          value: map[cat].count > 0 ? Number((map[cat].total / map[cat].count).toFixed(2)) : 0
        }))

        setData(result)
      }


      /* ------------------------------------------------ */
      /* MODO MODELOS (Bagagem Específica da Equipe)      */
      /* ------------------------------------------------ */
      if (mode === "models") {
        // 1. Pegar todas as experiências históricas DESSA EQUIPE
        const { data: teamExperience, error } = await supabase
          .from("operator_experience")
          .select("linha, skill_level")
          .in("operator_id", teamIds)
          .eq("ativo", true)

        if (error || !teamExperience) throw error

        const map: Record<string, { total: number, count: number }> = {}

        // Agrupa as experiências pelo modelo (linha) que eles trabalharam
        teamExperience.forEach((row: any) => {
          const modeloHistorico = row.linha
          if (!modeloHistorico) return
          
          if (!map[modeloHistorico]) map[modeloHistorico] = { total: 0, count: 0 }
          
          map[modeloHistorico].total += row.skill_level
          map[modeloHistorico].count++
        })

        // Retorna apenas os modelos que essa equipe já trabalhou e ordena pelo maior nível
        const result: Skill[] = Object.keys(map).map(model => ({
          label: model,
          value: Number((map[model].total / map[model].count).toFixed(2))
        })).sort((a, b) => b.value - a.value)

        setData(result)
      }

    } catch (err) {
      console.error("Erro ao carregar dados do Radar:", err)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  /* ----------------------------- */
  /* ESTADO SEM LINHA (EMPTY STATE)*/
  /* ----------------------------- */
  if (!filters.linha) {
    return (
      <div className="corporateCard radarCard emptyRadarCard">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          <line x1="12" y1="22" x2="12" y2="15.5" />
          <polyline points="22 8.5 12 15.5 2 8.5" />
          <polyline points="2 15.5 12 8.5 22 15.5" />
          <line x1="12" y1="2" x2="12" y2="8.5" />
        </svg>
        <p>Selecione uma linha de produção no filtro acima para visualizar o radar de skills e o histórico da equipe.</p>
      </div>
    )
  }

  /* ----------------------------- */
  /* CORES DO GRÁFICO              */
  /* ----------------------------- */
  const getChartColor = () => {
    if (mode === "skills") return "#d40000" // Vermelho
    if (mode === "categories") return "#3b82f6" // Azul
    return "#f59e0b" // Laranja
  }

  const chartColor = getChartColor()

  /* ----------------------------- */
  /* RENDER                        */
  /* ----------------------------- */
  return (
    <div className="corporateCard radarCard">

      <div className="radarHeader">
        <h3>
          Radar da Equipe — <span>{filters.linha}</span>
        </h3>

        <div className="radarModeToggle">
          <button
            className={`toggleBtn ${mode === "skills" ? "active red" : ""}`}
            onClick={() => setMode("skills")}
            title="Mostra a proficiência da equipe nos postos de trabalho atuais"
          >
            Postos Atuais
          </button>

          <button
            className={`toggleBtn ${mode === "categories" ? "active blue" : ""}`}
            onClick={() => setMode("categories")}
            title="Mostra a experiência prévia da equipe por família de produtos (BBS, MW, etc)"
          >
            Exp. por Categoria
          </button>

          <button
            className={`toggleBtn ${mode === "models" ? "active orange" : ""}`}
            onClick={() => setMode("models")}
            title="Mostra em quais outros modelos específicos essa equipe já trabalhou"
          >
            Exp. por Modelo
          </button>
        </div>
      </div>

      <div className="radarChartContainer">
        {isLoading ? (
          <div className="radarLoading">
            <div className="corporateSpinner small"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="emptyRadarData">
             Nenhuma experiência registrada para esta equipe neste modo.
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
                itemStyle={{ fontWeight: 'bold', color: chartColor }}
                formatter={(value) => [value, "Média da Equipe (Lvl)"]}
              />

              <Radar
                name="Média da Equipe"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={chartColor}
                fillOpacity={0.4}
                animationDuration={600}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}