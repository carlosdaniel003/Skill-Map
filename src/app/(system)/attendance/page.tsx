// src/app/(system)/attendance/page.tsx
"use client"

import "./page.css"
import { useState } from "react"
import { useAttendance } from "./hooks/useAttendance"
import AttendanceFilters from "./components/AttendanceFilters"
import AttendanceLegend from "./components/AttendanceLegend"
import AttendanceTable from "./components/AttendanceTable"
import ShiftManagementTab from "./components/ShiftManagementTab" 

export default function AttendancePage() {
  
  const { filters, table, modals, shift } = useAttendance()
  const [activeTab, setActiveTab] = useState<'shift' | 'monthly'>('shift')

  return (
    <div className="attendancePageWrapper">
      
      <div className="attendancePageHeader">
        <div className="attendanceHeaderTitles">
          <h1 className="attendancePageTitle">Controle de Frequência</h1>
          <p className="attendancePageSubtitle">Acompanhamento diário de assiduidade e apontamentos da equipe.</p>
        </div>

        <div className="attendanceTabNavigation">
          <button 
            className={`attendanceTabBtn ${activeTab === 'shift' ? 'active' : ''}`}
            onClick={() => setActiveTab('shift')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Gestão do Turno (Hoje)
          </button>
          <button 
            className={`attendanceTabBtn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Apontamento Mensal
          </button>
        </div>
      </div>

      {/* ABA 1: GESTÃO DO TURNO */}
      {activeTab === 'shift' && (
        <ShiftManagementTab filters={filters} shift={shift} />
      )}

      {/* ABA 2: APONTAMENTO MENSAL */}
      {activeTab === 'monthly' && (
        <div className="attendanceCorporateCard attendanceMonthlyCard attendanceAnimateFadeIn">
          <AttendanceFilters 
            selectedMonth={filters.selectedMonth}
            setSelectedMonth={filters.setSelectedMonth}
            selectedYear={filters.selectedYear}
            setSelectedYear={filters.setSelectedYear}
            selectedLine={filters.selectedLine}
            setSelectedLine={filters.setSelectedLine}
            selectedTurno={filters.selectedTurno}
            setSelectedTurno={filters.setSelectedTurno} 
            lines={filters.lines}
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            operators={filters.allOperators}
          />

          <AttendanceLegend />

          {!filters.selectedLine ? (
            <div className="attendanceEmptyState">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="attendanceEmptyIcon">
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
      )}

      {/* MODAL DE ERRO DE ROLLBACK */}
      {modals.alertConfig && (
        <div className="attendanceModalOverlay">
          <div className="attendanceCorporateModal">
            <div className="attendanceModalHeader">
              <div className="attendanceModalIcon attendanceWarningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="attendanceModalBody"><p>{modals.alertConfig.message}</p></div>
            <div className="attendanceModalFooter">
              <button className="attendancePrimaryButton" onClick={()=>modals.setAlertConfig(null)}>Entendi</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}