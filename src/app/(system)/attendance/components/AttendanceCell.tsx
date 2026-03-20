// src/app/(system)/attendance/components/AttendanceCell.tsx
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import "./AttendanceCell.css"

const STATUS_OPTIONS = [
  { value: "P",   label: "Presença",         color: "status-p"  },
  { value: "H.E", label: "Hora Extra",       color: "status-he" },
  { value: "F",   label: "Falta",            color: "status-f"  },
  { value: "A",   label: "Atraso",           color: "status-a"  },
  { value: "S",   label: "Saída",            color: "status-s"  },
  { value: "FJ",  label: "Falta Just.",      color: "status-fj" },
  { value: "AJ",  label: "Atraso Just.",     color: "status-aj" },
  { value: "SJ",  label: "Saída Just.",      color: "status-sj" },
  { value: "AT",  label: "Atestado",         color: "status-at" },
  { value: "FE",  label: "Férias",           color: "status-fe" },
  { value: "LP",  label: "Lic. Paternidade", color: "status-lp" },
  { value: "LM",  label: "Lic. Maternidade", color: "status-lm" },
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
  const [tempObs, setTempObs] = useState("") // Usado apenas dentro do modal para poder cancelar sem salvar

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
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
    setIsOpen(true)
  }

  function openObsModal() {
    setTempObs(localObs) // Copia o valor atual para o rascunho do modal
    setIsOpen(false) // Fecha o balão flutuante
    setIsObsModalOpen(true) // Abre o modal no meio da tela
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
      // TRAVA: Se o modal estiver aberto, ignora cliques fora!
      if (isObsModalOpen) return

      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        const popover = document.getElementById("attendance-popover")
        if (popover && popover.contains(event.target as Node)) return

        setIsOpen(false)
        // Só salva sozinho se alterou o status digitando diretamente na célula
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

  // Formata a data de AAAA-MM-DD para DD/MM/AAAA para exibir no Modal
  const formatDisplayDate = (d: string) => {
    const parts = d.split("-")
    if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return d
  }

  return (
    <td className={`inputCell ${isWeekend ? "weekend" : ""}`} ref={cellRef}>
      
      {syncState !== 'idle' && (
        <div className="sync-indicator">
          {syncState === 'saving' && <div className="sync-spinner" title="Salvando..." />}
          {syncState === 'error' && <div className="sync-error" title="Erro ao salvar!" />}
          {syncState === 'success' && <div className="sync-success" title="Salvo com sucesso" />}
        </div>
      )}

      {/* Triângulo indicador de observação salva */}
      {observacao && syncState === 'idle' && (
        <div className="obs-triangle" title={`Obs: ${observacao}`} />
      )}

      <input
        type="text"
        maxLength={3}
        className={`excelInput ${colorClass}`}
        value={localValue}
        title={observacao ? `Obs: ${observacao}` : (isWeekend ? "Fim de Semana" : "Dia Útil")}
        onChange={e => setLocalValue(e.target.value.toUpperCase())}
        onFocus={openPopover}
        onKeyDown={handleKeyDown}
        disabled={syncState === 'saving'}
      />

      {/* POPOVER DE STATUS (BALÃO FLUTUANTE) */}
      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          id="attendance-popover"
          className="statusPopover"
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            transform: "translateX(-50%)",
            zIndex: 99998,
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
                  executeSave(opt.value, localObs) // Muda o status, preserva a observação
                }}
              >
                {opt.value}
              </button>
            ))}
          </div>
          
          <div className="popoverDivider" />
          
          <button
            className="addObsBtn"
            onMouseDown={e => {
              e.preventDefault()
              openObsModal()
            }}
          >
            {localObs ? "Ver / Editar Observação" : "Adicionar Observação"}
          </button>

          <button
            className="clearBtn"
            onMouseDown={e => {
              e.preventDefault()
              executeSave("", "") // Limpa status e observação
            }}
          >
            Limpar Célula
          </button>
        </div>,
        document.body
      )}

      {/* MODAL DE OBSERVAÇÃO (CENTRALIZADO NA TELA) */}
      {isObsModalOpen && typeof window !== "undefined" && createPortal(
        <div className="obsModalOverlay">
          <div className="obsModalCard">
            <div className="obsModalHeader">
              <h3>Justificativa / Observação</h3>
              <span className="obsModalDate">{formatDisplayDate(dateStr)}</span>
            </div>
            
            <div className="obsModalBody">
              <label>Detalhes (Opcional)</label>
              <textarea 
                className="obsModalTextarea"
                placeholder="Ex: Operador apresentou atestado médico do Dr. Carlos referente a 2 dias..."
                value={tempObs}
                onChange={(e) => setTempObs(e.target.value)}
                autoFocus
              />
            </div>

            <div className="obsModalFooter">
              <button 
                className="obsModalBtn secondary"
                onClick={() => setIsObsModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="obsModalBtn primary"
                onClick={() => executeSave(localValue, tempObs)}
              >
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