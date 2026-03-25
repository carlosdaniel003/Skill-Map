// src/app/(system)/attendance/components/EmergencyAllocation.tsx
import { useState, useEffect } from "react"
import { supabase } from "@/services/database/supabaseClient"
import { getLineSkillDifficulties } from "@/services/database/operatorRepository" // 🆕 Importado para buscar o Kit da Linha
import "./EmergencyAllocation.css"

interface EmergencyAllocationProps {
  isOpen: boolean
  onClose: () => void
  linhaAtual: string
  initialPosto?: string // Se vier de um operador específico, já vem preenchido
}

export default function EmergencyAllocation({ isOpen, onClose, linhaAtual, initialPosto }: EmergencyAllocationProps) {
  const [postoTarget, setPostoTarget] = useState(initialPosto || "")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  
  const [postosDisponiveis, setPostosDisponiveis] = useState<string[]>([]) // 🆕 Estado para guardar os postos da linha

  // 1. Efeito para carregar os postos que compõem o modelo de produção atual
  useEffect(() => {
    async function loadPostosDaLinha() {
      if (isOpen && linhaAtual) {
        const diffs = await getLineSkillDifficulties(linhaAtual)
        setPostosDisponiveis(Object.keys(diffs).sort()) // Pega só o nome dos postos e ordena alfabeticamente
      }
    }
    loadPostosDaLinha()
  }, [isOpen, linhaAtual])

  // 2. Efeito para gerenciar a abertura do modal (com ou sem posto pré-selecionado)
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
      // Bate no Gêmeo Digital (View 360) para cruzar tudo
      const { data, error } = await supabase
        .from('vw_operator_360_context')
        .select('*')
        .eq('skill_posto', postoToSearch)
        .gte('skill_level', 3) // Traz apenas quem é nível 3 ou 4 (Garante a qualidade)
        .order('score_assiduidade', { ascending: false }) // Prioriza quem não falta
        .order('dias_desde_ultima_execucao', { ascending: true }) // Prioriza quem operou recentemente (Menos ferrugem)
        .limit(10)

      if (error) throw error

      // Filtra para remover pessoas que JÁ ESTÃO na linha atual (você não quer cobrir um buraco abrindo outro na mesma linha)
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
          <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>
            Busque substitutos ideais baseados em <strong>Nível de Habilidade {"(>= 3)"}</strong>, <strong>Assiduidade (Verde)</strong> e <strong>Recência (Baixa Ferrugem)</strong>.
          </p>

          <div className="searchPostoContainer">
            {/* 🆕 TROCAMOS O INPUT DE TEXTO POR UM SELECT INTELIGENTE */}
            <select 
              className="searchPostoInput"
              value={postoTarget}
              onChange={(e) => {
                setPostoTarget(e.target.value)
                // Opcional: Se quiser que ele pesquise automaticamente ao trocar o select, descomente a linha abaixo
                // if(e.target.value) handleSearch(e.target.value)
              }}
              style={{ cursor: 'pointer', appearance: 'auto' }} // Garante a setinha nativa do select
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
                <br/>Nenhum substituto ideal (Nível 3+) disponível no momento para este posto.
              </div>
            ) : (
              suggestions.map((op) => (
                <div key={op.operator_id} className="suggestionCard">
                  <div className="suggestionInfo">
                    <div className="suggestionName">
                      {op.nome}
                      <span className="suggestionCurrentLine">{op.linha_atual || "Sem Linha"}</span>
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