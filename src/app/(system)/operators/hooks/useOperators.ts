// src/app/(system)/operators/hooks/useOperators.ts
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  getOperators,
  addOperator,
  deactivateOperator,
  getProductionLines,
  getWorkstations,
  changeOperatorPosition,
  getLineSkillDifficulties 
} from "@/services/database/operatorRepository"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

export function useOperators() {
  const router = useRouter()
  const sessionUser = getSession()

  // DADOS DO BANCO GLOBAIS (Fonte da Verdade Imutável)
  const [operators, setOperators] = useState<any[]>([])
  const [lines, setLines] = useState<any[]>([])
  const [workstations, setWorkstations] = useState<any[]>([])

  // LISTAS DINÂMICAS PARA OS DROPDOWNS DO FORMULÁRIO
  const [formLines, setFormLines] = useState<any[]>([])
  const [formWorkstations, setFormWorkstations] = useState<any[]>([])
  
  // LISTAS DINÂMICAS PARA OS DROPDOWNS DOS FILTROS
  const [filterLines, setFilterLines] = useState<any[]>([])
  const [filterWorkstations, setFilterWorkstations] = useState<any[]>([])

  // ESTADOS DO FORMULÁRIO DE CADASTRO
  const [nome, setNome] = useState("")
  const [matricula, setMatricula] = useState("")
  const [turno, setTurno] = useState("")
  const [linha, setLinha] = useState("")
  const [posto, setPosto] = useState("")

  // ESTADOS DOS FILTROS
  const [searchMatricula, setSearchMatricula] = useState("")
  const [searchNome, setSearchNome] = useState("")
  const [filterTurno, setFilterTurno] = useState("")
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
    setFormLines(data)
    setFilterLines(data)
  }

  async function loadWorkstations(){
    const data = await getWorkstations()
    setWorkstations(data)
    setFormWorkstations(data)
    setFilterWorkstations(data)
  }

  // =========================================================================
  // MÁGICA 1: Dropdowns Bidirecionais do FORMULÁRIO
  // =========================================================================
  useEffect(() => {
    async function syncFormKits() {
      // Cenário 1: Tudo vazio (Mostra tudo)
      if (!linha && !posto) {
        setFormWorkstations(workstations)
        setFormLines(lines)
        return
      }

      // Cenário 2: Tem Linha selecionada (Filtra postos)
      if (linha) {
        const diffs = await getLineSkillDifficulties(linha)
        const allowedPostos = Object.keys(diffs)
        
        setFormWorkstations(workstations.filter(w => allowedPostos.includes(w.nome)))
        setFormLines(lines) 
        
        // Limpa o posto selecionado se não for válido para a nova linha
        setPosto(prev => allowedPostos.includes(prev) ? prev : "")
        return
      }

      // Cenário 3: Tem Posto selecionado, mas não Linha (Filtra linhas usando Promise.all para evitar gargalo)
      if (posto && !linha) {
        setFormWorkstations(workstations) 
        
        const linhasValidas = []
        // Dispara as consultas em paralelo para ser mais rápido
        const checks = await Promise.all(
          lines.map(async (l) => {
            const diffs = await getLineSkillDifficulties(l.nome)
            return {
              linha: l,
              temPosto: Object.keys(diffs).includes(posto)
            }
          })
        )

        for (const check of checks) {
          if (check.temPosto) {
            linhasValidas.push(check.linha)
          }
        }
        
        setFormLines(linhasValidas)
      }
    }
    
    if (lines.length > 0 && workstations.length > 0) {
      syncFormKits()
    }
  }, [linha, posto, lines, workstations]) 

  // =========================================================================
  // MÁGICA 2: Dropdowns Bidirecionais dos FILTROS
  // =========================================================================
  useEffect(() => {
    async function syncFilterKits() {
      if (!filterLinha && !filterPosto) {
        setFilterWorkstations(workstations)
        setFilterLines(lines)
        return
      }

      if (filterLinha) {
        const diffs = await getLineSkillDifficulties(filterLinha)
        const allowedPostos = Object.keys(diffs)
        
        setFilterWorkstations(workstations.filter(w => allowedPostos.includes(w.nome)))
        setFilterLines(lines)
        
        setFilterPosto(prev => allowedPostos.includes(prev) ? prev : "")
        return
      }

      if (filterPosto && !filterLinha) {
        setFilterWorkstations(workstations)
        
        const linhasValidas = []
        // Promise.all aqui também
        const checks = await Promise.all(
          lines.map(async (l) => {
            const diffs = await getLineSkillDifficulties(l.nome)
            return {
              linha: l,
              temPosto: Object.keys(diffs).includes(filterPosto)
            }
          })
        )

        for (const check of checks) {
          if (check.temPosto) {
            linhasValidas.push(check.linha)
          }
        }

        setFilterLines(linhasValidas)
      }
    }
    
    if (lines.length > 0 && workstations.length > 0) {
      syncFilterKits()
    }
  }, [filterLinha, filterPosto, lines, workstations])


  // --- AÇÕES DO FORMULÁRIO ---
  async function handleCreateOperator(){
    if(!nome || matricula.length !== 6 || !turno || !linha || !posto){ 
      setAlertConfig({ title: "Campos Obrigatórios", message: "Todos os campos (Matrícula, Nome, Turno, Modelo e Posto) são obrigatórios." })
      return
    }

    try{
      await addOperator({
        nome,
        matricula,
        turno,
        linha_atual: linha,
        posto_atual: posto
      })

      await logAction(
        sessionUser?.username || "sistema", 
        "operator_create", 
        `Cadastrou o operador: ${nome} (${matricula}) no ${turno} na linha ${linha} e posto ${posto}`
      )

      setNome("")
      setMatricula("")
      setTurno("")
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

 async function handleChangePosition(operatorId: string, novaLinha: string, novoPosto: string, novoTurno: string){
    const operadorAlvo = operators.find(op => op.id === operatorId)

    await changeOperatorPosition(operatorId, novaLinha, novoPosto, novoTurno)

    if(operadorAlvo) {
      await logAction(
        sessionUser?.username || "sistema", 
        "operator_change_position", 
        `Moveu ${operadorAlvo.nome} (${operadorAlvo.matricula}) para: ${novaLinha || 'Nenhuma linha'} / ${novoPosto || 'Nenhum posto'} no ${novoTurno}`
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
    const matchTurno = filterTurno === "" || op.turno === filterTurno

    return matchMatricula && matchNome && matchLinha && matchPosto && matchTurno
  })

  return {
    modals: { alertConfig, setAlertConfig, confirmConfig, setConfirmConfig },
    form: {
      nome, setNome,
      matricula, setMatricula,
      turno, setTurno,
      linha, setLinha,
      posto, setPosto,
      lines: formLines,             
      workstations: formWorkstations, 
      handleCreateOperator
    },
    filters: {
      searchMatricula, setSearchMatricula,
      searchNome, setSearchNome,
      filterTurno, setFilterTurno,
      filterLinha, setFilterLinha,
      filterPosto, setFilterPosto,
      lines: filterLines,             
      workstations: filterWorkstations  
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