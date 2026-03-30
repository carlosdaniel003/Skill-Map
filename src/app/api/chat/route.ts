// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai"
import { supabase } from "@/services/database/supabaseClient"

import { 
  getLineCoverage, 
  getOperatorRisk, 
  getCriticalTrainingNeeds,
  getOperatorContext360,
  searchOperatorByName,
  getOperatorsByLine,
  queryDatabase,
  getFactorySummary
} from "@/services/database/aiRepository"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], dashboardContext = {} } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não encontrada")
    }

    // ==========================================
    // 1. ARSENAL DE FERRAMENTAS DA IA (EXPANDIDO)
    // ==========================================
    const tools: Tool[] = [{
      functionDeclarations: [
        // 🆕 NOVA: Busca operador por NOME
        {
          name: "search_operator_by_name",
          description: "Busca um operador pelo nome. Retorna dados completos: informações pessoais, skills, frequência dos últimos 30 dias, experiência e contexto 360. Use SEMPRE que o usuário mencionar o NOME de um operador.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              nome: { type: SchemaType.STRING, description: "Nome ou parte do nome do operador (ex: Carlos, Maria Silva)" }
            },
            required: ["nome"]
          } as any 
        },
        // 🆕 NOVA: Lista operadores de uma linha
        {
          name: "get_operators_by_line",
          description: "Lista todos os operadores ativos de uma linha específica. Pode filtrar por turno. Use quando o usuário quer saber QUEM está em uma linha.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              linha: { type: SchemaType.STRING, description: "Nome da linha (ex: TV, CM, BBS)" },
              turno: { type: SchemaType.STRING, description: "Opcional. Filtrar por turno (ex: Turno A, Turno B)" }
            },
            required: ["linha"]
          } as any 
        },
        // 🆕 NOVA: Consulta genérica ao banco
        {
          name: "query_database",
          description: "Consulta genérica a qualquer tabela do banco de dados. Tabelas disponíveis: operators, operator_skills, operator_attendance, operator_experience, operator_history, production_lines, workstations, vw_operator_analytics, vw_operator_360_context, vw_line_coverage. Use quando nenhuma outra ferramenta atende à pergunta.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              tabela: { type: SchemaType.STRING, description: "Nome da tabela (ex: operators, operator_skills)" },
              filtros: { type: SchemaType.STRING, description: "Filtros em formato JSON. Ex: {\"linha_atual\": \"TV\", \"turno\": \"Turno A\"}" },
              limite: { type: SchemaType.NUMBER, description: "Quantidade máxima de resultados (padrão: 50)" }
            },
            required: ["tabela"]
          } as any 
        },
        // 🆕 NOVA: Resumo geral da fábrica
        {
          name: "get_factory_summary",
          description: "Retorna um resumo geral da fábrica: total de operadores ativos, linhas, postos, quantidade de skills registradas. Use quando o usuário pedir uma visão geral ou resumo.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        // EXISTENTE: Sugestão de alocação
        {
          name: "get_alocacao_sugestao",
          description: "Busca os 3 melhores operadores para um posto específico em uma linha. Traz Skill, Assiduidade e dias sem operar. Use quando o usuário quer saber QUEM PODE operar um posto.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              linha: { type: SchemaType.STRING, description: "Nome da linha (ex: TV, CM, BBS)" }, 
              posto: { type: SchemaType.STRING, description: "Nome do posto (ex: Soldagem, Injeção)" } 
            },
            required: ["linha", "posto"]
          } as any 
        },
        // EXISTENTE: Cobertura da linha
        {
          name: "get_line_coverage",
          description: "Analisa cobertura de uma linha: quantas pessoas tem, quantas faltam (GAP), postos descobertos, criticidade. Use quando o usuário quer ver a SAÚDE ou COBERTURA de uma linha.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Nome da linha" } },
            required: ["linha"]
          } as any 
        },
        // EXISTENTE: Risco de assiduidade
        {
          name: "get_operator_risk",
          description: "Mapa de risco de assiduidade: operadores classificados como VERMELHO (crítico), AMARELO (atenção) ou VERDE (confiável). Traz score e histórico. Use quando o usuário quer saber sobre RISCO ou FALTAS.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        },
        // EXISTENTE: Treinamentos críticos
        {
          name: "get_critical_training_needs",
          description: "Relatório de postos com GAP (falta de pessoas treinadas) e linhas com criticidade alta. Use quando o usuário quer saber onde precisa de TREINAMENTO.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        // EXISTENTE: Contexto 360
        {
          name: "get_operator_context_360",
          description: "Visão 360º de todos os operadores: skills por posto, dias sem operar (ferrugem), assiduidade. Filtro opcional por linha. Use para análises gerais ou quando quer ver a FERRUGEM dos operadores.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        }
      ]
    }]

    // ==========================================
    // 2. INSTRUÇÃO DO SISTEMA (INTELIGENTE)
    // ==========================================
    const systemInstruction = `Você é o Assistente de Inteligência Industrial do Skill Map — um sistema de gestão de competências de uma fábrica.

PERSONALIDADE:
- Você é proativo, direto e analítico
- Responda SEMPRE em PORTUGUÊS BRASILEIRO
- Quando tiver dados, NUNCA peça mais informações desnecessárias ao usuário
- Se o usuário dá informação parcial, use as ferramentas para completar

REGRAS DE DECISÃO DE FERRAMENTAS:
1. Se o usuário MENCIONA O NOME de um operador → use search_operator_by_name PRIMEIRO. NÃO peça linha ou posto.
2. Se o usuário quer saber QUEM ESTÁ em uma linha → use get_operators_by_line
3. Se o usuário quer saber QUEM PODE operar um posto + linha → use get_alocacao_sugestao
4. Se o usuário quer ver COBERTURA/SAÚDE/GAP de uma linha → use get_line_coverage
5. Se o usuário quer saber sobre RISCO/FALTAS/ASSIDUIDADE → use get_operator_risk
6. Se o usuário quer saber sobre FERRUGEM/dias sem operar → use get_operator_context_360
7. Se o usuário quer um RESUMO GERAL da fábrica → use get_factory_summary
8. Se o usuário pede TREINAMENTOS URGENTES → use get_critical_training_needs
9. Para qualquer outra consulta específica → use query_database

REGRA DE OURO: Se você tem uma ferramenta que pode responder a pergunta, USE-A IMEDIATAMENTE. NUNCA peça informações extras ao usuário se você pode buscar os dados primeiro.

FORMATO DE RESPOSTA:
- Para LISTAS de operadores: use TABELA Markdown
- Para ANÁLISES: use bullets com emojis de alerta
- Para PERFIL de operador: organize em seções (📋 Dados, 🎯 Skills, 📅 Frequência, 💡 Recomendação)
- Sempre conclua com 1 RECOMENDAÇÃO em negrito

EMOJIS DE ALERTA:
- Assiduidade < 75%: 🔴 RISCO CRÍTICO
- Assiduidade 75-85%: 🟡 ATENÇÃO
- Assiduidade >= 85%: 🟢 CONFIÁVEL
- Dias sem operar > 30: ⚠️ FERRUGEM
- Skill nível 4-5: ⭐ ESPECIALISTA
- Skill nível 1-2: 📚 PRECISA TREINAR

CONTEXTO ATUAL DO DASHBOARD:
${dashboardContext.linha ? `🏭 Linha selecionada: ${dashboardContext.linha}` : "Nenhuma linha selecionada"}
${dashboardContext.turno ? `⏰ Turno: ${dashboardContext.turno}` : "Turno não especificado"}
${dashboardContext.operatorId ? `👤 Operador selecionado no filtro: ${dashboardContext.operatorId}` : ""}

NUNCA:
- Retorne texto vazio
- Peça informações que você pode buscar sozinho
- Diga "não tenho dados" sem antes chamar pelo menos 1 ferramenta
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
    const MAX_TOOL_CALLS = 5 // 🆕 Aumentado de 3 para 5 (mais liberdade para a IA)

    while (functionCalls && functionCalls.length > 0 && callCount < MAX_TOOL_CALLS) {
      callCount++

      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          let data: any = null

          try {
            switch (call.name) {
              // 🆕 NOVAS FERRAMENTAS
              case "search_operator_by_name": {
                const args = call.args as { nome: string }
                data = await searchOperatorByName(args.nome).catch(e => ({ error: e.message }))
                break
              }

              case "get_operators_by_line": {
                const args = call.args as { linha: string; turno?: string }
                data = await getOperatorsByLine(args.linha, args.turno).catch(e => ({ error: e.message }))
                break
              }

              case "query_database": {
                const args = call.args as { tabela: string; filtros?: string; limite?: number }
                let parsedFiltros: Record<string, string> | undefined
                if (args.filtros) {
                  try {
                    parsedFiltros = JSON.parse(args.filtros)
                  } catch {
                    parsedFiltros = undefined
                  }
                }
                data = await queryDatabase(args.tabela, parsedFiltros, args.limite).catch(e => ({ error: e.message }))
                break
              }

              case "get_factory_summary": {
                data = await getFactorySummary().catch(e => ({ error: e.message }))
                break
              }

              // FERRAMENTAS EXISTENTES
              case "get_alocacao_sugestao": {
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
              }

              case "get_line_coverage": {
                const argsCov = call.args as { linha: string }
                data = await getLineCoverage(argsCov.linha).catch(e => ({ error: e.message }))
                break
              }

              case "get_operator_risk": {
                const argsRisk = call.args as { linha?: string }
                data = await getOperatorRisk(argsRisk.linha).catch(e => ({ error: e.message }))
                break
              }

              case "get_critical_training_needs": {
                data = await getCriticalTrainingNeeds().catch(e => ({ error: e.message }))
                break
              }

              case "get_operator_context_360": {
                const argsCtx = call.args as { linha?: string }
                data = await getOperatorContext360(argsCtx.linha).catch(e => ({ error: e.message }))
                break
              }

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

      result = await chat.sendMessage(functionResponses)
      functionCalls = result.response.functionCalls()
    }

    // ==========================================
    // 5. EXTRAIR E VALIDAR RESPOSTA FINAL
    // ==========================================
    let finalReply = result.response.text()

    if (!finalReply || finalReply.trim() === "") {
      console.warn("IA retornou resposta vazia após", callCount, "chamadas de ferramenta")
      
      finalReply = `Consegui acessar os dados da fábrica, mas tive dificuldade em formular a análise.

**Tente perguntar de outra forma. Exemplos:**
- "Me mostra tudo sobre o operador **Carlos Daniel**"
- "Quem pode fazer **Soldagem** na linha **TV**?"
- "Qual a **cobertura** da linha **CM** hoje?"
- "Quem está **em risco** de falta?"
- "Me dá um **resumo geral** da fábrica"
- "Quais operadores estão na linha **BBS**?"

Ou me diga direto o que precisa!`
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