// src/app/(system)/attendance/components/AttendanceTable.tsx
import AttendanceCell from "./AttendanceCell"
import { AttendanceRecord } from "../hooks/useAttendance"
import "./AttendanceTable.css"

interface Day {
  day: number
  isWeekend: boolean
  dateStr: string
}

interface Props {
  operators: any[]
  daysInMonth: Day[]
  attendanceData: Record<string, AttendanceRecord>
  onSaveCell: (opId: string, date: string, val: string, obs: string) => Promise<void>
}

export default function AttendanceTable({ operators, daysInMonth, attendanceData, onSaveCell }: Props) {
  return (
    <div className="modAttendanceTableContainer">
      <table className="excelTable">
        <thead>
          <tr>
            <th className="stickyCol col-id">ID</th>
            <th className="stickyCol col-matricula">MATRÍCULA</th>
            <th className="stickyCol col-nome">NOME COLABORADOR</th>
            {/* COLUNA DO TURNO */}
            <th className="stickyCol col-turno">TURNO</th> 
            <th className="stickyCol col-posto">POSTO</th>
            <th className="stickyCol col-linha">LINHA</th>
            {daysInMonth.map(d => {
              const dataObj = new Date(`${d.dateStr}T12:00:00`)
              let nomeDia = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })
              nomeDia = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1)

              return (
                <th 
                  key={d.day} 
                  className={`dayCol ${d.isWeekend ? 'weekend' : ''}`}
                  title={`${d.day} - ${nomeDia}`}
                >
                  {d.day}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {operators.map((op, index) => (
            <tr key={op.id}>
              <td className="stickyCol col-id text-center">{index + 1}</td>
              <td className="stickyCol col-matricula text-center">{op.matricula}</td>
              <td className="stickyCol col-nome fw-bold" title={op.nome}>{op.nome}</td>
              
              {/* COLUNA DO TURNO COM PEQUENO DESTAQUE VISUAL */}
              <td className="stickyCol col-turno text-center">
                <span className="turnoBadge">
                  {op.turno || "-"}
                </span>
              </td>
              
              <td className="stickyCol col-posto" title={op.posto_atual}>{op.posto_atual}</td>
              <td className="stickyCol col-linha" title={op.linha_atual}>{op.linha_atual}</td>
              
              {daysInMonth.map(d => {
                const key = `${op.id}_${d.dateStr}`
                const cellData = attendanceData[key] || { status: "", observacao: "" }

                return (
                  <AttendanceCell 
                    key={d.day}
                    operatorId={op.id}
                    dateStr={d.dateStr}
                    value={cellData.status}
                    observacao={cellData.observacao}
                    isWeekend={d.isWeekend}
                    onSave={onSaveCell}
                  />
                )
              })}
            </tr>
          ))}
          
          {operators.length === 0 && (
            <tr>
              <td colSpan={6 + daysInMonth.length} className="noDataCell">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dcdcdc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.5L7 3h4l1.5 2H14a2 2 0 0 1 2 2v1"/><rect x="16" y="5" width="6" height="6" rx="1"/><path d="M19 8v4"/><path d="M19 15v.01"/></svg>
                  <span>Nenhum operador encontrado para o modelo de produção selecionado.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}