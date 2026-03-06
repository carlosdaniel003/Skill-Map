import { Operator } from "./operatorTypes"
import { config } from "../../config/config"
import { v4 as uuid } from "uuid"

/**
 * Creates a new operator with default skill levels
 */

export function createOperator(
  matricula: string,
  nome: string,
  linha: string | null
): Operator {

  const postos: any = {}

  config.postos.forEach(posto => {

    postos[posto] = 1

  })

  return {

    id: uuid(),

    matricula,

    nome,

    linhaAtual: linha,

    postos,

    historico: [],

    status: "ativo"

  }

}