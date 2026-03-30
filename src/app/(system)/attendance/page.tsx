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
        <div className="attendanceHeaderLeft">
          <div className="attendanceHeaderIconWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
            </svg>
          </div>
          <div className="attendanceHeaderTitles">
            <h1 className="attendancePageTitle">Controle de Frequência</h1>
            <p className="attendancePageSubtitle">Acompanhamento diário de assiduidade e apontamentos da equipe.</p>
          </div>
        </div>

        <div className="attendanceTabNavigation">
          <button 
            className={`attendanceTabBtn ${activeTab === 'shift' ? 'active' : ''}`}
            onClick={() => setActiveTab('shift')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Gestão do Turno (Hoje)
          </button>
          <button 
            className={`attendanceTabBtn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Apontamento Mensal
          </button>
        </div>
      </div>

      {/* ABA 1: GESTÃO DO TURNO */}
      {activeTab === 'shift' && (
        <div className="attendanceAnimateFadeIn">
          <ShiftManagementTab filters={filters} shift={shift} />
        </div>
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
              <div className="attendanceEmptyStateContent">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="attendanceEmptyIcon">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <p>Selecione um Modelo de Produção ou busque um colaborador para abrir a planilha.</p>
              </div>
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
          <div className="attendanceModernModal">
            <div className="attendanceModalHeader">
              <div className="attendanceModalIcon attendanceWarningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
              </div>
              <h3>{modals.alertConfig.title}</h3>
            </div>
            <div className="attendanceModalBody">
              <p>{modals.alertConfig.message}</p>
            </div>
            <div className="attendanceModalFooter">
              <button className="attendanceModernPrimaryButton" onClick={()=>modals.setAlertConfig(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}