// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai"
import { supabase } from "@/services/database/supabaseClient"

// Importamos nosso novo arsenal de ferramentas
import { 
  getLineCoverage, 
  getOperatorRisk, 
  getCriticalTrainingNeeds,
  getOperatorContext360
} from "@/services/database/aiRepository"

// =======================================================================
    // 🕵️ DETETIVE: Pede pro Google listar os modelos que sua chave tem acesso
    // =======================================================================
    const debugRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
    const debugData = await debugRes.json()
    console.log("🛠️ MODELOS DISPONÍVEIS NA SUA CHAVE:")
    console.log(debugData.models?.map((m: any) => m.name).filter((name: string) => name.includes("gemini")))
    // =======================================================================*/

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

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
          description: "Analisa a cobertura atual de uma linha de produção. Retorna os postos, a quantidade necessária e o GAP (buraco).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Nome exato da linha" } },
            required: ["linha"]
          } as any 
        },
        {
          name: "get_operator_risk",
          description: "Busca o mapa de risco de assiduidade dos operadores. Traz o Score (0 a 100), tendências (30/60/90 dias) e os motivos registrados (observações).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        },
        {
          name: "get_critical_training_needs",
          description: "Gera um relatório das linhas e postos críticos que estão com GAP (falta de pessoas) na fábrica inteira para planejamento de treinamento.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        {
          name: "get_operator_context_360",
          description: "Visão global de todos os operadores da linha: Lista operadores, skills e 'dias_desde_ultima_execucao' (ferrugem). Útil para planejar o time do dia ou verificar reciclagem.",
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
  model: "gemini-2.5-flash",
      systemInstruction: `Você é um Arquiteto de Decisão Industrial integrado ao sistema Skill Map.
Sua missão é atuar no planejamento, risco e alocação da fábrica.
REGRAS DA CAMADA SEMÂNTICA:
- 'Score de Assiduidade' vai de 0 a 100 (100 é perfeito). Status: Verde (>=90, Baixo Risco), Amarelo (70 a 89, Risco Moderado), Vermelho (<70, Alto Risco de falta).
- Se o usuário perguntar por operadores com "risco" ou "chance de faltar", inclua sempre na sua tabela os operadores de status AMARELO e VERMELHO.
- 'Gap': Se for maior que 0, significa que a linha está desfalcada naquele posto e precisa de gente.
- 'Criticidade': Alta, Média ou Baixa.
- 'Ferrugem' (dias_desde_ultima_execucao): Se este valor for alto (ex: > 30), o operador está enferrujado no posto. Se for 999, ele nunca operou formalmente ou não tem histórico.
DIRETRIZES DE RESPOSTA:
1. Sempre use as Ferramentas (Tools) disponíveis para embasar sua resposta com dados reais.
2. Quando retornar análises, seja analítico, direto e use o formato Markdown para criar tabelas corporativas (ex: | Operador | Score | Status | Observação |).
3. Se a ferramenta trouxer "ultimas_observacoes" em um operador com risco de falta, cite o motivo na tabela ou na justificativa para o gestor entender o contexto.
4. Se um operador chave para um posto de 'Alta' criticidade estiver no 'Vermelho', emita um ALERTA ANTECIPADO.`,
      tools
    })

    const chat = model.startChat()
    const result = await chat.sendMessage(message)
    const response = result.response
    const functionCalls = response.functionCalls()

    // ==========================================
    // 3. EXECUÇÃO INTELIGENTE DAS FERRAMENTAS
    // ==========================================
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      let data: any = null

      // Roteador de Ferramentas
      switch (call.name) {
        case "get_alocacao_sugestao":
          const argsAloc = call.args as { linha: string, posto: string }
          const res = await supabase.rpc('get_alocacao_sugestao', { p_linha: argsAloc.linha, p_posto: argsAloc.posto })
          if (res.error) throw new Error(res.error.message)
          data = res.data
          break;

        case "get_line_coverage":
          const argsCov = call.args as { linha: string }
          data = await getLineCoverage(argsCov.linha)
          break;

        case "get_operator_risk":
          const argsRisk = call.args as { linha?: string }
          data = await getOperatorRisk(argsRisk.linha)
          break;

        case "get_critical_training_needs":
          data = await getCriticalTrainingNeeds()
          break;

        case "get_operator_context_360":
          const argsContext = call.args as { linha?: string }
          data = await getOperatorContext360(argsContext.linha)
          break;
      }

      // Devolve a tabela mastigada do banco para a IA ler
      const finalResult = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: { content: data || [] }
        }
      }])

      return NextResponse.json({ reply: finalResult.response.text() })
    }

    return NextResponse.json({ reply: response.text() })

  } catch (error: any) {
    console.error("Erro no Chatbot AI:", error)
    return NextResponse.json({ 
      error: error.message || "Ocorreu um erro desconhecido no servidor da IA." 
    }, { status: 500 })
  }
}