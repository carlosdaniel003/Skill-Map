"use client"

import "./page.css"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  activateOperator
} from "@/services/database/operatorRepository"

import { supabase } from "@/services/database/supabaseClient"

export default function InactiveOperatorsPage(){

  const router = useRouter()

  const [operators,setOperators] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    loadInactiveOperators()

  },[])

  async function loadInactiveOperators(){

    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("ativo",false)
      .order("nome")

    if(error){

      console.error(error)
      return

    }

    setOperators(data || [])
    setLoading(false)

  }

  async function handleActivate(id:string){

    if(!confirm("Reativar operador?")) return

    await activateOperator(id)

    loadInactiveOperators()

  }

  function handleBack(){

    router.push("/operators")

  }

  if(loading){

    return <div className="page">Carregando...</div>

  }

  return(

    <div className="page">

      <div className="pageHeader">

        <button onClick={handleBack}>
          ← Voltar
        </button>

        <h1>Operadores Desativados</h1>

      </div>

      <table className="operatorTable">

        <thead>

          <tr>

            <th>Matrícula</th>
            <th>Nome</th>
            <th>Linha</th>
            <th>Posto</th>
            <th>Ações</th>

          </tr>

        </thead>

        <tbody>

          {operators.map(op => (

            <tr key={op.id}>

              <td>{op.matricula}</td>

              <td>{op.nome}</td>

              <td>{op.linha_atual || "-"}</td>

              <td>{op.posto_atual || "-"}</td>

              <td>

                <button
                  onClick={()=>handleActivate(op.id)}
                >
                  Reativar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}