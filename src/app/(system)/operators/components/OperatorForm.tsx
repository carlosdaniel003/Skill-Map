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
    <div className="corporateCard formCard">
      <h2>Novo Operador</h2>
      
      <div className="formGrid">
        <input
          className="corporateInput"
          placeholder="Matrícula *"
          value={matricula}
          inputMode="numeric"
          maxLength={6}
          onChange={(e)=>{
            const value = e.target.value.replace(/\D/g,"")
            setMatricula(value)
          }}
        />

        <input
          className="corporateInput"
          placeholder="Nome completo *"
          maxLength={50}
          value={nome}
          onChange={e=>setNome(e.target.value)}
        />

        <select
          className="corporateInput"
          value={turno}
          onChange={e=>setTurno(e.target.value)}
        >
          <option value="">Selecionar turno *</option>
          <option value="Comercial">Comercial</option>
          <option value="2º Turno estendido">2º Turno estendido</option>
        </select>

        {/* 🆕 CAMPO DE LINHA (AGORA OBRIGATÓRIO) */}
        <select
          className="corporateInput"
          value={linha}
          onChange={e=>setLinha(e.target.value)}
        >
          <option value="">Selecionar modelo *</option>
          {lines.map((line: any) => (
            <option key={line.id} value={line.nome}>{line.nome}</option>
          ))}
        </select>

        {/* 🆕 CAMPO DE POSTO (AGORA OBRIGATÓRIO) */}
        <select
          className="corporateInput"
          value={posto}
          onChange={e=>setPosto(e.target.value)}
        >
          <option value="">Selecionar posto *</option>
          {workstations.map((ws: any) => (
            <option key={ws.id} value={ws.nome}>{ws.nome}</option>
          ))}
        </select>
      </div>

      <button
        className="primaryButton fullWidth mt-3"
        onClick={handleCreateOperator}
        /* 🆕 BLOQUEIA O BOTÃO SE LINHA OU POSTO ESTIVEREM VAZIOS */
        disabled={!nome || matricula.length !== 6 || !turno || !linha || !posto} 
      >
        Cadastrar Operador
      </button>
    </div>
  )
}