// src\services\database\operatorRepository.ts
import { supabase } from "./supabaseClient"

export interface Operator{

  id?:string
  matricula:string
  nome:string
  linha_atual:string
  posto_atual:string

}

export async function updateWorkstationOrder(
  id:string,
  ordem:number
){

  const { error } = await supabase
    .from("workstations")
    .update({ ordem })
    .eq("id",id)

  if(error){
    console.error(error)
    throw error
  }

}

export async function updateProductionLineOrder(
  id:string,
  ordem:number
){

  const { error } = await supabase
    .from("production_lines")
    .update({ ordem })
    .eq("id",id)

  if(error){
    console.error(error)
    throw error
  }

}

/* LISTAR TODOS OS MODELOS */

export async function getAllProductionLines(){

  const { data,error } = await supabase
    .from("production_lines")
    .select("*")
    .order("ordem",{ ascending:true })

  if(error){
    console.error(error)
    return []
  }

  return data || []

}


/* CRIAR MODELO */

export async function createProductionLine(nome:string,categoria:string){

  const { data,error } = await supabase
    .from("production_lines")
    .insert({
      nome,
      categoria,
      ativo:true
    })
    .select()

  if(error){
    console.error(error)
    throw error
  }

  return data

}

/* CRIAR SKILL */

export async function createWorkstation(nome:string){

  const { error } = await supabase
    .from("workstations")
    .insert({
      nome,
      ativo:true
    })

  if(error){
    console.error(error)
    throw error
  }

}


/* ATUALIZAR SKILL */

export async function updateWorkstation(
  id:string,
  nome:string
){

  const { error } = await supabase
    .from("workstations")
    .update({
      nome
    })
    .eq("id",id)

  if(error){
    console.error(error)
    throw error
  }

}


/* ATIVAR / DESATIVAR SKILL */

export async function toggleWorkstation(
  id:string,
  ativo:boolean
){

  const { error } = await supabase
    .from("workstations")
    .update({
      ativo
    })
    .eq("id",id)

  if(error){
    console.error(error)
    throw error
  }

}

export async function toggleProductionLineActive(
  id:string,
  ativo:boolean
){

  const { error } = await supabase
    .from("production_lines")
    .update({ ativo })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

export async function getAllWorkstations(){

  const { data, error } = await supabase
    .from("workstations")
    .select("*")
    .order("ordem", { ascending: true })

  if(error){
    console.error(error)
    return []
  }

  return data || []

}

/* ATUALIZAR MODELO */

export async function updateProductionLine(
  id:string,
  nome:string,
  categoria:string
){

  const { error } = await supabase
    .from("production_lines")
    .update({
      nome,
      categoria
    })
    .eq("id",id)

  if(error){
    console.error(error)
    throw error
  }

}

export interface OperatorExperience{

  id?:string
  operator_id:string
  linha:string
  posto:string
  data_inicio:string
  data_fim?:string
  skill_level?:number

}

export async function recalculateOperatorSkills(operatorId:string){

  const { data:history } = await supabase
    .from("operator_history")
    .select("*")
    .eq("operator_id",operatorId)
    .eq("ativo",true)

  if(!history) return

  const postoTempo:Record<string,number> = {}
  const postoUltimaExecucao:Record<string,Date> = {}

  for(const h of history){

    const inicio = new Date(h.data_inicio)
    const fim = h.data_fim ? new Date(h.data_fim) : new Date()

    const diff =
      (fim.getTime() - inicio.getTime()) /
      (1000*60*60*24*30)

    if(!postoTempo[h.posto]){
      postoTempo[h.posto] = 0
    }

    postoTempo[h.posto] += diff

    const ultima = postoUltimaExecucao[h.posto]

    if(!ultima || fim > ultima){
      postoUltimaExecucao[h.posto] = fim
    }

  }

  const { data:skills } = await supabase
    .from("operator_skills")
    .select("*")
    .eq("operator_id",operatorId)

  if(!skills) return

  const now = new Date()

  for(const skill of skills){

    const months = postoTempo[skill.posto] || 0

    let calculatedLevel = 1

    if(months >= 24) calculatedLevel = 5
    else if(months >= 12) calculatedLevel = 4
    else if(months >= 6) calculatedLevel = 3
    else if(months >= 3) calculatedLevel = 2

    /* DECAY */

    const ultimaExecucao = postoUltimaExecucao[skill.posto]

    if(ultimaExecucao){

      const monthsSinceLast =
        (now.getTime() - ultimaExecucao.getTime()) /
        (1000*60*60*24*30)

      if(monthsSinceLast >= 18) calculatedLevel -= 3
      else if(monthsSinceLast >= 12) calculatedLevel -= 2
      else if(monthsSinceLast >= 6) calculatedLevel -= 1

    }

    if(calculatedLevel < 1){
      calculatedLevel = 1
    }

    if(calculatedLevel !== skill.skill_level){

      await supabase
        .from("operator_skills")
        .update({
          skill_level:calculatedLevel
        })
        .eq("id",skill.id)

      await supabase
        .from("operator_skills_history")
        .insert({

          operator_id:operatorId,
          posto:skill.posto,
          skill_level:calculatedLevel,
          previous_level:skill.skill_level

        })

    }

  }

}

export async function activateOperatorHistory(id:string){

  const { error } = await supabase
    .from("operator_history")
    .update({
      ativo:true
    })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

export async function deactivateOperatorHistory(id:string){

  const { error } = await supabase
    .from("operator_history")
    .update({
      ativo:false
    })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* LISTAR POSTOS */

export async function getWorkstations(){

  const { data, error } = await supabase
    .from("workstations")
    .select("*")
    .eq("ativo",true)
    .order("ordem", { ascending: true })

  if(error){

    console.error("Supabase error:", error?.message, error)
    return []

  }

  return data || []

}

/* LISTAR LINHAS */

export async function getProductionLines(){

  const { data, error } = await supabase
    .from("production_lines")
    .select("*")
    .eq("ativo",true)
    .order("nome")

  if(error){

    console.error(error)
    return []

  }

  return data || []

}

/* LISTAR OPERADORES ATIVOS */

export async function getOperators(){

  const { data, error } = await supabase
    .from("operators")
    .select("*")
    .eq("ativo",true)
    .order("nome")

  if(error){

    console.error(error)
    return []

  }

  return data || []

}

/* CRIAR OPERADOR + SKILLS + HISTÓRICO */

export async function addOperator(operator:Operator){

  /* verificar matrícula existente */

  const { data:existing } = await supabase
    .from("operators")
    .select("id")
    .eq("matricula", operator.matricula)
    .maybeSingle()

  if(existing){
    throw new Error("MATRICULA_EXISTS")
  }

  const { data, error } = await supabase
    .from("operators")
    .insert([operator])
    .select()
    .single()

  if(error){
    console.error(error)
    throw error
  }

  const operatorId = data.id

  /* gerar skills padrão */

  const { data:workstations, error:wsError } = await supabase
    .from("workstations")
    .select("*")
    .eq("ativo",true)

  if(wsError){
    console.error(wsError)
    throw wsError
  }

  const skills = (workstations || []).map((ws:any)=>({

    operator_id:operatorId,
    posto:ws.nome,
    skill_level:1

  }))

  if(skills.length > 0){
    await supabase
      .from("operator_skills")
      .insert(skills)
  }

  /* histórico inicial */

  await supabase
    .from("operator_history")
    .insert({
      operator_id:operatorId,
      linha:operator.linha_atual,
      posto:operator.posto_atual,
      data_inicio:new Date()
    })

  return data
}

/* MUDAR LINHA OU POSTO */

export async function changeOperatorPosition(
  operatorId:string,
  linha:string,
  posto:string
){

  const { data:operator, error:opError } = await supabase
    .from("operators")
    .select("*")
    .eq("id",operatorId)
    .single()

  if(opError){

    console.error(opError)
    throw opError

  }

  const linhaAtual = operator.linha_atual
  const postoAtual = operator.posto_atual

  if(linhaAtual === linha && postoAtual === posto){

    return

  }

  await supabase
    .from("operator_history")
    .update({
      data_fim:new Date()
    })
    .eq("operator_id",operatorId)
    .is("data_fim",null)

  await supabase
    .from("operators")
    .update({
      linha_atual:linha,
      posto_atual:posto
    })
    .eq("id",operatorId)

  const { error } = await supabase
    .from("operator_history")
    .insert({

      operator_id:operatorId,
      linha,
      posto,
      data_inicio:new Date()

    })

  if(error){

    console.error(error)
    throw error

  }

}

export async function getFullOperatorHistory(operatorId:string){

  const { data:history } = await supabase
    .from("operator_history")
    .select("*")
    .eq("operator_id",operatorId)

  const { data:experience } = await supabase
    .from("operator_experience")
    .select("*")
    .eq("operator_id",operatorId)

  const combined = [

    ...(history || []).map((h:any)=>({
      ...h,
      origem:"movimentacao",
      ativo: h.ativo ?? true
    })),

    ...(experience || []).map((e:any)=>({
      ...e,
      origem:"experiencia",
      ativo: e.ativo ?? true
    }))

  ]

  return combined.sort((a:any,b:any)=>
    new Date(b.data_inicio).getTime() -
    new Date(a.data_inicio).getTime()
  )

}

/* ADICIONAR EXPERIÊNCIA DA ENTREVISTA */

export async function addOperatorExperience(experience:OperatorExperience){

  const { data, error } = await supabase
    .from("operator_experience")
    .insert([experience])
    .select()

  if(error){

    console.error(error)
    throw error

  }

  return data

}

/* DESATIVAR EXPERIÊNCIA */

export async function deactivateOperatorExperience(id:string){

  const { error } = await supabase
    .from("operator_experience")
    .update({ ativo:false })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* REATIVAR EXPERIÊNCIA */

export async function activateOperatorExperience(id:string){

  const { error } = await supabase
    .from("operator_experience")
    .update({
      ativo:true
    })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* BUSCAR EXPERIÊNCIA DO OPERADOR */

export async function getOperatorExperience(operatorId:string){

  const { data, error } = await supabase
    .from("operator_experience")
    .select("*")
    .eq("operator_id",operatorId)
    .eq("ativo",true)
    .order("data_inicio",{ ascending:false })

  if(error){

    console.error(error)
    return []

  }

  return data || []

}

/* REMOVER EXPERIÊNCIA */

export async function deleteOperatorExperience(id:string){

  const { error } = await supabase
    .from("operator_experience")
    .delete()
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* DESATIVAR OPERADOR (SOFT DELETE) */

export async function deactivateOperator(id:string){

  const { error } = await supabase
    .from("operators")
    .update({
      ativo:false
    })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* REATIVAR OPERADOR */

export async function activateOperator(id:string){

  const { error } = await supabase
    .from("operators")
    .update({
      ativo:true
    })
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* ATUALIZAR OPERADOR */

export async function updateOperator(operator:Operator){

  const { error } = await supabase
    .from("operators")
    .update(operator)
    .eq("id",operator.id)

  if(error){

    console.error(error)
    throw error

  }

}

/* =========================================
   MATRIZ DE DIFICULDADE (LINHA x SKILL)
   ========================================= */

export async function getLineSkillDifficulties(linha: string) {
  const { data, error } = await supabase
    .from("line_skill_difficulty")
    .select("posto, dificuldade")
    .eq("linha", linha)

  if (error) {
    console.error("Erro ao buscar dificuldades:", error)
    return {}
  }

  // Transforma o array num objeto fácil de ler: { "Parafusamento": 3, "Solda": 5 }
  const map: Record<string, number> = {}
  data?.forEach(row => {
    map[row.posto] = row.dificuldade
  })
  
  return map
}

export async function saveLineSkillDifficulty(linha: string, posto: string, dificuldade: number) {
  const { error } = await supabase
    .from("line_skill_difficulty")
    .upsert({
      linha,
      posto,
      dificuldade
    }, { onConflict: "linha, posto" })

  if (error) {
    console.error("Erro ao salvar dificuldade:", error)
    throw error
  }
}