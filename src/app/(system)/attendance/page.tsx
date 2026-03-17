// src/app/(system)/attendance/page.tsx
"use client"

import "./page.css"
import { useAttendance } from "./hooks/useAttendance"
import AttendanceFilters from "./components/AttendanceFilters"
import AttendanceLegend from "./components/AttendanceLegend"
import AttendanceTable from "./components/AttendanceTable"

export default function AttendancePage() {
  
  const { filters, table, modals } = useAttendance() // <-- Adicionado 'modals'

  return (
    <div className="attendancePage">
      
      <div className="pageHeader">
        <h1 className="pageTitle">Controle de Frequência</h1>
        <p className="pageSubtitle">Acompanhamento diário de assiduidade e apontamentos da equipe.</p>
      </div>

      <div className="corporateCard attendanceCard">
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
          operators={filters.allOperators}
        />

        <AttendanceLegend />

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

      {/* MODAL DE ERRO DE ROLLBACK (NOVO) */}
      {modals.alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="modalBody"><p>{modals.alertConfig.message}</p></div>
            <div className="modalFooter">
              <button className="primaryButton" onClick={()=>modals.setAlertConfig(null)}>Entendi</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}