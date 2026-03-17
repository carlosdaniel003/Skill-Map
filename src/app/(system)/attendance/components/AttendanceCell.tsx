import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import "./AttendanceCell.css"

const STATUS_OPTIONS = [
  { value: "P",   label: "Presença",         color: "status-p"  },
  { value: "H.E", label: "Hora Extra",        color: "status-he" },
  { value: "F",   label: "Falta",             color: "status-f"  },
  { value: "A",   label: "Atraso",            color: "status-a"  },
  { value: "S",   label: "Saída",             color: "status-s"  },
  { value: "FJ",  label: "Falta Just.",       color: "status-fj" },
  { value: "AJ",  label: "Atraso Just.",      color: "status-aj" },
  { value: "SJ",  label: "Saída Just.",       color: "status-sj" },
  { value: "AT",  label: "Atestado",          color: "status-at" },
  { value: "FE",  label: "Férias",            color: "status-fe" },
  { value: "LP",  label: "Lic. Paternidade",  color: "status-lp" },
  { value: "LM",  label: "Lic. Maternidade",  color: "status-lm" },
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

  // 🔥 Guarda as coordenadas fixas do popover
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  const cellRef = useRef<HTMLTableDataCellElement>(null)

  useEffect(() => { setLocalValue(value) }, [value])

  // 🔥 Calcula posição real da célula no viewport ao abrir
  function openPopover() {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setPopoverPos({
        top: rect.bottom + window.scrollY + 4,  // logo abaixo da célula
        left: rect.left + window.scrollX + rect.width / 2, // centralizado
      })
    }
    setIsOpen(true)
  }

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        // Verifica se clicou dentro do popover (que está no body)
        const popover = document.getElementById("attendance-popover")
        if (popover && popover.contains(event.target as Node)) return

        setIsOpen(false)
        if (localValue !== value) {
          onSave(operatorId, dateStr, localValue)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [localValue, value, operatorId, dateStr, onSave])

  const currentColorObj = STATUS_OPTIONS.find(
    opt => opt.value === localValue.toUpperCase()
  )
  const colorClass = currentColorObj?.color ?? ""

  function handleButtonClick(statusVal: string) {
    setLocalValue(statusVal)
    setIsOpen(false)
    onSave(operatorId, dateStr, statusVal)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      setIsOpen(false)
      onSave(operatorId, dateStr, localValue)
      if (e.key === "Enter") (e.target as HTMLInputElement).blur()
    }
    if (e.key === "Escape") setIsOpen(false)
  }

  return (
    <td className={`inputCell ${isWeekend ? "weekend" : ""}`} ref={cellRef}>
      <input
        type="text"
        maxLength={3}
        className={`excelInput ${colorClass}`}
        value={localValue}
        title={isWeekend ? "Fim de Semana" : "Dia Útil"}
        onChange={e => setLocalValue(e.target.value.toUpperCase())}
        onFocus={openPopover}  // 🔥 usa openPopover em vez de setIsOpen(true)
        onKeyDown={handleKeyDown}
      />

      {/* 🔥 PORTAL — renderiza no <body>, nunca será cortado por overflow */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          id="attendance-popover"
          className="statusPopover"
          style={{
            position: "fixed",          // 🔥 fixed ignora qualquer overflow pai
            top: popoverPos.top,
            left: popoverPos.left,
            transform: "translateX(-50%)",
            zIndex: 99999,
          }}
        >
          <div className="statusGrid">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`statusBtn ${opt.color}`}
                title={opt.label}
                onMouseDown={e => {
                  e.preventDefault() // 🔥 evita blur antes do click registrar
                  handleButtonClick(opt.value)
                }}
              >
                {opt.value}
              </button>
            ))}
          </div>
          <button
            className="clearBtn"
            onMouseDown={e => {
              e.preventDefault()
              handleButtonClick("")
            }}
          >
            Limpar Célula
          </button>
        </div>,
        document.body  // 🔥 destino do portal
      )}
    </td>
  )
}