"use client"

import "./page.css"
import { useState } from "react"
import OperatorTable from "@/components/operators/OperatorTable"

export default function OperatorsPage(){

  const [operators,setOperators] = useState<any[]>([])

  function removeOperator(id:string){

    setOperators(
      operators.filter(op=>op.id !== id)
    )

  }

  return(

    <div className="page">

      <h1>Operadores</h1>

      <OperatorTable
        operators={operators}
        onRemove={removeOperator}
      />

    </div>

  )

}