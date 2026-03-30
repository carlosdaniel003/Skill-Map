// src/app/(system)/attendance/components/AttendanceFilters.tsx
import { useState, useRef, useEffect } from "react"
import "./AttendanceFilters.css"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

interface Props {
  selectedMonth: number
  setSelectedMonth: (m: number) => void
  selectedYear: number
  setSelectedYear: (y: number) => void
  selectedLine: string
  setSelectedLine: (l: string) => void
  selectedTurno: string 
  setSelectedTurno: (t: string) => void 
  lines: string[]
  searchQuery: string
  setSearchQuery: (s: string) => void
  operators: any[]
}

export default function AttendanceFilters({
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  selectedLine, setSelectedLine,
  selectedTurno, setSelectedTurno,
  lines,
  searchQuery, setSearchQuery,
  operators
}: Props) {

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const suggestions = operators.filter(op => 
    op.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(op.matricula).includes(searchQuery)
  ).slice(0, 10)

  return (
    <div className="modFiltersContainer">
      <div className="modFiltersHeader">
        <h3>Filtros de Frequência</h3>
      </div>

      <div className="modAttendanceFilters">
        
        {/* MÊS */}
        <div className="modFilterGroup">
          <label>Mês</label>
          <div className="modFilterInputWrapper">
            <svg className="modFilterIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <select className="modFilterInput" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {MESES.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ANO */}
        <div className="modFilterGroup">
          <label>Ano</label>
          <div className="modFilterInputWrapper">
            <svg className="modFilterIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <select className="modFilterInput" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {years.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MODELO DE PRODUÇÃO */}
        <div className="modFilterGroup">
          <label>Modelo de Produção</label>
          <div className="modFilterInputWrapper">
            <svg className="modFilterIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <select className="modFilterInput" value={selectedLine} onChange={(e) => setSelectedLine(e.target.value)}>
              <option value="">Selecione a Linha...</option>
              {lines.map(linha => (
                <option key={linha} value={linha}>{linha}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TURNO */}
        <div className="modFilterGroup">
          <label>Turno</label>
          <div className="modFilterInputWrapper">
            <svg className="modFilterIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <select className="modFilterInput" value={selectedTurno} onChange={(e) => setSelectedTurno(e.target.value)}>
              <option value="">Todos os Turnos</option>
              <option value="Comercial">Comercial</option>
              <option value="2º Turno estendido">2º Turno estendido</option>
            </select>
          </div>
        </div>

        {/* BUSCAR OPERADOR (AUTOCOMPLETE) */}
        <div className="modFilterGroup modSearchGroup" ref={searchRef}>
          <label>Buscar Operador</label>
          <div className="modFilterInputWrapper">
            <svg className="modFilterIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              className="modFilterInput" 
              placeholder="Digite o nome ou matrícula..." 
              value={searchQuery} 
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(true) 
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>

          {isSearchOpen && searchQuery && (
            <div className="modAutocompleteDropdown">
              {suggestions.length > 0 ? (
                suggestions.map(op => (
                  <div 
                    key={op.id} 
                    className="modAutocompleteItem"
                    onClick={() => {
                      setSelectedLine(op.linha_atual) 
                      setSearchQuery(op.nome) 
                      setIsSearchOpen(false)
                    }}
                  >
                    <div className="modAutoAvatar">
                      {op.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="modAutoInfo">
                      <span className="modAutoNome">{op.nome} <span className="modAutoMatricula">Mat: {op.matricula}</span></span>
                      <span className="modAutoLinha">{op.turno || "S/T"} • {op.linha_atual || "Sem Linha Vinculada"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="modAutocompleteItem empty">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" style={{marginBottom: '8px'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Nenhum colaborador encontrado
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}