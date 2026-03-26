// src/services/ai/geminiService.ts
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai"
import { supabase } from "../database/supabaseClient"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// 🆕 Função auxiliar para extrair linha e posto de texto
function extractLinhaAndPosto(text: string): { linha: string | null; posto: string | null } {
  const linhas = ["TV", "CM", "BBS", "MWO", "TM", "TW", "ARCON"]
  const postos = ["Soldagem", "Injeção", "Montagem", "Pintura", "Embalagem", "Controle"]

  let foundLinha = null
  let foundPosto = null

  for (const linha of linhas) {
    if (text.toUpperCase().includes(linha)) {
      foundLinha = linha
      break
    }
  }

  for (const posto of postos) {
    if (text.toLowerCase().includes(posto.toLowerCase())) {
      foundPosto = posto
      break
    }
  }

  return { linha: foundLinha, posto: foundPosto }
}

// Função original (mantida para compatibilidade)
export async function runDecisionAI(userInput: string) {
  const { linha, posto } = extractLinhaAndPosto(userInput)

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: `Você é um especialista em alocação de operadores.
Seu trabalho é analisar dados e recomendar melhor operador para um posto.
IMPORTANTE: Sempre responda em tabela clara com [Nome | Skill | Assiduidade].`,
  })

  const tools: Tool[] = [
    {
      functionDeclarations: [{
        name: "get_alocacao_sugestao",
        description: "Busca melhores operadores para um posto",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            linha: { type: SchemaType.STRING },
            posto: { type: SchemaType.STRING }
          },
          required: ["linha", "posto"]
        } as any
      }]
    }
  ]

  const chat = model.startChat({ tools })
  const result = await chat.sendMessage(userInput)
  let functionCalls = result.response.functionCalls()

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0]
    
    if (call.name === "get_alocacao_sugestao") {
      const args = call.args as { linha: string; posto: string }
      const { data } = await supabase.rpc('get_alocacao_sugestao', {
        p_linha: args.linha || linha,
        p_posto: args.posto || posto
      })

      const finalResult = await chat.sendMessage([{
        functionResponse: {
          name: "get_alocacao_sugestao",
          response: { content: data || [] }
        }
      }])

      return finalResult.response.text()
    }
  }

  return result.response.text()
}