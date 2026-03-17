// src/app/(system)/operators/components/OperatorForm.tsx
import React from 'react'
import './OperatorForm.css'

export default function OperatorForm({ data }: { data: any }) {
  const {
    nome, setNome,
    matricula, setMatricula,
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
          placeholder="Matrícula"
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
          placeholder="Nome completo"
          maxLength={50}
          value={nome}
          onChange={e=>setNome(e.target.value)}
        />

        <select
          className="corporateInput"
          value={linha}
          onChange={e=>setLinha(e.target.value)}
        >
          <option value="">Selecionar modelo (Opcional)</option>
          {lines.map((line: any) => (
            <option key={line.id} value={line.nome}>{line.nome}</option>
          ))}
        </select>

        <select
          className="corporateInput"
          value={posto}
          onChange={e=>setPosto(e.target.value)}
        >
          <option value="">Selecionar posto (Opcional)</option>
          {workstations.map((ws: any) => (
            <option key={ws.id} value={ws.nome}>{ws.nome}</option>
          ))}
        </select>
      </div>

      <button
        className="primaryButton fullWidth mt-3"
        onClick={handleCreateOperator}
        disabled={!nome || matricula.length !== 6}
      >
        Cadastrar Operador
      </button>
    </div>
  )
}