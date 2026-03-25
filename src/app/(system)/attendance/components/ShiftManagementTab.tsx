// src/app/(system)/attendance/components/ShiftManagementTab.tsx
import { useState } from "react"
import "./ShiftManagementTab.css"
import EmergencyAllocation from "./EmergencyAllocation" // 🆕 Modal de IA

interface ShiftManagementProps {
  filters: {
    selectedLine: string
    setSelectedLine: (l: string) => void
    selectedTurno: string // 🆕 Filtro de Turno
    setSelectedTurno: (t: string) => void // 🆕 Set do Filtro de Turno
    lines: string[]
  }
  shift: {
    loading: boolean
    metrics: {
      totalAlocados: number
      totalNecessario: number
      gapTotal: number
      prontidao: number
      operadoresEmRisco: number
      radarList: any[]
    }
  }
}

export default function ShiftManagementTab({ filters, shift }: ShiftManagementProps) {
  
  // 🆕 ESTADOS PARA CONTROLAR O MODAL DE EMERGÊNCIA
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [emergencyTargetPosto, setEmergencyTargetPosto] = useState<string>("")

  // Função para abrir o modal de forma limpa (Global)
  const handleOpenGlobalEmergency = () => {
    setEmergencyTargetPosto("")
    setIsEmergencyModalOpen(true)
  }

  // Função para abrir o modal focado na substituição de alguém específico
  const handleReplaceOperator = (posto: string) => {
    setEmergencyTargetPosto(posto)
    setIsEmergencyModalOpen(true)
  }

  return (
    <div className="shiftManagementTab animateFadeIn">
      
      {/* 🆕 FILTRO MELHORADO COM LINHA E TURNO */}
      <div className="corporateCard shiftFilterCard">
        <div className="shiftFilterRow" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          
          <div className="shiftFilterGroup" style={{ flex: 2, minWidth: '250px' }}>
            <label>Selecione a Linha:</label>
            <select 
              className="shiftSelectInput" 
              value={filters.selectedLine} 
              onChange={(e) => filters.setSelectedLine(e.target.value)}
            >
              <option value="">Selecione o Modelo de Produção...</option>
              {filters.lines.map(linha => (
                <option key={linha} value={linha}>{linha}</option>
              ))}
            </select>
          </div>

          <div className="shiftFilterGroup" style={{ flex: 1, minWidth: '150px' }}>
            <label>Filtrar Turno (Opcional):</label>
            <select 
              className="shiftSelectInput" 
              value={filters.selectedTurno} 
              onChange={(e) => filters.setSelectedTurno(e.target.value)}
            >
              <option value="">Todos (Turno Misto)</option>
              <option value="1º Turno">1º Turno</option>
              <option value="2º Turno">2º Turno</option>
              <option value="Comercial">Comercial</option>
            </select>
          </div>

        </div>
      </div>

      {!filters.selectedLine ? (
        <div className="emptyAttendance">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <p>Selecione um Modelo de Produção acima para carregar o Radar de Risco do turno.</p>
        </div>
      ) : shift.loading ? (
         <div className="emptyAttendance">
           <div className="pageLoader" style={{ height: '40px', width: '40px' }} />
           <p>Cruzando dados de assiduidade e cobertura...</p>
         </div>
      ) : (
        <>
          <div className="readinessCockpit">
            <div className="readinessCard neutral">
              <h4>Postos Alocados</h4>
              <div className="readinessValue">{shift.metrics.totalAlocados} <span>/ {shift.metrics.totalNecessario}</span></div>
              <p className="readinessSub">GAP: {shift.metrics.gapTotal} postos vazios</p>
            </div>
            
            <div className="readinessCard success">
              <h4>Prontidão Real</h4>
              <div className="readinessValue">{shift.metrics.prontidao}%</div>
              <p className="readinessSub">Considerando risco de falta</p>
            </div>

            <div className={`readinessCard ${shift.metrics.operadoresEmRisco > 0 ? 'danger' : 'success'}`}>
              <h4>Alerta Crítico</h4>
              <div className="readinessValue">{shift.metrics.operadoresEmRisco}</div>
              <p className="readinessSub">Operadores em risco alto (Vermelho)</p>
            </div>
          </div>

          <div className="corporateCard radarCard">
            <div className="radarHeader">
              <h3>Radar de Risco Diário</h3>
              
              {/* BOTÃO GLOBAL QUE ABRE O MODAL VAZIO */}
              <button 
                className="primaryButton smartAllocBtn"
                onClick={handleOpenGlobalEmergency}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Motor de Emergência
              </button>
            </div>
            
            <div className="radarList">
              {shift.metrics.radarList.length === 0 ? (
                <div className="emptyAttendance" style={{ padding: '30px' }}>
                  <p>✅ Excelente! Nenhum operador desta linha está com Risco Médio ou Alto de assiduidade.</p>
                </div>
              ) : (
                shift.metrics.radarList.map((op, index) => (
                  <div key={index} className={`radarItem ${op.risco_assiduidade === 'Vermelho' ? 'risk-high' : 'risk-medium'}`}>
                    <div className="radarInfo">
                      <div className={`radarBadge ${op.risco_assiduidade === 'Vermelho' ? 'danger' : 'warning'}`}>
                        Score: {op.score_assiduidade}
                      </div>
                      <div className="radarDetails">
                        <strong>{op.nome} <span>(Mat: {op.matricula})</span></strong>
                        <span>Posto: {op.posto_atual || "Sem Posto Fixo"}</span>
                      </div>
                    </div>
                    
                    {/* BOTÃO ESPECÍFICO QUE ABRE O MODAL PREENCHIDO */}
                    <button 
                      className="secondaryButton replaceBtn"
                      onClick={() => handleReplaceOperator(op.posto_atual)}
                    >
                      Buscar Substituto
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 🆕 RENDERIZA O MODAL DO MOTOR DE EMERGÊNCIA */}
      <EmergencyAllocation 
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        linhaAtual={filters.selectedLine}
        initialPosto={emergencyTargetPosto}
      />

    </div>
  )
}