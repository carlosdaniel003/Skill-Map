// src\services\database\operatorRepository.ts
import { supabase } from "./supabaseClient"

export interface Operator{

  id?:string
  matricula:string
  nome:string
  linha_atual:string
  posto_atual:string

}

export async function getWorkstations(){

  const { data, error } = await supabase
    .from("workstations")
    .select("*")
    .order("nome")

  if(error){

    console.error(error)
    return []

  }

  return data

}

export async function getProductionLines(){

  const { data, error } = await supabase
    .from("production_lines")
    .select("*")
    .order("nome")

  if(error){

    console.error(error)
    return []

  }

  return data

}

/* listar operadores */

export async function getOperators(){

  const { data, error } = await supabase
    .from("operators")
    .select("*")
    .order("nome")

  if(error){

    console.error(error)
    return []

  }

  return data

}

/* criar operador + skills + histórico */

export async function addOperator(operator:Operator){

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

  /* criar skills padrão */

  const { data:workstations, error:wsError } = await supabase
  .from("workstations")
  .select("*")

if(wsError){
  console.error(wsError)
  throw wsError
}

const workstationsList = workstations || []

  const skills = workstationsList.map((ws:any)=>({

    operator_id:operatorId,
    posto:ws.nome,
    skill_level:1

  }))

  await supabase
    .from("operator_skills")
    .insert(skills)

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

/* mudar linha ou posto */

export async function changeOperatorPosition(
  operatorId:string,
  linha:string,
  posto:string
){

  /* 1️⃣ fechar histórico atual */

  await supabase
    .from("operator_history")
    .update({
      data_fim:new Date()
    })
    .eq("operator_id",operatorId)
    .is("data_fim",null)

  /* 2️⃣ atualizar operador */

  await supabase
    .from("operators")
    .update({
      linha_atual:linha,
      posto_atual:posto
    })
    .eq("id",operatorId)

  /* 3️⃣ criar novo histórico */

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

/* remover operador */

export async function removeOperator(id:string){

  const { error } = await supabase
    .from("operators")
    .delete()
    .eq("id",id)

  if(error){

    console.error(error)
    throw error

  }

}

/* atualizar operador */

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