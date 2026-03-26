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
    const { message, history = [], dashboardContext = {} } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não encontrada")
    }

    // ==========================================
    // 1. ARSENAL DE FERRAMENTAS DA IA
    // ==========================================
    const tools: Tool[] = [{
      functionDeclarations: [
        {
          name: "get_alocacao_sugestao",
          description: "Busca os 3 melhores operadores para um posto. Traz Skill, Assiduidade e dias sem operar.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              linha: { type: SchemaType.STRING, description: "Nome da linha (ex: TV, CM, BBS)" }, 
              posto: { type: SchemaType.STRING, description: "Nome do posto (ex: Soldagem, Injeção)" } 
            },
            required: ["linha", "posto"]
          } as any 
        },
        {
          name: "get_line_coverage",
          description: "Analisa cobertura de uma linha: quantas pessoas tem, quantas faltam, quem está em risco.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Nome da linha" } },
            required: ["linha"]
          } as any 
        },
        {
          name: "get_operator_risk",
          description: "Mapa de risco de assiduidade: operadores em VERMELHO, AMARELO ou VERDE. Traz score e histórico.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        },
        {
          name: "get_critical_training_needs",
          description: "Relatório: postos com GAP (falta de pessoas) e linhas com críticidade alta.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        {
          name: "get_operator_context_360",
          description: "Visão 360º: Lista operadores com skills, dias sem operar (ferrugem), assiduidade. Filtro por linha.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional" } }
          } as any 
        }
      ]
    }]

    // ==========================================
    // 2. INSTRUÇÃO DO SISTEMA (CORRIGIDA & ENRIQUECIDA)
    // ==========================================
    const systemInstruction = `Você é um Especialista em Alocação e Risco Operacional integrado ao Skill Map.

REGRAS OBRIGATÓRIAS:
1. SEMPRE responda em PORTUGUÊS BRASILEIRO
2. Se o usuário menciona LINHA e POSTO, use get_alocacao_sugestao OBRIGATORIAMENTE
3. Se o usuário quer ver COBERTURA ou SAÚDE da linha, use get_line_coverage
4. Se o usuário quer saber QUEM TÁ EM RISCO, use get_operator_risk
5. Se pergunta sobre FERRUGEM (dias sem operar), use get_operator_context_360

FORMATO DE RESPOSTA OBRIGATÓRIO:
- Se retorna lista de operadores: use TABELA com colunas [Nome | Skill | Assiduidade | Dias sem operar]
- Se retorna análise: use BULLETS com destaque de ALERTAS em VERMELHO
- Sempre conclua com 1 RECOMENDAÇÃO CLARA em negrito

ALERTAS OBRIGATÓRIOS:
- Se Assiduidade < 75%: marque com 🔴 RISCO
- Se Assiduidade 75-85%: marque com 🟡 ATENÇÃO
- Se Assiduidade >= 85%: marque com 🟢 CONFIÁVEL
- Se Dias sem operar > 30: marque com ⚠️ FERRUGEM

NUNCA:
- Retorne texto vazio
- Deixe a IA fazer loop infinito
- Responda sem dados reais

CONTEXTO DO USUÁRIO (IMPORTANTE):
${dashboardContext.linha ? `Linha selecionada no dashboard: ${dashboardContext.linha}` : "Nenhuma linha selecionada"}
${dashboardContext.turno ? `Turno: ${dashboardContext.turno}` : "Turno não especificado"}
`

    // ==========================================
    // 3. INICIALIZAR CHAT COM HISTÓRICO
    // ==========================================
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction
    })

    const conversationHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }))

    const chat = model.startChat({
      history: conversationHistory,
      tools
    })

    // ==========================================
    // 4. ENVIAR MENSAGEM E PROCESSAR FERRAMENTAS
    // ==========================================
    let result = await chat.sendMessage(message)
    let functionCalls = result.response.functionCalls()

    let callCount = 0
    const MAX_TOOL_CALLS = 3 // Limite para evitar loops

    // Loop: IA chama ferramenta → recebe dados → chama outra ferramenta → gera resposta
    while (functionCalls && functionCalls.length > 0 && callCount < MAX_TOOL_CALLS) {
      callCount++

      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          let data: any = null

          try {
            switch (call.name) {
              case "get_alocacao_sugestao":
                const argsAloc = call.args as { linha: string; posto: string }
                const resAloc = await supabase.rpc('get_alocacao_sugestao', { 
                  p_linha: argsAloc.linha, 
                  p_posto: argsAloc.posto 
                })
                if (resAloc.error) {
                  data = { error: `Linha ou posto não encontrado: ${resAloc.error.message}` }
                } else {
                  data = resAloc.data || []
                }
                break

              case "get_line_coverage":
                const argsCov = call.args as { linha: string }
                data = await getLineCoverage(argsCov.linha).catch(e => ({ error: e.message }))
                break

              case "get_operator_risk":
                const argsRisk = call.args as { linha?: string }
                data = await getOperatorRisk(argsRisk.linha).catch(e => ({ error: e.message }))
                break

              case "get_critical_training_needs":
                data = await getCriticalTrainingNeeds().catch(e => ({ error: e.message }))
                break

              case "get_operator_context_360":
                const argsCtx = call.args as { linha?: string }
                data = await getOperatorContext360(argsCtx.linha).catch(e => ({ error: e.message }))
                break

              default:
                data = { error: `Ferramenta desconhecida: ${call.name}` }
            }
          } catch (err: any) {
            console.error(`Erro na ferramenta ${call.name}:`, err)
            data = { error: err.message || "Erro ao executar ferramenta" }
          }

          return {
            functionResponse: {
              name: call.name,
              response: { content: Array.isArray(data) ? data : [data] }
            }
          }
        })
      )

      // Envia resultado das ferramentas de volta para a IA
      result = await chat.sendMessage(functionResponses)
      functionCalls = result.response.functionCalls()
    }

    // ==========================================
    // 5. EXTRAIR E VALIDAR RESPOSTA FINAL
    // ==========================================
    let finalReply = result.response.text()

    // Se a IA retornou vazio, tenta uma resposta fallback
    if (!finalReply || finalReply.trim() === "") {
      console.warn("IA retornou resposta vazia após", callCount, "chamadas de ferramenta")
      
      finalReply = `Consegui acessar os dados da fábrica, mas tive dificuldade em formular a análise.

**Tente ser mais específico na sua pergunta:**
- "Quem pode fazer **Soldagem** na linha **TV**?" 
- "Qual a **cobertura** da linha **CM** hoje?"
- "Quem está **em risco** de falta?"
- "Qual operador tem **ferrugem** (não opera há muito tempo)?"

Ou me diga direto a **linha** e **posto** que precisa!`
    }

    return NextResponse.json({ reply: finalReply })

  } catch (error: any) {
    console.error("Erro no Chatbot AI:", error)
    
    return NextResponse.json({ 
      reply: `❌ Erro no servidor: ${error.message || "Desconhecido"}. Tente novamente em alguns segundos.`,
      error: error.message 
    }, { status: 500 })
  }
}