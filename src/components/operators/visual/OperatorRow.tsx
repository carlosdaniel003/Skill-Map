// src/components/operators/visual/OperatorRow.tsx
"use client"

import "./OperatorRow.css"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Importamos a função que busca a dificuldade no banco
import { getLineSkillDifficulties } from "@/services/database/operatorRepository"

interface Props{
  operator:any
  lines:any[]
  workstations:any[]

  onRemove:(id:string)=>void
  // 🆕 A interface agora exige o turno
  onChangeLine:(operatorId:string, linha:string, posto:string, turno:string)=>void 
}

export default function OperatorRow({
  operator,
  lines,
  workstations,
  onRemove,
  onChangeLine
}:Props){

  const router = useRouter()

  const [editing,setEditing] = useState(false)
  const [dificuldade, setDificuldade] = useState<number | null>(null)

  const [linha,setLinha] = useState(operator.linha_atual || "")
  const [posto,setPosto] = useState(operator.posto_atual || "")
  const [turno,setTurno] = useState(operator.turno || "") // 🆕 Novo estado

  // Busca a dificuldade atual daquele posto naquela linha específica
  useEffect(() => {
    async function fetchDifficulty() {
      if (operator.linha_atual && operator.posto_atual) {
        const diffs = await getLineSkillDifficulties(operator.linha_atual)
        setDificuldade(diffs[operator.posto_atual] || 1) // Se não tiver configurado, assume 1 (Simples)
      } else {
        setDificuldade(null)
      }
    }
    fetchDifficulty()
  }, [operator.linha_atual, operator.posto_atual])

  function handleSave(){
    // 🆕 Passa o turno atualizado
    onChangeLine(operator.id, linha, posto, turno)
    setEditing(false)
  }

  function handleCancel(){
    setLinha(operator.linha_atual || "")
    setPosto(operator.posto_atual || "")
    setTurno(operator.turno || "") // 🆕 Reseta o turno
    setEditing(false)
  }

  function openHistory(){
    router.push(`/operators/history/${operator.id}`)
  }

  function openSkills(){
    router.push(`/operators/skills/${operator.id}`)
  }

  function renderDifficultyBadge(level: number) {
    if (level === 1) return <span className="rowDiffBadge diff-simple">Simples</span>
    if (level === 2) return <span className="rowDiffBadge diff-medium">Médio</span>
    if (level === 3) return <span className="rowDiffBadge diff-complex">Complexo</span>
    return null
  }

  return(

    <tr className={editing ? "editingRow" : ""}>

      <td className="fontWeight600">{operator.matricula}</td>

      <td className="operatorName">{operator.nome}</td>

      {/* 🆕 COLUNA DO TURNO */}
      <td>
        {editing ? (
          <select
            className="corporateSelect smallSelect"
            value={turno}
            onChange={e=>setTurno(e.target.value)}
          >
            <option value="Comercial">Comercial</option>
            <option value="2º Turno estendido">2º Turno estendido</option>
          </select>
        ) : (
          <span style={{
            backgroundColor: '#f0f0f0', 
            color: '#555', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: 600 
          }}>
            {operator.turno || "Não Definido"}
          </span>
        )}
      </td>

      {/* COLUNA DO MODELO (LINHA) */}
      <td>
        {editing ? (
          <select
            className="corporateSelect smallSelect"
            value={linha}
            onChange={e=>setLinha(e.target.value)}
          >
            <option value="">Nenhuma</option>
            {lines.map(line=>(
              <option key={line.id} value={line.nome}>
                {line.nome}
              </option>
            ))}
          </select>
        ) : (
          <span className={!operator.linha_atual ? "emptyText" : ""}>
            {operator.linha_atual || "Não alocado"}
          </span>
        )}
      </td>

      {/* COLUNA DO POSTO (SKILL) + DIFICULDADE */}
      <td>
        {editing ? (
          <select
            className="corporateSelect smallSelect"
            value={posto}
            onChange={e=>setPosto(e.target.value)}
          >
            <option value="">Nenhum</option>
            {workstations.map(ws=>(
              <option key={ws.id} value={ws.nome}>
                {ws.nome}
              </option>
            ))}
          </select>
        ) : (
          <div className="postoContainer">
            <span className={!operator.posto_atual ? "emptyText" : "postoName"}>
              {operator.posto_atual || "Não alocado"}
            </span>
            {operator.posto_atual && dificuldade && renderDifficultyBadge(dificuldade)}
          </div>
        )}
      </td>

      <td className="actionsCell">
        <div className="actionGroup">
          
          {editing ? (
            <>
              <button 
                className="actionIconBtn saveBtn" 
                onClick={handleSave}
                title="Salvar alterações"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </button>

              <button 
                className="actionIconBtn cancelBtn" 
                onClick={handleCancel}
                title="Cancelar edição"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button 
                className="actionIconBtn editBtn" 
                onClick={()=>setEditing(true)}
                title="Editar locação e turno"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </button>

              <div className="divider"></div>

              <button 
                className="actionIconBtn textBtn" 
                onClick={openSkills}
                title="Ver Habilidades (Skills)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span>Skills</span>
              </button>

              <button 
                className="actionIconBtn textBtn" 
                onClick={openHistory}
                title="Ver Histórico"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M12 7v5l4 2"/>
                </svg>
                <span>Histórico</span>
              </button>

              <div className="divider"></div>

              <button 
                className="actionIconBtn deleteBtn" 
                onClick={()=>onRemove(operator.id)}
                title="Desativar Operador"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" x2="10" y1="11" y2="17"/>
                  <line x1="14" x2="14" y1="11" y2="17"/>
                </svg>
              </button>
            </>
          )}

        </div>
      </td>

    </tr>

  )

}