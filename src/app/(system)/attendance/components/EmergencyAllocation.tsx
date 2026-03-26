// src/app/(system)/attendance/components/EmergencyAllocation.tsx
import { useState, useEffect } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { getLineSkillDifficulties } from "@/services/database/operatorRepository"
import "./EmergencyAllocation.css"

interface EmergencyAllocationProps {
  isOpen: boolean
  onClose: () => void
  linhaAtual: string
  turnoAtual: string // 🆕 Recebido do componente pai
  initialPosto?: string
}

export default function EmergencyAllocation({ isOpen, onClose, linhaAtual, turnoAtual, initialPosto }: EmergencyAllocationProps) {
  const [postoTarget, setPostoTarget] = useState(initialPosto || "")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [postosDisponiveis, setPostosDisponiveis] = useState<string[]>([])

  useEffect(() => {
    async function loadPostosDaLinha() {
      if (isOpen && linhaAtual) {
        const diffs = await getLineSkillDifficulties(linhaAtual)
        setPostosDisponiveis(Object.keys(diffs).sort())
      }
    }
    loadPostosDaLinha()
  }, [isOpen, linhaAtual])

  useEffect(() => {
    if (isOpen && initialPosto) {
      setPostoTarget(initialPosto)
      handleSearch(initialPosto)
    } else if (isOpen) {
      setPostoTarget("")
      setSuggestions([])
      setHasSearched(false)
    }
  }, [isOpen, initialPosto])

  async function handleSearch(postoToSearch: string) {
    if (!postoToSearch.trim()) return
    setLoading(true)
    setHasSearched(true)

    try {
      let query = supabase
        .from('vw_operator_360_context')
        .select('*')
        .eq('skill_posto', postoToSearch)
        .gte('skill_level', 3)
        .order('score_assiduidade', { ascending: false })
        .order('dias_desde_ultima_execucao', { ascending: true })
        .limit(10)

      // 🚨 PRIORIDADE MÁXIMA: Só recomenda quem está no mesmo turno
      if (turnoAtual) {
        query = query.eq('turno', turnoAtual)
      }

      const { data, error } = await query
      if (error) throw error

      const filteredData = (data || []).filter(op => op.linha_atual !== linhaAtual)
      setSuggestions(filteredData)
    } catch (err) {
      console.error("Erro ao buscar substitutos:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="emergencyModalOverlay">
      <div className="emergencyModalCard">
        <div className="emergencyHeader">
          <div className="emergencyTitle">
            <div className="emergencyIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3>Motor de Alocação de Emergência</h3>
          </div>
          <button className="closeEmergencyBtn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="emergencyBody">
          {/* 🆕 MENSAGEM INCLUINDO TURNO COM CORREÇÃO DE JSX */}
          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
            Busque substitutos ideais baseados em <strong>Turno {turnoAtual ? `(${turnoAtual})` : ""}</strong>, <strong>Nível de Habilidade {">= 3"}</strong>, <strong>Assiduidade (Verde)</strong> e <strong>Recência (Baixa Ferrugem)</strong>.
          </p>

          <div className="searchPostoContainer">
            <select 
              className="searchPostoInput"
              value={postoTarget}
              onChange={(e) => setPostoTarget(e.target.value)}
              style={{ cursor: 'pointer', appearance: 'auto' }}
            >
              <option value="" disabled>Selecione o posto que precisa de cobertura...</option>
              {postosDisponiveis.map(posto => (
                <option key={posto} value={posto}>{posto}</option>
              ))}
            </select>
            
            <button 
              className="primaryButton" 
              onClick={() => handleSearch(postoTarget)}
              disabled={loading || !postoTarget}
            >
              {loading ? "Buscando..." : "Buscar Substitutos"}
            </button>
          </div>

          <div className="emergencyResults">
            {loading ? (
              <div className="emptyState">Varrendo a fábrica em busca do melhor match...</div>
            ) : hasSearched && suggestions.length === 0 ? (
              <div className="emptyState">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" style={{marginBottom: '12px'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <br/>Nenhum substituto ideal disponível no momento para o turno informado.
              </div>
            ) : (
              suggestions.map((op) => (
                <div key={op.operator_id} className="suggestionCard">
                  <div className="suggestionInfo">
                    <div className="suggestionName">
                      {op.nome}
                      <span className="suggestionCurrentLine">
                        {op.turno || "S/T"} • {op.linha_atual || "Disponível"}
                      </span>
                    </div>
                    <div className="suggestionMetrics">
                      <span className="metricBadge">Nível {op.skill_level}</span>
                      <span className="metricBadge">|</span>
                      <span className={`metricBadge ${op.dias_desde_ultima_execucao > 30 ? 'red' : 'green'}`}>
                        Ferrugem: {op.dias_desde_ultima_execucao === 999 ? 'Sem registro' : `${op.dias_desde_ultima_execucao} dias`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="suggestionAction">
                    <div className={`scoreCircle ${op.risco_assiduidade === 'Verde' ? 'green' : op.risco_assiduidade === 'Amarelo' ? 'yellow' : 'red'}`} title="Score de Assiduidade">
                      {Math.round(op.score_assiduidade)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}