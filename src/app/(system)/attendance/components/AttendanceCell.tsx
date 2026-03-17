// src/app/(system)/attendance/components/AttendanceCell.tsx
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
  onSave: (opId: string, dateStr: string, val: string) => Promise<void>
}

export default function AttendanceCell({ operatorId, dateStr, value, isWeekend, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  // ESTADOS VISUAIS DE SINCRONIZAÇÃO
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'error' | 'success'>('idle')

  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const cellRef = useRef<HTMLTableDataCellElement>(null)

  // O Rollback do hook reflete aqui também via props
  useEffect(() => { 
    setLocalValue(value) 
  }, [value])

  function openPopover() {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setPopoverPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
    setIsOpen(true)
  }

  // LÓGICA ASSÍNCRONA COM FEEDBACK VISUAL
  async function executeSave(newValue: string) {
    // Evita chamadas repetidas desnecessárias
    if (newValue === value && syncState !== 'error') {
      setIsOpen(false)
      return
    }

    setLocalValue(newValue)
    setIsOpen(false)
    setSyncState('saving')

    try {
      await onSave(operatorId, dateStr, newValue)
      setSyncState('success')
      // A bolinha verde de sucesso some após 2 segundos
      setTimeout(() => setSyncState('idle'), 2000)
    } catch (err) {
      setSyncState('error')
      setLocalValue(value) // Força o valor de volta à realidade visualmente na célula
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        const popover = document.getElementById("attendance-popover")
        if (popover && popover.contains(event.target as Node)) return

        setIsOpen(false)
        if (localValue !== value) {
          executeSave(localValue)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [localValue, value]) // Dependências focadas no valor

  const currentColorObj = STATUS_OPTIONS.find(opt => opt.value === localValue.toUpperCase())
  const colorClass = currentColorObj?.color ?? ""

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      executeSave(localValue)
      if (e.key === "Enter") (e.target as HTMLInputElement).blur()
    }
    if (e.key === "Escape") setIsOpen(false)
  }

  return (
    <td className={`inputCell ${isWeekend ? "weekend" : ""}`} ref={cellRef}>
      
      {/* INDICADOR VISUAL DE STATUS */}
      {syncState !== 'idle' && (
        <div className="sync-indicator">
          {syncState === 'saving' && <div className="sync-spinner" title="Salvando..." />}
          {syncState === 'error' && <div className="sync-error" title="Erro ao salvar!" />}
          {syncState === 'success' && <div className="sync-success" title="Salvo com sucesso" />}
        </div>
      )}

      <input
        type="text"
        maxLength={3}
        className={`excelInput ${colorClass}`}
        value={localValue}
        title={isWeekend ? "Fim de Semana" : "Dia Útil"}
        onChange={e => setLocalValue(e.target.value.toUpperCase())}
        onFocus={openPopover}
        onKeyDown={handleKeyDown}
        disabled={syncState === 'saving'} // Bloqueia digitação enquanto salva
      />

      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          id="attendance-popover"
          className="statusPopover"
          style={{
            position: "fixed",
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
                  e.preventDefault() 
                  executeSave(opt.value)
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
              executeSave("")
            }}
          >
            Limpar Célula
          </button>
        </div>,
        document.body
      )}
    </td>
  )
}