export type SkillLevel = 1 | 2 | 3 | 4 | 5

export interface SkillSet {
  [posto: string]: SkillLevel
}

export interface OperatorHistory {

  linha: string
  posto: string
  nivel: SkillLevel
  inicio: string
  fim?: string

}

export interface Operator {

  id: string
  matricula: string
  nome: string
  linhaAtual: string | null

  postos: SkillSet

  historico: OperatorHistory[]

  status: "ativo" | "desligado"

}