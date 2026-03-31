// src/app/(system)/attendance/components/AttendanceCell.tsx
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import "./AttendanceCell.css"

const STATUS_OPTIONS = [
  { value: "P",   label: "Presença",         color: "modStatus-p"  },
  { value: "H.E", label: "Hora Extra",       color: "modStatus-he" },
  { value: "F",   label: "Falta",            color: "modStatus-f"  },
  { value: "A",   label: "Atraso",           color: "modStatus-a"  },
  { value: "S",   label: "Saída",            color: "modStatus-s"  },
  { value: "FJ",  label: "Falta Just.",      color: "modStatus-fj" },
  { value: "AJ",  label: "Atraso Just.",     color: "modStatus-aj" },
  { value: "SJ",  label: "Saída Just.",      color: "modStatus-sj" },
  { value: "AT",  label: "Atestado",         color: "modStatus-at" },
  { value: "FE",  label: "Férias",           color: "modStatus-fe" },
  { value: "LP",  label: "Lic. Paternidade", color: "modStatus-lp" },
  { value: "LM",  label: "Lic. Maternidade", color: "modStatus-lm" },
]

interface Props {
  operatorId: string
  dateStr: string
  value: string
  observacao: string
  isWeekend: boolean
  onSave: (opId: string, dateStr: string, val: string, obs: string) => Promise<void>
}

export default function AttendanceCell({ operatorId, dateStr, value, observacao, isWeekend, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isObsModalOpen, setIsObsModalOpen] = useState(false)
  
  const [localValue, setLocalValue] = useState(value)
  const [localObs, setLocalObs] = useState(observacao)
  const [tempObs, setTempObs] = useState("") 

  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'error' | 'success'>('idle')

  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const cellRef = useRef<HTMLTableDataCellElement>(null)

  useEffect(() => { 
    setLocalValue(value)
    setLocalObs(observacao)
  }, [value, observacao])

  function openPopover() {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      
      setPopoverPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX + rect.width / 2,
      })

      // 🌟 INTELIGÊNCIA DE SCROLL: Se o menu abrir cortado embaixo, rola a tela suavemente.
      setTimeout(() => {
        const popover = document.getElementById("modAttendance-popover")
        if (popover) {
          const popRect = popover.getBoundingClientRect()
          if (popRect.bottom > window.innerHeight) {
            window.scrollBy({
              top: (popRect.bottom - window.innerHeight) + 24, // Rola o que faltou + respiro
              behavior: 'smooth'
            })
          }
        }
      }, 50)
    }
    setIsOpen(true)
  }

  function openObsModal() {
    setTempObs(localObs) 
    setIsOpen(false) 
    setIsObsModalOpen(true) 
  }

  async function executeSave(newValue: string, newObs: string) {
    if (newValue === value && newObs === observacao && syncState !== 'error') {
      setIsOpen(false)
      setIsObsModalOpen(false)
      return
    }

    setLocalValue(newValue)
    setLocalObs(newObs)
    setIsOpen(false)
    setIsObsModalOpen(false)
    setSyncState('saving')

    try {
      await onSave(operatorId, dateStr, newValue, newObs)
      setSyncState('success')
      setTimeout(() => setSyncState('idle'), 2000)
    } catch (err) {
      setSyncState('error')
      setLocalValue(value)
      setLocalObs(observacao)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isObsModalOpen) return

      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        const popover = document.getElementById("modAttendance-popover")
        if (popover && popover.contains(event.target as Node)) return

        setIsOpen(false)
        if (localValue !== value || localObs !== observacao) {
          executeSave(localValue, localObs)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [localValue, localObs, value, observacao, isObsModalOpen])

  const currentColorObj = STATUS_OPTIONS.find(opt => opt.value === localValue.toUpperCase())
  const colorClass = currentColorObj?.color ?? ""

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      executeSave(localValue, localObs)
      if (e.key === "Enter") (e.target as HTMLInputElement).blur()
    }
    if (e.key === "Escape") setIsOpen(false)
  }

  const formatDisplayDate = (d: string) => {
    const parts = d.split("-")
    if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return d
  }

  return (
    <td className={`modInputCell ${isWeekend ? "weekend" : ""}`} ref={cellRef}>
      
      {syncState !== 'idle' && (
        <div className="modCell-sync-indicator">
          {syncState === 'saving' && <div className="modCell-sync-spinner" title="Salvando..." />}
          {syncState === 'error' && <div className="modCell-sync-error" title="Erro ao salvar!" />}
          {syncState === 'success' && <div className="modCell-sync-success" title="Salvo com sucesso" />}
        </div>
      )}

      {observacao && syncState === 'idle' && (
        <div className="modCell-obs-triangle" title={`Obs: ${observacao}`} />
      )}

      <div className="modCell-inputWrapper">
        <input
          type="text"
          maxLength={3}
          className={`modCell-excelInput ${colorClass}`}
          value={localValue}
          title={observacao ? `Obs: ${observacao}` : (isWeekend ? "Fim de Semana" : "Dia Útil")}
          onChange={e => setLocalValue(e.target.value.toUpperCase())}
          onFocus={openPopover}
          onKeyDown={handleKeyDown}
          disabled={syncState === 'saving'}
        />
      </div>

      {/* POPOVER DE STATUS (BALÃO FLUTUANTE) */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          id="modAttendance-popover"
          className="modStatusPopover"
          style={{
            position: "absolute", // 🛠️ CORREÇÃO: "absolute" permite que acompanhe o Scroll do body
            top: popoverPos.top,
            left: popoverPos.left,
            transform: "translateX(-50%)",
            zIndex: 99998,
          }}
        >
          <div className="modStatusGrid">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`modStatusBtn ${opt.color}`}
                title={opt.label}
                onMouseDown={e => {
                  e.preventDefault() 
                  executeSave(opt.value, localObs) 
                }}
              >
                {opt.value}
              </button>
            ))}
          </div>
          
          <div className="modPopoverDivider" />
          
          <button
            className="modPopoverAddObsBtn"
            onMouseDown={e => {
              e.preventDefault()
              openObsModal()
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            {localObs ? "Ver / Editar Observação" : "Adicionar Observação"}
          </button>

          <button
            className="modPopoverClearBtn"
            onMouseDown={e => {
              e.preventDefault()
              executeSave("", "") 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Limpar Célula
          </button>
        </div>,
        document.body
      )}

      {/* MODAL DE OBSERVAÇÃO (CENTRALIZADO NA TELA) */}
      {isObsModalOpen && typeof window !== "undefined" && createPortal(
        <div className="modObsModalOverlay">
          <div className="modObsModalCard">
            <div className="modObsModalHeader">
              <div className="modObsTitleWrap">
                <div className="modObsIcon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <h3>Justificativa / Observação</h3>
              </div>
              <span className="modObsModalDate">{formatDisplayDate(dateStr)}</span>
            </div>
            
            <div className="modObsModalBody">
              <label>Detalhes (Opcional)</label>
              <textarea 
                className="modObsModalTextarea"
                placeholder="Ex: Operador apresentou atestado médico do Dr. Carlos referente a 2 dias..."
                value={tempObs}
                onChange={(e) => setTempObs(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modObsModalFooter">
              <button 
                className="modObsGhostBtn"
                onClick={() => setIsObsModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="modObsPrimaryBtn"
                onClick={() => executeSave(localValue, tempObs)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Salvar Informações
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </td>
  )
}