// src/app/(system)/dashboard/components/OperatorSkillsRadar.tsx
"use client"

import "./OperatorSkillsRadar.css"
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
  posto: string
  skill_level: number
  count?: number // Usado para a média global
}

export default function OperatorSkillsRadar() {

  const { filters } = useDashboardFilters()

  const [skills, setSkills] = useState<Skill[]>([])
  const [operatorName, setOperatorName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Estados para a cor dinâmica e a média
  const [radarColor, setRadarColor] = useState("#d40000")
  const [average, setAverage] = useState("0.00")

  useEffect(() => {
    loadSkills()
  }, [filters])

  async function loadSkills() {
    setIsLoading(true)
    try {
      /* 1. Busca os operadores baseados nos filtros (Geral, Linha, Turno ou Operador Específico) */
      let opQuery = supabase.from("operators").select("id, nome, linha_atual, turno").eq("ativo", true)

      if (filters.linha) opQuery = opQuery.eq("linha_atual", filters.linha)
      if (filters.turno) opQuery = opQuery.eq("turno", filters.turno)
      if (filters.operatorId) opQuery = opQuery.eq("id", filters.operatorId)

      const { data: ops, error: opsError } = await opQuery

      if (opsError || !ops || ops.length === 0) {
        setSkills([])
        setOperatorName("Sem Dados")
        setRadarColor("#e0e0e0")
        setAverage("0.00")
        return
      }

      const opIds = ops.map(o => o.id)

      /* Define o Título (Nome do Operador ou Visão Média) */
      if (filters.operatorId && ops.length === 1) {
        setOperatorName(ops[0].nome)
      } else {
        let title = "Média Geral"
        if (filters.linha) title += ` - ${filters.linha}`
        if (filters.turno) {
  title += ` (${filters.turno})`
}
        setOperatorName(title)
      }

      /* 2. Busca skills */
      const { data, error } = await supabase
        .from("operator_skills")
        .select("posto,skill_level")
        .in("operator_id", opIds)

      if (error || !data || data.length === 0) {
        setSkills([])
        setAverage("0.00")
        setRadarColor("#e0e0e0")
        return
      }

      /* 3. Agrupa e calcula a média */
      const grouped: Record<string, { total: number, count: number }> = {}
      data.forEach(s => {
        if (!grouped[s.posto]) grouped[s.posto] = { total: 0, count: 0 }
        grouped[s.posto].total += s.skill_level
        grouped[s.posto].count += 1
      })

      // Exibe absolutamente TODOS os postos encontrados, ordenados em ordem alfabética.
      let results: Skill[] = Object.keys(grouped).map(posto => ({
        posto,
        skill_level: Number((grouped[posto].total / grouped[posto].count).toFixed(2)),
        count: grouped[posto].count
      })).sort((a, b) => a.posto.localeCompare(b.posto))

      setSkills(results)

      /* --- CÁLCULO DE CORES E MÉDIA --- */
      const totalAvg = results.reduce((acc, row) => acc + row.skill_level, 0)
      const avg = totalAvg / results.length
      setAverage(avg.toFixed(2))

      const ratio = (avg / 5) * 100

      // Cores exatas solicitadas
      let barColor = "#d40000" // Vermelho
      if (ratio <= 20) barColor = "#d40000"
      else if (ratio <= 40) barColor = "#f59e0b" // Laranja
      else if (ratio <= 60) barColor = "#3b82f6" // Azul
      else if (ratio <= 80) barColor = "#8b5cf6" // Roxo
      else barColor = "#22c55e"                  // Verde

      setRadarColor(barColor)

    } catch (err) {
      console.error(err)
      setSkills([])
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = skills.map(skill => ({
    posto: skill.posto,
    nivel: skill.skill_level
  }))

  /* ----------------------------- */
  /* RENDER DO GRÁFICO             */
  /* ----------------------------- */
  return (
    <div className="corporateCard radarCard animateFadeIn">

      <div className="radarHeader">
        <h3>Radar de Habilidades — <span style={{ color: radarColor }}>{operatorName}</span></h3>
        <p className="radarAverage">Média Geral: <strong style={{ color: radarColor }}>{average}</strong> <span className="maxAverage">/ 5.00</span></p>
      </div>

      <div className="radarChartContainer">
        {isLoading ? (
          <div style={{ display: 'flex', height: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* 🛠️ MUDANÇA: Injetado o pageLoader vermelho padrão */}
            <div className="pageLoader" style={{ height: '40px', width: '40px' }} />
          </div>
        ) : skills.length === 0 ? (
          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#888', fontSize: '13px' }}>
            Nenhuma habilidade registrada para estes filtros.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>

              <PolarGrid stroke="#e0e0e0" />

              <PolarAngleAxis
                dataKey="posto"
                tick={{ fill: "#555555", fontSize: 12, fontWeight: 600 }}
              />

              <PolarRadiusAxis
                angle={30}
                domain={[0, 5]}
                tick={{ fill: "#888888" }}
                tickCount={6}
              />

              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontWeight: 'bold', color: radarColor }}
                formatter={(value) => [`Nível ${value}`, "Habilidade"]}
              />

              <Radar
                name="Skill"
                dataKey="nivel"
                stroke={radarColor}
                strokeWidth={2}
                fill={radarColor}
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