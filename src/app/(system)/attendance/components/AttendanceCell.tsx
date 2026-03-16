// src/app/(system)/attendance/components/AttendanceCell.tsx
import { useState, useRef, useEffect } from "react"

const STATUS_OPTIONS = [
  { value: "P", label: "Presença", color: "status-p" },
  { value: "H.E", label: "Hora Extra", color: "status-he" },
  { value: "F", label: "Falta", color: "status-f" },
  { value: "A", label: "Atraso", color: "status-a" },
  { value: "S", label: "Saída", color: "status-s" },
  { value: "FJ", label: "Falta Just.", color: "status-fj" },
  { value: "AJ", label: "Atraso Just.", color: "status-aj" },
  { value: "SJ", label: "Saída Just.", color: "status-sj" },
  { value: "AT", label: "Atestado", color: "status-at" },
  { value: "FE", label: "Férias", color: "status-fe" },
  { value: "LP", label: "Lic. Paternidade", color: "status-lp" },
  { value: "LM", label: "Lic. Maternidade", color: "status-lm" }
]

interface Props {
  operatorId: string
  dateStr: string
  value: string
  isWeekend: boolean
  onSave: (opId: string, dateStr: string, val: string) => void
}

export default function AttendanceCell({ operatorId, dateStr, value, isWeekend, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  
  // CORREÇÃO AQUI: Tipado corretamente como uma célula de tabela (TD)
  const cellRef = useRef<HTMLTableDataCellElement>(null) 

  // Sincroniza caso o valor venha do banco depois
  useEffect(() => { setLocalValue(value) }, [value])

  // Fecha o popover se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (localValue !== value) {
          onSave(operatorId, dateStr, localValue) // Salva se digitou e clicou fora
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [localValue, value, operatorId, dateStr, onSave])

  // Pega a classe de cor baseada no valor atual
  const currentColorObj = STATUS_OPTIONS.find(opt => opt.value === localValue.toUpperCase())
  const colorClass = currentColorObj ? currentColorObj.color : ""

  function handleButtonClick(statusVal: string) {
    setLocalValue(statusVal)
    setIsOpen(false)
    onSave(operatorId, dateStr, statusVal) // Salva imediatamente
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      setIsOpen(false)
      onSave(operatorId, dateStr, localValue)
      if (e.key === "Enter") (e.target as HTMLInputElement).blur()
    }
  }

  return (
    <td className={`inputCell ${isWeekend ? 'weekend' : ''}`} ref={cellRef}>
      
      <input 
        type="text" 
        maxLength={3}
        className={`excelInput ${colorClass}`}
        value={localValue}
        title={isWeekend ? "Fim de Semana" : "Dia Útil"}
        onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {/* BALÃO FLUTUANTE COM OS 12 BOTÕES */}
      {isOpen && (
        <div className="statusPopover">
          <div className="statusGrid">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`statusBtn ${opt.color}`}
                title={opt.label}
                onClick={() => handleButtonClick(opt.value)}
              >
                {opt.value}
              </button>
            ))}
          </div>
          {/* Botão para limpar a célula */}
          <button className="clearBtn" onClick={() => handleButtonClick("")}>
            Limpar Célula
          </button>
        </div>
      )}

    </td>
  )
}