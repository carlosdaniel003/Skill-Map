// src/app/(system)/attendance/components/AttendanceLegend.tsx
import "./AttendanceLegend.css"

export default function AttendanceLegend() {
  return (
    <div className="modAttendanceLegend">
      
      <div className="modLegendGroup">
        <div className="modLegendIcon" style={{ color: '#16a34a' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div className="modLegendBadge status-green">PRESENÇA</div>
        <div className="modLegendItems">
          <span><strong className="modStatusTag status-p">P</strong> Presença</span>
          <span><strong className="modStatusTag status-he">H.E</strong> Hora Extra</span>
        </div>
      </div>

      <div className="modLegendDivider" />

      <div className="modLegendGroup">
        <div className="modLegendIcon" style={{ color: '#dc2626' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div className="modLegendBadge status-red">CRÍTICO</div>
        <div className="modLegendItems">
          <span><strong className="modStatusTag status-f">F</strong> Falta</span>
          <span><strong className="modStatusTag status-a">A</strong> Atraso</span>
          <span><strong className="modStatusTag status-s">S</strong> Saída antecipada</span>
        </div>
      </div>

      <div className="modLegendDivider" />

      <div className="modLegendGroup">
        <div className="modLegendIcon" style={{ color: '#ea580c' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div className="modLegendBadge status-yellow">JUSTIFICADOS</div>
        <div className="modLegendItems">
          <span><strong className="modStatusTag status-fj">FJ</strong> Falta Just.</span>
          <span><strong className="modStatusTag status-aj">AJ</strong> Atraso Just.</span>
          <span><strong className="modStatusTag status-sj">SJ</strong> Saída Just.</span>
          <span><strong className="modStatusTag status-at">AT</strong> Atestado</span>
        </div>
      </div>

      <div className="modLegendDivider" />

      <div className="modLegendGroup">
        <div className="modLegendIcon" style={{ color: '#2563eb' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div className="modLegendBadge status-blue">LICENÇAS</div>
        <div className="modLegendItems">
          <span><strong className="modStatusTag status-fe">FE</strong> Férias</span>
          <span><strong className="modStatusTag status-lp">LP</strong> Lic. Paternidade</span>
          <span><strong className="modStatusTag status-lm">LM</strong> Lic. Maternidade</span>
        </div>
      </div>

    </div>
  )
}