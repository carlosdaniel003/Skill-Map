import { supabase } from "./supabaseClient"

export interface Operator{

  id?:string
  matricula:string
  nome:string
  linha_atual:string
  posto_atual:string

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
    .order("nome")

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