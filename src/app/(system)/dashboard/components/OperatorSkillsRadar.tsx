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
    <div className="modRadar-card animateFadeIn">

      <div className="modRadar-header">
        <div className="modRadar-iconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div className="modRadar-titleBlock">
            <h3>Radar: <span style={{ color: radarColor }}>{operatorName}</span></h3>
            <p className="modRadar-average">
                Média: <strong style={{ color: radarColor }}>{average}</strong> <span>/ 5.00</span>
            </p>
        </div>
      </div>

      <div className="modRadar-chartContainer">
        {isLoading ? (
          <div className="modRadar-loadingArea">
            {/* 🛠️ MUDANÇA: Injetado o pageLoader animado padrão */}
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modRadar-spinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          </div>
        ) : skills.length === 0 ? (
          <div className="modRadar-emptyArea">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
            <p>Nenhuma habilidade registrada para estes filtros.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>

              <PolarGrid stroke="#e0e0e0" />

              <PolarAngleAxis
                dataKey="posto"
                tick={{ fill: "#555555", fontSize: 11, fontWeight: 700 }}
              />

              <PolarRadiusAxis
                angle={30}
                domain={[0, 5]}
                tick={{ fill: "#888888", fontSize: 10 }}
                tickCount={6}
              />

              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '12px' }}
                itemStyle={{ fontWeight: '800', color: radarColor }}
                formatter={(value) => [`Nível ${value}`, "Habilidade"]}
              />

              {/* Removido 'animationEasing' inválido (cubic-bezier) que causava erro no TS.
                Mantive a animação base nativa e o fill opacity. 
              */}
              <Radar
                name="Skill"
                dataKey="nivel"
                stroke={radarColor}
                strokeWidth={2}
                fill={radarColor}
                fillOpacity={0.25}
                animationDuration={800}
              />

            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}