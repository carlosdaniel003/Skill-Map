// src/app/(system)/attendance/components/AttendanceTable.tsx
import AttendanceCell from "./AttendanceCell"

interface Day {
  day: number
  isWeekend: boolean
  dateStr: string
}

interface Props {
  operators: any[]
  daysInMonth: Day[]
  attendanceData: Record<string, string>
  onSaveCell: (opId: string, date: string, val: string) => void
}

export default function AttendanceTable({ operators, daysInMonth, attendanceData, onSaveCell }: Props) {
  return (
    <div className="tableContainer">
      <table className="excelTable">
        <thead>
          <tr>
            <th className="stickyCol col-id">ID</th>
            <th className="stickyCol col-matricula">MATRÍCULA</th>
            <th className="stickyCol col-nome">NOME COLABORADOR</th>
            <th className="stickyCol col-posto">POSTO</th>
            <th className="stickyCol col-linha">LINHA</th>
            {daysInMonth.map(d => (
              <th key={d.day} className={`dayCol ${d.isWeekend ? 'weekend' : ''}`}>
                {d.day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {operators.map((op, index) => (
            <tr key={op.id}>
              <td className="stickyCol col-id text-center">{index + 1}</td>
              <td className="stickyCol col-matricula text-center">{op.matricula}</td>
              <td className="stickyCol col-nome fw-bold">{op.nome}</td>
              <td className="stickyCol col-posto">{op.posto_atual}</td>
              <td className="stickyCol col-linha">{op.linha_atual}</td>
              
              {daysInMonth.map(d => {
                const key = `${op.id}_${d.dateStr}`
                const cellValue = attendanceData[key] || ""

                return (
                  <AttendanceCell 
                    key={d.day}
                    operatorId={op.id}
                    dateStr={d.dateStr}
                    value={cellValue}
                    isWeekend={d.isWeekend}
                    onSave={onSaveCell}
                  />
                )
              })}
            </tr>
          ))}
          
          {operators.length === 0 && (
            <tr>
              <td colSpan={5 + daysInMonth.length} className="noDataCell">
                Nenhum operador encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}