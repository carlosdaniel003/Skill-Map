// src/app/(system)/attendance/page.tsx
"use client"

import "./page.css"
import { useAttendance } from "./hooks/useAttendance"
import AttendanceFilters from "./components/AttendanceFilters"
import AttendanceLegend from "./components/AttendanceLegend"
import AttendanceTable from "./components/AttendanceTable"

export default function AttendancePage() {
  
  // O Hook useAttendance centraliza toda a inteligência da página
  const { filters, table } = useAttendance()

  return (
    <div className="attendancePage">
      
      <div className="pageHeader">
        <h1 className="pageTitle">Controle de Frequência</h1>
        <p className="pageSubtitle">Acompanhamento diário de assiduidade e apontamentos da equipe.</p>
      </div>

      <div className="corporateCard attendanceCard">
        
        {/* Passa todos os filtros, incluindo a lógica de busca global e a lista de operadores */}
        <AttendanceFilters 
          selectedMonth={filters.selectedMonth}
          setSelectedMonth={filters.setSelectedMonth}
          selectedYear={filters.selectedYear}
          setSelectedYear={filters.setSelectedYear}
          selectedLine={filters.selectedLine}
          setSelectedLine={filters.setSelectedLine}
          lines={filters.lines}
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          operators={filters.allOperators} // Importante: allOperators para o autocomplete
        />

        <AttendanceLegend />

        {/* Renderização Condicional: Se não houver linha selecionada, mostra o estado vazio */}
        {!filters.selectedLine ? (
          <div className="emptyAttendance">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="emptyIcon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <p>Selecione um Modelo de Produção ou busque um colaborador para abrir a planilha.</p>
          </div>
        ) : (
          <AttendanceTable 
            operators={table.operators}
            daysInMonth={table.daysInMonth}
            attendanceData={table.attendanceData}
            onSaveCell={table.handleSaveCell} 
          />
        )}

      </div>
    </div>
  )
}