// src/app/(system)/operators/inactive/page.tsx
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
    if(!confirm("Deseja realmente reativar este operador?")) return

    await activateOperator(id)
    loadInactiveOperators()
  }

  function handleBack(){
    router.push("/operators")
  }

  if(loading){
    return (
      <div className="inactivePage">
        <div className="loadingState">
          <div className="pageLoader"/>
        </div>
      </div>
    )
  }

  return(

    <div className="inactivePage">

      <div className="pageHeader">
        <button className="backButton" onClick={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>

        <div className="headerTitle">
          <h1 className="pageTitle">Operadores Desativados</h1>
          <p className="pageSubtitle">Visualize e reative operadores que foram desligados ou afastados.</p>
        </div>
      </div>

      <div className="corporateCard">
        
        <div className="tableContainer">
          <table className="corporateTable">

            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome Completo</th>
                <th>Última Linha</th>
                <th>Último Posto</th>
                <th className="actionColumn">Ações</th>
              </tr>
            </thead>

            <tbody>
              {operators.length > 0 ? (
                operators.map(op => (
                  <tr key={op.id}>
                    <td className="fontWeight600">{op.matricula}</td>
                    <td>{op.nome}</td>
                    <td>
                      <span className={!op.linha_atual ? "emptyText" : ""}>
                        {op.linha_atual || "Não alocado"}
                      </span>
                    </td>
                    <td>
                      <span className={!op.posto_atual ? "emptyText" : ""}>
                        {op.posto_atual || "Não alocado"}
                      </span>
                    </td>
                    <td className="actionColumn">
                      <button
                        className="reactivateButton"
                        onClick={()=>handleActivate(op.id)}
                        title="Reativar Operador"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                        </svg>
                        Reativar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="emptyState">
                    Nenhum operador desativado no momento.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

    </div>

  )

}