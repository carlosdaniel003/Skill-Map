// src/app/(system)/attendance/components/ShiftManagementTab.tsx
import { useState } from "react"
import "./ShiftManagementTab.css"
import EmergencyAllocation from "./EmergencyAllocation" 

interface ShiftManagementProps {
  filters: {
    selectedLine: string
    setSelectedLine: (l: string) => void
    selectedTurno: string 
    setSelectedTurno: (t: string) => void 
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
  
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [emergencyTargetPosto, setEmergencyTargetPosto] = useState<string>("")

  const handleOpenGlobalEmergency = () => {
    setEmergencyTargetPosto("")
    setIsEmergencyModalOpen(true)
  }

  const handleReplaceOperator = (posto: string, turnoDoOperador: string) => {
  setEmergencyTargetPosto(posto)
  // Definimos o turno alvo como o turno do operador que está saindo
  filters.setSelectedTurno(turnoDoOperador) 
  setIsEmergencyModalOpen(true)
}

  const safeTotalAlocados = shift.metrics.totalAlocados || 0;
  const safeTotalNecessario = shift.metrics.totalNecessario || 0;
  const safeGap = shift.metrics.gapTotal || 0;
  const safeProntidao = isNaN(shift.metrics.prontidao) ? 0 : shift.metrics.prontidao;
  const safeRisco = shift.metrics.operadoresEmRisco || 0;

  // Função auxiliar para formatar o nome do turno na lista
  const formatTurno = (turno: string) => {
    if (turno === "1º Turno") return "Comercial";
    if (turno === "2º Turno") return "Estendido";
    return turno || "S/T";
  };

  return (
    <div className="shiftManagementTab animateFadeIn">
      
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
              <option value="">Todos os turnos</option>
              <option value="1º Turno">Comercial</option>
              <option value="2º Turno">2º Turno estendido</option>
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
              <div className="readinessValue">{safeTotalAlocados} <span>/ {safeTotalNecessario}</span></div>
              <p className="readinessSub">GAP: {safeGap} postos vazios</p>
            </div>
            
            <div className="readinessCard success">
              <h4>Prontidão Real</h4>
              <div className="readinessValue">{safeProntidao}%</div>
              <p className="readinessSub">Considerando risco de falta</p>
            </div>

            <div className={`readinessCard ${safeRisco > 0 ? 'danger' : 'success'}`}>
              <h4>Alerta Crítico</h4>
              <div className="readinessValue">{safeRisco}</div>
              <p className="readinessSub">Operadores em risco alto (Vermelho)</p>
            </div>
          </div>

          <div className="corporateCard radarCard">
            <div className="radarHeader">
              <h3>Radar de Risco Diário</h3>
              
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
                        {/* 🆕 EXIBIÇÃO DO TURNO E POSTO NO CARD */}
                        <span>{formatTurno(op.turno)} • Posto: {op.posto_atual || "Sem Posto Fixo"}</span>
                      </div>
                    </div>
                    
                    <button 
  className="secondaryButton replaceBtn"
  // Passamos o posto E o turno do operador da linha atual
  onClick={() => handleReplaceOperator(op.posto_atual, op.turno)} 
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

      <EmergencyAllocation
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        linhaAtual={filters.selectedLine}
        initialPosto={emergencyTargetPosto}
        turnoAtual={filters.selectedTurno} 
      />

    </div>
  )
}