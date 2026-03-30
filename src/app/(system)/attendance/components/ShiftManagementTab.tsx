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
  const formatTurno = (turno: string) => turno || "S/T"

  return (
    <div className="shiftManagementTab modShiftFadeIn">
      
      <div className="shiftModCard shiftFilterCard">
        <div className="shiftFilterRow" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          <div className="shiftFilterGroup" style={{ flex: 2, minWidth: '250px' }}>
            <label>Selecione a Linha:</label>
            <div className="shiftInputWrapper">
              <svg className="shiftInputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <select 
                className="shiftModSelect" 
                value={filters.selectedLine} 
                onChange={(e) => filters.setSelectedLine(e.target.value)}
              >
                <option value="">Selecione o Modelo de Produção...</option>
                {filters.lines.map(linha => (
                  <option key={linha} value={linha}>{linha}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="shiftFilterGroup" style={{ flex: 1, minWidth: '150px' }}>
            <label>Filtrar Turno (Opcional):</label>
            <div className="shiftInputWrapper">
              <svg className="shiftInputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <select 
                className="shiftModSelect" 
                value={filters.selectedTurno} 
                onChange={(e) => filters.setSelectedTurno(e.target.value)}
              >
                <option value="">Todos os turnos</option>
                <option value="Comercial">Comercial</option>
                <option value="2º Turno estendido">2º Turno estendido</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {!filters.selectedLine ? (
        <div className="shiftModEmptyState">
          <div className="shiftEmptyContent">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shiftEmptyIcon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <p>Selecione um Modelo de Produção acima para carregar o Radar de Risco do turno.</p>
          </div>
        </div>
      ) : shift.loading ? (
         <div className="shiftModEmptyState">
           <div className="shiftEmptyContent">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shiftSpinIcon">
               <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
             </svg>
             <p>Cruzando dados de assiduidade e cobertura...</p>
           </div>
         </div>
      ) : (
        <>
          <div className="shiftReadinessCockpit">
            <div className="shiftReadinessCard neutral">
              <div className="readinessIconWrap"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <div className="readinessContent">
                <h4>Postos Alocados</h4>
                <div className="shiftReadinessValue">{safeTotalAlocados} <span>/ {safeTotalNecessario}</span></div>
                <p className="shiftReadinessSub">GAP: {safeGap} postos vazios</p>
              </div>
            </div>
            
            <div className="shiftReadinessCard success">
              <div className="readinessIconWrap"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <div className="readinessContent">
                <h4>Prontidão Real</h4>
                <div className="shiftReadinessValue">{safeProntidao}%</div>
                <p className="shiftReadinessSub">Considerando risco de falta</p>
              </div>
            </div>

            <div className={`shiftReadinessCard ${safeRisco > 0 ? 'danger' : 'success'}`}>
              <div className="readinessIconWrap">
                {safeRisco > 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                )}
              </div>
              <div className="readinessContent">
                <h4>Alerta Crítico</h4>
                <div className="shiftReadinessValue">{safeRisco}</div>
                <p className="shiftReadinessSub">Operadores em risco alto</p>
              </div>
            </div>
          </div>

          <div className="shiftModCard shiftRadarCard">
            <div className="shiftRadarHeader">
              <h3>Radar de Risco Diário</h3>
              
              <button 
                className="shiftModPrimaryButton shiftSmartAllocBtn"
                onClick={handleOpenGlobalEmergency}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Motor de Emergência
              </button>
            </div>
            
            <div className="shiftRadarList">
              {shift.metrics.radarList.length === 0 ? (
                <div className="shiftModEmptyState" style={{ padding: '40px 20px' }}>
                  <div className="shiftEmptyContent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <p style={{color: '#16a34a', fontWeight: '600'}}>Excelente! Nenhum operador desta linha está com Risco Médio ou Alto de assiduidade hoje.</p>
                  </div>
                </div>
              ) : (
                shift.metrics.radarList.map((op, index) => (
                  <div key={index} className={`shiftRadarItem ${op.risco_assiduidade === 'Vermelho' ? 'risk-high' : 'risk-medium'}`}>
                    <div className="shiftRadarInfo">
                      <div className={`shiftRadarBadge ${op.risco_assiduidade === 'Vermelho' ? 'danger' : 'warning'}`}>
                        Score: {op.score_assiduidade}
                      </div>
                      <div className="shiftRadarDetails">
                        <strong>{op.nome} <span>(Mat: {op.matricula})</span></strong>
                        <div className="shiftRadarSubDetails">
                          <span className="shiftTurnoTag">{formatTurno(op.turno)}</span>
                          <span className="shiftPostoTag">Posto: {op.posto_atual || "Sem Posto Fixo"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="shiftModSecondaryButton shiftReplaceBtn"
                      onClick={() => handleReplaceOperator(op.posto_atual, op.turno)} 
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20h5v-5"/><path d="M21 3l-6 6"/><path d="M3 21l6-6"/></svg>
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