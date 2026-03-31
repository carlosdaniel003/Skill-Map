// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai"
import { supabase } from "@/services/database/supabaseClient"

import { 
  getLineCoverage, 
  getOperatorRisk, 
  getCriticalTrainingNeeds,
  getOperatorContext360,
  searchOperator,
  getOperatorsByLine,
  queryDatabase,
  getFactorySummary,
  findSubstitutes,
  explainAttendanceScore
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
        // Busca operador por NOME ou MATRÍCULA
        {
          name: "search_operator",
          description: "Busca um operador por NOME ou MATRÍCULA (número). Retorna o dossiê completo: dados pessoais, ALL skills (ordenadas por nível), frequência de 90 dias, experiência profissional, contexto 360 e analytics de risco. Use SEMPRE que o usuário mencionar um NOME de pessoa ou um NÚMERO DE MATRÍCULA (ex: 503070).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              identificador: { type: SchemaType.STRING, description: "Nome do operador OU número da matrícula (ex: 'Carlos Daniel' ou '503070')" }
            },
            required: ["identificador"]
          } as any 
        },
        // Lista operadores de uma linha (COM detalhes de skills e analytics)
        {
          name: "get_operators_by_line",
          description: "Lista todos os operadores ativos de uma linha específica com informações básicas (nome, matrícula, posto, turno). Use quando o usuário quer saber QUEM está em uma linha ou pede 'informações sobre os operadores' de uma linha. Ao receber os dados, SEMPRE apresente em formato de tabela. Se a busca retornar array vazio, tente buscar novamente sem filtro de turno.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              linha: { type: SchemaType.STRING, description: "Nome ou parte do nome da linha. Pode ser a categoria (ex: TV, CM, BBS) ou o modelo completo (ex: TV 32). A busca é parcial, então 'TV' encontra 'TV 32', 'TV 43' etc." },
              turno: { type: SchemaType.STRING, description: "Opcional. Filtrar por turno. Os turnos da fábrica são: 'Comercial' e '2º Turno Estendido'. Só informe se o usuário pedir explicitamente." }
            },
            required: ["linha"]
          } as any 
        },
        // Consulta genérica ao banco
        {
          name: "query_database",
          description: "Consulta genérica a qualquer tabela do banco de dados. Tabelas disponíveis: operators, operator_skills, operator_attendance, operator_experience, operator_history, production_lines, workstations, vw_operator_analytics, vw_operator_360_context, vw_line_coverage. Use quando nenhuma outra ferramenta atende à pergunta.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              tabela: { type: SchemaType.STRING, description: "Nome da tabela (ex: operators, operator_skills)" },
              filtros: { type: SchemaType.STRING, description: "Filtros em formato JSON. Ex: {\"linha_atual\": \"TV\", \"turno\": \"Comercial\"}" },
              limite: { type: SchemaType.NUMBER, description: "Quantidade máxima de resultados (padrão: 50)" }
            },
            required: ["tabela"]
          } as any 
        },
        // Resumo geral da fábrica
        {
          name: "get_factory_summary",
          description: "Retorna um resumo geral da fábrica: total de operadores ativos, linhas, postos, quantidade de skills registradas. Use quando o usuário pedir uma visão geral ou resumo.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        // Encontra substitutos para um operador
        {
          name: "find_substitutes",
          description: "Encontra operadores que podem SUBSTITUIR um operador específico no posto e linha em que ele está agora. Retorna candidatos ranqueados por skill, assiduidade, mesmo turno e mesma linha. Cada candidato tem uma JUSTIFICATIVA de por que foi recomendado. Use quando o usuário perguntar 'quem pode substituir X?' ou 'quem cobre o posto do operador Y?'. Precisa do operator_id (UUID) - busque primeiro com search_operator se não tiver o ID.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              operator_id: { type: SchemaType.STRING, description: "UUID do operador que será substituído. Se não tiver, use search_operator primeiro para descobrir o ID." }
            },
            required: ["operator_id"]
          } as any 
        },
        // Explica o score de assiduidade de um operador
        {
          name: "explain_attendance_score",
          description: "Explica DETALHADAMENTE por que a assiduidade de um operador é X%. Mostra breakdown: quantas presenças, faltas, atrasos, atestados, férias nos últimos 90 dias. Mostra a fórmula de cálculo e os registros mais recentes. Use quando o usuário perguntar 'POR QUÊ a assiduidade é X?' ou 'explica o score' ou 'como calculou?'. Precisa do operator_id (UUID).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { 
              operator_id: { type: SchemaType.STRING, description: "UUID do operador. Se não tiver, use search_operator primeiro para descobrir o ID." }
            },
            required: ["operator_id"]
          } as any 
        },
        // Sugestão de alocação
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
        // Cobertura da linha
        {
          name: "get_line_coverage",
          description: "Analisa cobertura de uma linha: quantas pessoas tem, quantas faltam (GAP), postos descobertos, criticidade. Use quando o usuário quer ver a SAÚDE ou COBERTURA de uma linha.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Nome da linha" } },
            required: ["linha"]
          } as any 
        },
        // Risco de assiduidade
        {
          name: "get_operator_risk",
          description: "Mapa de risco de assiduidade: operadores classificados como VERMELHO (crítico), AMARELO (atenção) ou VERDE (confiável). Traz score e histórico. Use quando o usuário quer saber sobre RISCO ou FALTAS, 100% = Verde, 97.5%-99.99% = Amarelo, abaixo de 97.5% = Vermelho.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: { linha: { type: SchemaType.STRING, description: "Opcional. Filtrar por linha" } }
          } as any 
        },
        // Treinamentos críticos
        {
          name: "get_critical_training_needs",
          description: "Relatório de postos com GAP (falta de pessoas treinadas) e linhas com criticidade alta. Use quando o usuário quer saber onde precisa de TREINAMENTO.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          } as any 
        },
        // Contexto 360
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
    // 2. INSTRUÇÃO DO SISTEMA (MELHORADA)
    // ==========================================
    const systemInstruction = `Você é o Assistente de Inteligência Industrial do Skill Map — um sistema de gestão de competências de uma fábrica.

PERSONALIDADE:
- Você é proativo, direto, analítico e TRANSPARENTE (explica suas decisões)
- Responda SEMPRE em PORTUGUÊS BRASILEIRO
- Quando tiver dados, NUNCA peça mais informações desnecessárias ao usuário
- Se o usuário dá informação parcial, use as ferramentas para completar
- Quando recomendar alguém, SEMPRE explique O PORQUÊ da recomendação

REGRA MAIS IMPORTANTE — AÇÃO PRIMEIRO, PERGUNTAS DEPOIS:
- Se o usuário menciona uma LINHA (ex: "TV", "CM") → CHAME a ferramenta IMEDIATAMENTE, não pergunte turno ou posto
- Se o usuário menciona um NOME ou MATRÍCULA → CHAME search_operator IMEDIATAMENTE
- Se o usuário diz "informações dos operadores" ou "quem está na linha" → CHAME get_operators_by_line IMEDIATAMENTE
- NUNCA pergunte "qual turno?", "qual posto?", "qual linha?" se você pode buscar TODOS e filtrar depois
- Se retornar vazio, tente variações (ex: se "TV" não achou, tente "TV 32", "TV 43" etc.)
- Só pergunte algo ao usuário SE a ferramenta retornou resultado vazio E você já tentou variações

REGRAS DE DECISÃO DE FERRAMENTAS:
1. Se o usuário menciona um NÚMERO (ex: 503070) → é matrícula → use search_operator com o número
2. Se o usuário menciona o NOME de uma pessoa → use search_operator com o nome
3. Se o usuário pergunta "por quê a assiduidade é X?" ou "como calculou?" → use explain_attendance_score
4. Se o usuário pergunta "quem substitui?" ou "quem cobre?" → use find_substitutes (precisa do operator_id, busque antes com search_operator se necessário)
5. Se o usuário pergunta "quais as melhores skills?" ou "top skills?" → use search_operator (as skills já vêm ordenadas por nível)
6. Se o usuário quer saber QUEM ESTÁ em uma linha OU pede "informações dos operadores" → use get_operators_by_line
7. Se o usuário quer saber QUEM PODE operar um posto + linha → use get_alocacao_sugestao
8. Se o usuário quer ver COBERTURA/SAÚDE/GAP de uma linha → use get_line_coverage
9. Se o usuário quer saber sobre RISCO/FALTAS/ASSIDUIDADE geral → use get_operator_risk
10. Se o usuário quer saber sobre FERRUGEM/dias sem operar → use get_operator_context_360
11. Se o usuário quer um RESUMO GERAL da fábrica → use get_factory_summary
12. Se o usuário pede TREINAMENTOS URGENTES → use get_critical_training_needs
13. Para qualquer outra consulta específica → use query_database

ENCADEAMENTO INTELIGENTE (IMPORTANTE):
- Se o usuário perguntar "quem substitui o Carlos Daniel?" → PRIMEIRO chame search_operator("Carlos Daniel") para pegar o ID, DEPOIS chame find_substitutes(id)
- Se o usuário perguntar "por que a assiduidade do 503070 é baixa?" → PRIMEIRO chame search_operator("503070"), DEPOIS chame explain_attendance_score(id)
- Você pode (e deve) encadear múltiplas ferramentas numa mesma conversa

REGRA DE OURO: Se você tem uma ferramenta que pode responder a pergunta, USE-A IMEDIATAMENTE. NUNCA peça informações extras ao usuário se você pode buscar os dados primeiro.

REGRA DE FALLBACK: Se uma ferramenta retornou array vazio ([]) ou dados vazios:
1. ANTES de dizer "não encontrei", tente OUTRA ferramenta (ex: se get_operators_by_line retornou vazio, tente query_database na tabela operators com filtro ilike)
2. Se todas as tentativas falharem, diga ao usuário o que tentou e sugira alternativas

FORMATO DE RESPOSTA:
- Para LISTAS de operadores: use TABELA Markdown
- Para ANÁLISES: use bullets com emojis de alerta
- Para PERFIL de operador: organize em seções (📋 Dados, 🎯 Skills, 📅 Frequência, 🔄 Substitutos, 💡 Recomendação)
- Para EXPLICAÇÕES de score: mostre a fórmula, os números e a conclusão
- Para RECOMENDAÇÕES de substitutos: explique POR QUÊ cada um foi escolhido
- Sempre conclua com 1 RECOMENDAÇÃO em negrito
- SEMPRE gere texto de resposta ao usuário. NUNCA retorne resposta vazia.

QUANDO EXPLICAR DECISÕES:
- "Por que recomendei X?" → Explique: Skill no posto (nível), Assiduidade (%), mesmo turno/linha, dias sem operar
- "Por que a assiduidade é Y%?" → Mostre: Presenças vs Faltas vs Atrasos no período, fórmula do cálculo
- "Quais as top 5 skills?" → Liste as 5 skills com maior nível, com o nome do posto e o nível
- "Quem substitui?" → Para cada substituto, explique: skill nível X no posto Y, assiduidade Z%, mesmo turno (sim/não)

EMOJIS DE ALERTA:
- Assiduidade < 97.5%: 🔴 RISCO CRÍTICO
- Assiduidade 97.5%-99.99%: 🟡 ATENÇÃO
- Assiduidade 100%: 🟢 CONFIÁVEL
- Dias sem operar > 30: ⚠️ FERRUGEM
- Skill nível 4-5: ⭐ ESPECIALISTA
- Skill nível 1-2: 📚 PRECISA TREINAR

CONTEXTO ATUAL DO DASHBOARD:
${dashboardContext.linha ? `🏭 Linha selecionada: ${dashboardContext.linha}` : "Nenhuma linha selecionada"}
${dashboardContext.turno ? `⏰ Turno: ${dashboardContext.turno}` : "Turno não especificado"}
${dashboardContext.operatorId ? `👤 Operador selecionado no filtro: ${dashboardContext.operatorId}` : ""}

NUNCA:
- Retorne texto vazio — se processou dados, SEMPRE gere uma resposta formatada
- Peça informações que você pode buscar sozinho
- Diga "não tenho dados" sem antes chamar pelo menos 2 ferramentas diferentes
- Recomende alguém sem explicar o porquê

DADOS IMPORTANTES DO SISTEMA:
- Os turnos da fábrica são: "Comercial" e "2º Turno Estendido" (NÃO existem Turno A, B ou C)
- As CATEGORIAS de modelos de produção são: TV, TW, ARCON, BBS, CM, MWO, TM
- Cada categoria contém vários MODELOS (ex: categoria "TV" contém "TV 32", "TV 43", etc.)
- Quando o usuário diz apenas "TV", significa a CATEGORIA TV — busque usando match parcial que vai encontrar todos os modelos dessa categoria (TV 32, TV 43, etc.)
- Os nomes das linhas/modelos são compostos (ex: "TV 32", "CM 55"). Sempre busque com match parcial.
- As matrículas são numéricas com 6 dígitos (ex: 503070)
`

    // ==========================================
    // 3. INICIALIZAR CHAT COM HISTÓRICO
    // ==========================================
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
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
    const MAX_TOOL_CALLS = 8
    let lastToolData: any = null // Guarda os últimos dados retornados pelas ferramentas

    while (functionCalls && functionCalls.length > 0 && callCount < MAX_TOOL_CALLS) {
      callCount++

      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          let data: any = null

          try {
            switch (call.name) {
              case "search_operator": {
                const args = call.args as { identificador: string }
                data = await searchOperator(args.identificador).catch(e => ({ error: e.message }))
                break
              }

              case "find_substitutes": {
                const args = call.args as { operator_id: string }
                data = await findSubstitutes(args.operator_id).catch(e => ({ error: e.message }))
                break
              }

              case "explain_attendance_score": {
                const args = call.args as { operator_id: string }
                data = await explainAttendanceScore(args.operator_id).catch(e => ({ error: e.message }))
                break
              }

              case "get_operators_by_line": {
                const args = call.args as { linha: string; turno?: string }
                data = await getOperatorsByLine(args.linha, args.turno).catch(e => ({ error: e.message }))
                
                // FALLBACK: se retornou vazio e tinha filtro de turno, tenta sem turno
                if (Array.isArray(data) && data.length === 0 && args.turno) {
                  console.log(`[AI] get_operators_by_line retornou vazio com turno "${args.turno}", tentando sem turno...`)
                  data = await getOperatorsByLine(args.linha).catch(e => ({ error: e.message }))
                  if (Array.isArray(data) && data.length > 0) {
                    data = { 
                      operadores: data, 
                      _aviso: `Nenhum operador encontrado no turno "${args.turno}". Mostrando todos os turnos da linha "${args.linha}".` 
                    }
                  }
                }
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

          // Salva os últimos dados para uso no fallback
          lastToolData = { tool: call.name, data }

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
    let finalReply = ""
    
    try {
      finalReply = result.response.text()
    } catch (textError) {
      console.warn("Erro ao extrair texto da resposta:", textError)
      finalReply = ""
    }

    // FALLBACK INTELIGENTE: Se a IA retornou vazio mas temos dados das ferramentas
    if (!finalReply || finalReply.trim() === "") {
      console.warn("IA retornou resposta vazia após", callCount, "chamadas de ferramenta. Último tool:", lastToolData?.tool)
      
      // Tenta formatar os dados diretamente se temos resultado de ferramenta
      if (lastToolData && lastToolData.data) {
        const toolData = lastToolData.data
        
        // Se era busca de operadores por linha e retornou dados
        if (lastToolData.tool === "get_operators_by_line") {
          const ops = Array.isArray(toolData) ? toolData : toolData?.operadores || []
          if (ops.length > 0) {
            finalReply = `## 👥 Operadores encontrados\n\n`
            finalReply += `| # | Nome | Matrícula | Posto Atual | Linha | Turno |\n`
            finalReply += `|---|------|-----------|-------------|-------|-------|\n`
            ops.forEach((op: any, i: number) => {
              finalReply += `| ${i + 1} | ${op.nome || '-'} | ${op.matricula || '-'} | ${op.posto_atual || '-'} | ${op.linha_atual || '-'} | ${op.turno || '-'} |\n`
            })
            finalReply += `\n**Total: ${ops.length} operador(es) encontrado(s).**`
            if (toolData?._aviso) {
              finalReply += `\n\n⚠️ ${toolData._aviso}`
            }
          }
        }
        
        // Se era busca de operador individual
        if (lastToolData.tool === "search_operator" && toolData.operadores?.length > 0) {
          const op = toolData.operadores[0]
          finalReply = `## 📋 ${op.nome}\n`
          finalReply += `- **Matrícula:** ${op.matricula}\n`
          finalReply += `- **Linha:** ${op.linha_atual || 'N/A'}\n`
          finalReply += `- **Posto:** ${op.posto_atual || 'N/A'}\n`
          finalReply += `- **Turno:** ${op.turno || 'N/A'}\n`
          if (toolData.skills?.length > 0) {
            finalReply += `\n### 🎯 Skills (Top 5)\n`
            toolData.skills.slice(0, 5).forEach((s: any) => {
              finalReply += `- **${s.posto}**: Nível ${s.skill_level}/5 ${s.skill_level >= 4 ? '⭐' : s.skill_level <= 2 ? '📚' : ''}\n`
            })
          }
        }
      }
      
      // Se ainda vazio após fallback direto
      if (!finalReply || finalReply.trim() === "") {
        finalReply = `Encontrei dados mas tive dificuldade em formular a análise. Tente reformular sua pergunta.

**Exemplos que funcionam bem:**
- "Quem está na linha **TV**?"
- "Me mostra tudo sobre o operador **Carlos Daniel**" ou "**503070**"
- "Quais as **melhores skills** do operador 503070?"
- "**Por que** a assiduidade dele é 90%?"
- "Quem pode fazer **Soldagem** na linha **TV**?"
- "Me dá um **resumo geral** da fábrica"

Ou me diga direto o que precisa!`
      }
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