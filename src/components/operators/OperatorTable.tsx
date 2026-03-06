"use client"

import "./OperatorTable.css"
import OperatorRow from "./visual/OperatorRow"

interface Props{

  operators:any[]
  onRemove:(id:string)=>void

}

export default function OperatorTable({operators,onRemove}:Props){

  return(

    <table className="operatorTable">

      <thead>

        <tr>

          <th>Matricula</th>
          <th>Nome</th>
          <th>Linha</th>
          <th>Ações</th>

        </tr>

      </thead>

      <tbody>

        {operators.map(op=>(
          <OperatorRow
            key={op.id}
            operator={op}
            onRemove={onRemove}
          />
        ))}

      </tbody>

    </table>

  )

}