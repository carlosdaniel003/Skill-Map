// src/components/operators/visual/OperatorRow.tsx
"use client"

import "./OperatorRow.css"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props{
  operator:any
  lines:any[]
  workstations:any[]

  onRemove:(id:string)=>void
  onChangeLine:(operatorId:string,linha:string,posto:string)=>void
  onChangePosto:(operatorId:string,linha:string,posto:string)=>void
}

export default function OperatorRow({
  operator,
  lines,
  workstations,
  onRemove,
  onChangeLine,
  onChangePosto
}:Props){

  const router = useRouter()

  const [editing,setEditing] = useState(false)

  const [linha,setLinha] = useState(operator.linha_atual || "")
  const [posto,setPosto] = useState(operator.posto_atual || "")

  function handleSave(){
    onChangeLine(operator.id,linha,posto)
    setEditing(false)
  }

  function handleCancel(){
    setLinha(operator.linha_atual || "")
    setPosto(operator.posto_atual || "")
    setEditing(false)
  }

  function openHistory(){
    router.push(`/operators/history/${operator.id}`)
  }

  function openSkills(){
    router.push(`/operators/skills/${operator.id}`)
  }

  return(

    <tr className={editing ? "editingRow" : ""}>

      <td className="fontWeight600">{operator.matricula}</td>

      <td className="operatorName">{operator.nome}</td>

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
          <span className={!operator.posto_atual ? "emptyText" : ""}>
            {operator.posto_atual || "Não alocado"}
          </span>
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
                title="Editar locação"
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