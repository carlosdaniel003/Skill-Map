// src/app/(system)/operators/hooks/useOperators.ts
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  getOperators,
  addOperator,
  deactivateOperator,
  getProductionLines,
  getWorkstations,
  changeOperatorPosition
} from "@/services/database/operatorRepository"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export function useOperators() {
  const router = useRouter()
  const sessionUser = getSession()

  // DADOS DO BANCO
  const [operators, setOperators] = useState<any[]>([])
  const [lines, setLines] = useState<any[]>([])
  const [workstations, setWorkstations] = useState<any[]>([])

  // ESTADOS DO FORMULÁRIO DE CADASTRO
  const [nome, setNome] = useState("")
  const [matricula, setMatricula] = useState("")
  const [linha, setLinha] = useState("")
  const [posto, setPosto] = useState("")

  // ESTADOS DOS FILTROS
  const [searchMatricula, setSearchMatricula] = useState("")
  const [searchNome, setSearchNome] = useState("")
  const [filterLinha, setFilterLinha] = useState("")
  const [filterPosto, setFilterPosto] = useState("")

  // MODAIS
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)

  useEffect(() => {
    loadOperators()
    loadLines()
    loadWorkstations()
  }, [])

  async function loadOperators(){
    const data = await getOperators()
    setOperators(data)
  }

  async function loadLines(){
    const data = await getProductionLines()
    setLines(data)
  }

  async function loadWorkstations(){
    const data = await getWorkstations()
    setWorkstations(data)
  }

  // --- AÇÕES DO FORMULÁRIO ---
  async function handleCreateOperator(){
    if(!nome || matricula.length !== 6){
      setAlertConfig({ title: "Campos Obrigatórios", message: "A matricula deve conter exatamente 6 dígitos." })
      return
    }

    try{
      await addOperator({
        nome,
        matricula,
        linha_atual: linha,
        posto_atual: posto
      })

      const detalhesAlocacao = (linha || posto) ? ` na linha ${linha || '-'} e posto ${posto || '-'}` : ''
      await logAction(
        sessionUser?.username || "sistema", 
        "operator_create", 
        `Cadastrou o operador: ${nome} (${matricula})${detalhesAlocacao}`
      )

      setNome("")
      setMatricula("")
      setLinha("")
      setPosto("")
      loadOperators()

      setAlertConfig({ title: "Operador cadastrado", message: "O operador foi cadastrado com sucesso." })
    }catch(error: any){
      if(error.message === "MATRICULA_EXISTS"){
        setAlertConfig({ title: "Matrícula duplicada", message: "Já existe um operador cadastrado com essa matrícula." })
      }else{
        setAlertConfig({ title: "Erro", message: "Não foi possível cadastrar o operador." })
      }
    }
  }

  // --- AÇÕES DA TABELA ---
  function handleRemoveOperator(id: string){
    const operadorAlvo = operators.find(op => op.id === id)

    setConfirmConfig({
      title: "Desativar Operador",
      message: `Tem certeza que deseja desativar ${operadorAlvo?.nome || 'este operador'}? Ele será movido para a lista de inativos.`,
      onConfirm: async () => {
        await deactivateOperator(id)
        if(operadorAlvo) {
          await logAction(
            sessionUser?.username || "sistema", 
            "operator_deactivate", 
            `Desativou/Demitou o operador: ${operadorAlvo.nome} (${operadorAlvo.matricula})`
          )
        }
        loadOperators()
      }
    })
  }

  async function handleChangePosition(operatorId: string, novaLinha: string, novoPosto: string){
    const operadorAlvo = operators.find(op => op.id === operatorId)

    await changeOperatorPosition(operatorId, novaLinha, novoPosto)

    if(operadorAlvo) {
      await logAction(
        sessionUser?.username || "sistema", 
        "operator_change_position", 
        `Moveu ${operadorAlvo.nome} (${operadorAlvo.matricula}) para: ${novaLinha || 'Nenhuma linha'} / ${novoPosto || 'Nenhum posto'}`
      )
    }
    loadOperators()
  }

  // --- LÓGICA DE FILTRAGEM ---
  const filteredOperators = operators.filter(op => {
    const matchMatricula = op.matricula?.toLowerCase().includes(searchMatricula.toLowerCase())
    const matchNome = op.nome?.toLowerCase().includes(searchNome.toLowerCase())
    const matchLinha = filterLinha === "" || op.linha_atual === filterLinha
    const matchPosto = filterPosto === "" || op.posto_atual === filterPosto

    return matchMatricula && matchNome && matchLinha && matchPosto
  })

  return {
    modals: { alertConfig, setAlertConfig, confirmConfig, setConfirmConfig },
    form: {
      nome, setNome,
      matricula, setMatricula,
      linha, setLinha,
      posto, setPosto,
      lines, workstations,
      handleCreateOperator
    },
    filters: {
      searchMatricula, setSearchMatricula,
      searchNome, setSearchNome,
      filterLinha, setFilterLinha,
      filterPosto, setFilterPosto,
      lines, workstations
    },
    table: {
      filteredOperators, lines, workstations,
      handleRemoveOperator, handleChangePosition
    },
    navigation: {
      goToModels: () => router.push("/operators/models"),
      goToSkills: () => router.push("/operators/skills"),
      goToInactive: () => router.push("/operators/inactive")
    }
  }
}