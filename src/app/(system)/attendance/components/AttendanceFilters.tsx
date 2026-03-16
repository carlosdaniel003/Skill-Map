// src/app/(system)/attendance/components/AttendanceFilters.tsx
import { useState, useRef, useEffect } from "react"

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
  lines: string[]
  searchQuery: string
  setSearchQuery: (s: string) => void
  operators: any[] // Esta deve ser a lista allOperators vinda do hook
}

export default function AttendanceFilters({
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  selectedLine, setSelectedLine,
  lines,
  searchQuery, setSearchQuery,
  operators
}: Props) {

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fecha a caixinha se clicar fora dela
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

  // Gera as sugestões filtrando por Nome ou Matrícula
  const suggestions = operators.filter(op => 
    op.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(op.matricula).includes(searchQuery)
  ).slice(0, 10)

  return (
    <div className="attendanceFilters">
      <div className="filterGroup">
        <label>Mês</label>
        <select className="corporateInput" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {MESES.map((mes, index) => (
            <option key={index} value={index}>{mes}</option>
          ))}
        </select>
      </div>

      <div className="filterGroup">
        <label>Ano</label>
        <select className="corporateInput" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map(ano => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </select>
      </div>

      <div className="filterGroup">
        <label>Modelo de Produção</label>
        <select className="corporateInput" value={selectedLine} onChange={(e) => setSelectedLine(e.target.value)}>
          <option value="">Selecione a Linha...</option>
          {lines.map(linha => (
            <option key={linha} value={linha}>{linha}</option>
          ))}
        </select>
      </div>

      {/* CAMPO DE BUSCA COM AUTOCOMPLETE GLOBAL */}
      <div className="filterGroup searchGroup" ref={searchRef}>
        <label>Buscar Operador</label>
        <input 
          type="text" 
          className="corporateInput" 
          placeholder="Nome ou matrícula..." 
          value={searchQuery} 
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsSearchOpen(true) 
          }}
          onFocus={() => setIsSearchOpen(true)}
        />

        {/* CAIXA SUSPENSA DE SUGESTÕES */}
        {isSearchOpen && searchQuery && (
          <div className="autocompleteDropdown">
            {suggestions.length > 0 ? (
              suggestions.map(op => (
                <div 
                  key={op.id} 
                  className="autocompleteItem"
                  onClick={() => {
                    // MÁGICA AQUI: Seta a linha do operador para a tabela carregar os dados dele
                    setSelectedLine(op.linha_atual) 
                    setSearchQuery(op.nome) 
                    setIsSearchOpen(false)
                  }}
                >
                  <span className="autoMatricula">{op.matricula}</span>
                  <div className="autoInfo">
                    <span className="autoNome">{op.nome}</span>
                    <span className="autoLinha">{op.linha_atual || "Sem Linha"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="autocompleteItem empty">
                Nenhum colaborador encontrado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}