// src/app/(system)/attendance/components/AttendanceLegend.tsx
import "./AttendanceLegend.css"

export default function AttendanceLegend() {
  return (
    <div className="attendanceLegend">
      
      <div className="legendGroup">
        <div className="legendBadge status-green">PRESENÇA</div>
        <div className="legendItems">
          <span><strong>P</strong> Presença</span>
          <span><strong>H.E</strong> Hora Extra</span>
        </div>
      </div>

      <div className="legendDivider" />

      <div className="legendGroup">
        <div className="legendBadge status-red">CRÍTICO</div>
        <div className="legendItems">
          <span><strong>F</strong> Falta</span>
          <span><strong>A</strong> Atraso</span>
          <span><strong>S</strong> Saída antecipada</span>
        </div>
      </div>

      <div className="legendDivider" />

      <div className="legendGroup">
        <div className="legendBadge status-yellow">JUSTIFICADOS</div>
        <div className="legendItems">
          <span><strong>FJ</strong> Falta Just.</span>
          <span><strong>AJ</strong> Atraso Just.</span>
          <span><strong>SJ</strong> Saída Just.</span>
          <span><strong>AT</strong> Atestado</span>
        </div>
      </div>

      <div className="legendDivider" />

      <div className="legendGroup">
        <div className="legendBadge status-blue">LICENÇAS</div>
        <div className="legendItems">
          <span><strong>FE</strong> Férias</span>
          <span><strong>LP</strong> Lic. Paternidade</span>
          <span><strong>LM</strong> Lic. Maternidade</span>
        </div>
      </div>

    </div>
  )
}