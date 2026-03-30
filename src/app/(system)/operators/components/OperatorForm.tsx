// src/app/(system)/operators/components/OperatorForm.tsx
import React from 'react'
import './OperatorForm.css'

export default function OperatorForm({ data }: { data: any }) {
  const {
    nome, setNome,
    matricula, setMatricula,
    turno, setTurno, 
    linha, setLinha,
    posto, setPosto,
    lines, workstations,
    handleCreateOperator
  } = data

  return (
    <div className="modForm-card">
      
      <div className="modForm-header">
        <div className="modForm-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <h2>Novo Operador</h2>
      </div>
      
      <div className="modForm-grid">
        
        {/* MATRÍCULA */}
        <div className="modForm-inputWrapper">
          <svg className="modForm-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
          <input
            className="modForm-input"
            placeholder="Matrícula *"
            value={matricula}
            inputMode="numeric"
            maxLength={6}
            onChange={(e)=>{
              const value = e.target.value.replace(/\D/g,"")
              setMatricula(value)
            }}
          />
        </div>

        {/* NOME COMPLETO */}
        <div className="modForm-inputWrapper">
          <svg className="modForm-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input
            className="modForm-input"
            placeholder="Nome completo *"
            maxLength={50}
            value={nome}
            onChange={e=>setNome(e.target.value)}
          />
        </div>

        {/* TURNO */}
        <div className="modForm-inputWrapper">
          <svg className="modForm-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <select
            className="modForm-select"
            value={turno}
            onChange={e=>setTurno(e.target.value)}
          >
            <option value="" disabled>Selecionar turno *</option>
            <option value="Comercial">Comercial</option>
            <option value="2º Turno estendido">2º Turno estendido</option>
          </select>
        </div>

        {/* LINHA / MODELO */}
        <div className="modForm-inputWrapper">
          <svg className="modForm-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <select
            className="modForm-select"
            value={linha}
            onChange={e=>setLinha(e.target.value)}
          >
            <option value="" disabled>Selecionar modelo *</option>
            {lines.map((line: any) => (
              <option key={line.id} value={line.nome}>{line.nome}</option>
            ))}
          </select>
        </div>

        {/* POSTO */}
        <div className="modForm-inputWrapper" style={{ gridColumn: '1 / -1' }}>
          <svg className="modForm-inputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <select
            className="modForm-select"
            value={posto}
            onChange={e=>setPosto(e.target.value)}
          >
            <option value="" disabled>Selecionar posto base *</option>
            {workstations.map((ws: any) => (
              <option key={ws.id} value={ws.nome}>{ws.nome}</option>
            ))}
          </select>
        </div>

      </div>

      <button
        className="modForm-primaryBtn"
        onClick={handleCreateOperator}
        disabled={!nome || matricula.length !== 6 || !turno || !linha || !posto} 
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Cadastrar Operador
      </button>
      
    </div>
  )
}