"use client"

import "./OperatorRow.css"
import { useState } from "react"

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

  return(

    <tr>

      <td>{operator.matricula}</td>

      <td>{operator.nome}</td>

      <td>

        {editing ? (

          <select
            value={linha}
            onChange={e=>setLinha(e.target.value)}
          >

            {lines.map(line=>(
              <option key={line.id} value={line.nome}>
                {line.nome}
              </option>
            ))}

          </select>

        ) : (

          operator.linha_atual || "-"

        )}

      </td>

      <td>

        {editing ? (

          <select
            value={posto}
            onChange={e=>setPosto(e.target.value)}
          >

            {workstations.map(ws=>(
              <option key={ws.id} value={ws.nome}>
                {ws.nome}
              </option>
            ))}

          </select>

        ) : (

          operator.posto_atual || "-"

        )}

      </td>

      <td className="actions">

        {editing ? (

          <>

            <button onClick={handleSave}>
              Salvar
            </button>

            <button onClick={handleCancel}>
              Cancelar
            </button>

          </>

        ) : (

          <>

            <button
              onClick={()=>setEditing(true)}
            >
              Editar
            </button>

            <button
              onClick={()=>onRemove(operator.id)}
            >
              Remover
            </button>

          </>

        )}

      </td>

    </tr>

  )

}