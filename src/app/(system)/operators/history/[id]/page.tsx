"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import {
  getProductionLines,
  getWorkstations,
  addOperatorExperience,
  getFullOperatorHistory,
  deleteOperatorExperience,
  deactivateOperatorExperience,
  activateOperatorExperience,
  getOperators,
  deactivateOperatorHistory,
  activateOperatorHistory
} from "@/services/database/operatorRepository"

export default function OperatorHistoryPage(){

  const params = useParams()
  const router = useRouter()

  const operatorId = params.id as string

  const [operator,setOperator] = useState<any>(null)

  const [lines,setLines] = useState<any[]>([])
  const [workstations,setWorkstations] = useState<any[]>([])
  const [history,setHistory] = useState<any[]>([])

  const [showInactive,setShowInactive] = useState(false)

  const [linha,setLinha] = useState("")
  const [posto,setPosto] = useState("")
  const [dataInicio,setDataInicio] = useState("")
  const [dataFim,setDataFim] = useState("")
  const [skill,setSkill] = useState(1)

  useEffect(()=>{

    loadOperator()
    loadLines()
    loadWorkstations()
    loadHistory()

  },[])

async function handleDeactivate(id:string, origem:string){

  if(!confirm("Desativar experiência?")) return

  if(origem === "movimentacao"){

    await deactivateOperatorHistory(id)

  }else{

    await deactivateOperatorExperience(id)

  }

  loadHistory()

}

async function handleActivate(id:string, origem:string){

  if(origem === "movimentacao"){

    await activateOperatorHistory(id)

  }else{

    await activateOperatorExperience(id)

  }

  loadHistory()

}

  async function loadOperator(){

    const operators = await getOperators()

    const op = operators.find((o:any)=>o.id === operatorId)

    setOperator(op)

  }

  async function loadLines(){

    const data = await getProductionLines()
    setLines(data)

  }

  async function loadWorkstations(){

    const data = await getWorkstations()
    setWorkstations(data)

  }

  async function loadHistory(){

    const data = await getFullOperatorHistory(operatorId)
    setHistory(data)

  }

  function calculateMonths(start:string,end?:string){

  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()

  const years = endDate.getFullYear() - startDate.getFullYear()
  const months = endDate.getMonth() - startDate.getMonth()

  return years * 12 + months

}

  function translateOrigin(origem:string){

    if(origem === "movimentacao") return "Movimentação"

    if(origem === "experiencia") return "Entrevista"

    return "-"

  }

  async function handleSave(){

    const today =
      new Date().toISOString().split("T")[0]

    if(!linha || !posto || !dataInicio){

      alert("Preencha linha, posto e data início")
      return

    }

    if(dataInicio > today){

      alert("Data início não pode ser no futuro")
      return

    }

    if(dataFim && dataFim < dataInicio){

      alert("Data fim não pode ser menor que data início")
      return

    }

    if(dataFim && dataFim > today){

      alert("Data fim não pode ser no futuro")
      return

    }

    for(const exp of history){

      const inicioExistente =
        new Date(exp.data_inicio)

      const fimExistente =
        exp.data_fim
          ? new Date(exp.data_fim)
          : new Date()

      const inicioNovo =
        new Date(dataInicio)

      const fimNovo =
        dataFim
          ? new Date(dataFim)
          : new Date()

      const overlap =
        inicioNovo <= fimExistente &&
        fimNovo >= inicioExistente

      if(overlap){

        alert(
          "Já existe experiência registrada neste período"
        )

        return

      }

    }

    await addOperatorExperience({

      operator_id:operatorId,
      linha,
      posto,
      data_inicio:dataInicio,
      data_fim:dataFim || undefined,
      skill_level:skill

    })

    setLinha("")
    setPosto("")
    setDataInicio("")
    setDataFim("")
    setSkill(1)

    loadHistory()

  }

  async function handleRemove(id:string){

    if(!confirm("Remover experiência?")) return

    await deleteOperatorExperience(id)

    loadHistory()

  }

  function handleBack(){

    router.push("/operators")

  }

  return(

    <div className="page">

      <div className="historyHeader">

        <button onClick={handleBack}>
          ← Voltar
        </button>

        {operator && (

          <div className="operatorInfo">

            <h1>{operator.nome}</h1>

            <span>
              Matrícula: {operator.matricula}
            </span>

          </div>

        )}

      </div>

      <h2>Histórico do Operador</h2>

      <div className="historyForm">

        <select
          value={linha}
          onChange={e=>setLinha(e.target.value)}
        >

          <option value="">
            Selecionar linha
          </option>

          {lines.map(line => (

            <option key={line.id} value={line.nome}>
              {line.nome}
            </option>

          ))}

        </select>

        <select
          value={posto}
          onChange={e=>setPosto(e.target.value)}
        >

          <option value="">
            Selecionar posto
          </option>

          {workstations.map(ws => (

            <option key={ws.id} value={ws.nome}>
              {ws.nome}
            </option>

          ))}

        </select>

        <input
          type="date"
          value={dataInicio}
          onChange={e=>setDataInicio(e.target.value)}
        />

        <input
          type="date"
          value={dataFim}
          onChange={e=>setDataFim(e.target.value)}
        />

        <select
          value={skill}
          onChange={e=>setSkill(Number(e.target.value))}
        >

          <option value={1}>Nível 1</option>
          <option value={2}>Nível 2</option>
          <option value={3}>Nível 3</option>
          <option value={4}>Nível 4</option>
          <option value={5}>Nível 5</option>

        </select>

        <button onClick={handleSave}>
          Adicionar experiência
        </button>

      </div>

      <h2>Experiências Registradas</h2>

      <button
        onClick={loadHistory}
        className="secondaryButton"
      >
        Atualizar histórico
      </button>

      <button
        onClick={()=>setShowInactive(!showInactive)}
        className="secondaryButton"
      >
        {showInactive ? "Ver Ativas" : "Ver Desativadas"}
      </button>

      <table className="historyTable">

        <thead>

          <tr>

            <th>Linha</th>
            <th>Posto</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Tempo</th>
            <th>Nível</th>
            <th>Origem</th>
            <th>Ações</th>

          </tr>

        </thead>

        <tbody>

          {history
          .filter((exp:any)=>{

            if(showInactive)
              return exp.ativo === false

            return exp.ativo !== false

          })
          .map((exp:any)=>{

            const months =
              calculateMonths(
                exp.data_inicio,
                exp.data_fim
              )

            return(

              <tr
                key={exp.id}
                style={{
                  opacity: exp.ativo === false ? 0.5 : 1
                }}
              >

                <td>{exp.linha}</td>

                <td>{exp.posto}</td>

                <td>
                  {new Date(exp.data_inicio)
                    .toLocaleDateString()}
                </td>

                <td>
                  {exp.data_fim
                    ? new Date(exp.data_fim)
                        .toLocaleDateString()
                    : "Atual"}
                </td>

                <td>
                  {months} meses
                </td>

                <td>
                  {exp.skill_level ?? "-"}
                </td>

                <td>
                  {translateOrigin(exp.origem)}
                </td>

                <td>

  {exp.id && (

  exp.ativo === false ? (

    <button
      onClick={()=>handleActivate(exp.id, exp.origem)}
    >
      Reativar
    </button>

  ) : (

    <button
      onClick={()=>handleDeactivate(exp.id, exp.origem)}
    >
      Desativar
    </button>

  )

)}

</td>

              </tr>

            )

          })}

        </tbody>

      </table>

    </div>

  )

}