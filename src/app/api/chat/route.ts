// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai"
import { supabase } from "@/services/database/supabaseClient"

import { 
  getLineCoverage, 
  getOperatorRisk, 
  getCriticalTrainingNeeds,
  getOperatorContext360
} from "@/services/database/aiRepository"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("A GEMINI_API_KEY não foi encontrada no .env.local.")
    }

    // ==========================================
    // 1. ARSENAL DE FERRAMENTAS DA IA
    // ==========================================
    const tools: Tool[] = [{
      functionDeclarations: [
        {
          name: "get_alocacao_sugestao",
          description: "Busca candidatos para substituir ou alocar em um posto.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING }, posto: { type: SchemaType.STRING } },
            required: ["linha", "posto"]
          } as any 
        },
        {
          name: "get_line_coverage",
          description: "Analisa a cobertura atual de uma linha de produção.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Nome exato da linha" } },
            required: ["linha"]
          } as any 
        },
        {
          name: "get_operator_risk",
          description: "Busca o mapa de risco de assiduidade dos operadores. Traz Score, tendências e observações.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        },
        {
          name: "get_critical_training_needs",
          description: "Gera relatório de linhas/postos críticos com GAP (falta de pessoas).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        {
          name: "get_operator_context_360",
          description: "Visão global: Lista operadores, skills e 'dias_desde_ultima_execucao' (ferrugem).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        }
      ]
    }]

    // ==========================================
    // 2. INSTRUÇÕES DO MOTOR DE DECISÃO
    // ==========================================
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", 
      systemInstruction: `Você é um Arquiteto de Decisão Industrial integrado ao sistema Skill Map.
Sua missão é atuar no planejamento, risco e alocação da fábrica.
REGRAS DA CAMADA SEMÂNTICA:
- 'Score de Assiduidade' vai de 0 a 100. Status: Verde (>=90, Baixo Risco), Amarelo (70 a 89, Risco Moderado), Vermelho (<70, Alto Risco de falta).
- Se o usuário perguntar por operadores com "risco" ou "chance de faltar", inclua sempre os operadores de status AMARELO e VERMELHO.
- 'Gap': Se for maior que 0, significa que a linha está desfalcada.
- 'Criticidade': Alta, Média ou Baixa.
- 'Ferrugem' (dias_desde_ultima_execucao): Se > 30, o operador está enferrujado. Se 999, não tem histórico formal recente.
DIRETRIZES DE RESPOSTA:
1. Sempre use as Ferramentas para embasar sua resposta com dados reais. Se precisar usar 2 ou 3 ferramentas para cruzar os dados, faça isso antes de responder!
2. Seja analítico, direto e use o formato Markdown para tabelas (ex: | Operador | Nível | Score | Status | Observação | Ferrugem |).
3. Cite o motivo da falta (se houver em ultimas_observacoes) na tabela ou no texto.
4. Se um operador chave para um posto de 'Alta' criticidade estiver no 'Vermelho', emita um ALERTA ANTECIPADO.`,
      tools
    })

    const chat = model.startChat({
      history: history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }))
    })

    // ==========================================
    // 3. O LOOP DE RACIOCÍNIO CONTÍNUO
    // ==========================================
    let result = await chat.sendMessage(message)
    let functionCalls = result.response.functionCalls()

    // O "while" permite que a IA chame várias ferramentas, uma após a outra, 
    // ou ao mesmo tempo, até ter todas as peças do quebra-cabeça.
    while (functionCalls && functionCalls.length > 0) {
      
      // Promise.all processa as chamadas caso a IA peça 2 tabelas simultaneamente
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          let data: any = null

          try {
            switch (call.name) {
              case "get_alocacao_sugestao":
                const argsAloc = call.args as { linha: string, posto: string }
                const res = await supabase.rpc('get_alocacao_sugestao', { p_linha: argsAloc.linha, p_posto: argsAloc.posto })
                if (res.error) throw new Error(res.error.message)
                data = res.data
                break;
              case "get_line_coverage":
                data = await getLineCoverage((call.args as { linha: string }).linha)
                break;
              case "get_operator_risk":
                data = await getOperatorRisk((call.args as { linha?: string }).linha)
                break;
              case "get_critical_training_needs":
                data = await getCriticalTrainingNeeds()
                break;
              case "get_operator_context_360":
                data = await getOperatorContext360((call.args as { linha?: string }).linha)
                break;
            }
          } catch (err) {
            console.error(`Erro na tool ${call.name}:`, err)
            data = { error: "Não foi possível buscar estes dados no momento." }
          }

          return {
            functionResponse: {
              name: call.name,
              response: { content: data || [] }
            }
          }
        })
      )

      // Devolvemos o bloco de dados para a IA continuar o fluxo de raciocínio dela
      result = await chat.sendMessage(functionResponses)
      
      // Verificamos se ela gerou novas chamadas ou se finalmente gerou o texto final
      functionCalls = result.response.functionCalls()
    }

    const finalReply = result.response.text()

    if (!finalReply) {
      return NextResponse.json({ reply: "Acessei os dados, mas tive um problema ao formular o texto. Pode repetir a pergunta de outra forma?" })
    }

    return NextResponse.json({ reply: finalReply })

  } catch (error: any) {
    console.error("Erro no Chatbot AI:", error)
    return NextResponse.json({ 
      error: error.message || "Ocorreu um erro desconhecido no servidor da IA." 
    }, { status: 500 })
  }
}