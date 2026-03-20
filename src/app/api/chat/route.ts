// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai"
import { supabase } from "@/services/database/supabaseClient"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("A GEMINI_API_KEY não foi encontrada no .env.local.")
    }

    /*// =======================================================================
    // 🕵️ DETETIVE: Pede pro Google listar os modelos que sua chave tem acesso
    // =======================================================================
    const debugRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
    const debugData = await debugRes.json()
    console.log("🛠️ MODELOS DISPONÍVEIS NA SUA CHAVE:")
    console.log(debugData.models?.map((m: any) => m.name).filter((name: string) => name.includes("gemini")))
    // =======================================================================*/

    const tools: Tool[] = [{
      functionDeclarations: [{
        name: "get_alocacao_sugestao",
        description: "Busca os melhores operadores disponíveis no banco de dados para um determinado posto e linha, retornando seus níveis de habilidade e total de dias presentes nos últimos 30 dias.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            linha: { type: SchemaType.STRING, description: "O nome do modelo de produção (ex: ARCON, CAIXA AMPLIFICADA, TV)" },
            posto: { type: SchemaType.STRING, description: "O nome do posto de trabalho ou habilidade (ex: Soldagem, Embalagem)" }
          },
          required: ["linha", "posto"]
        } as any 
      }]
    }]

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: `Você é um Consultor Industrial de elite integrado ao sistema Skill Map.
Sua missão é ajudar os gestores a tomarem decisões sobre alocação de operadores.
SEMPRE que o usuário perguntar quem deve ser alocado em um posto e linha específicos, USE A FERRAMENTA 'get_alocacao_sugestao'.
Ao receber os dados da ferramenta, analise:
- O nível de habilidade (skill_level de 1 a 5, onde 5 é Instrutor e 1 é Sem Experiência).
- A frequência (presencas nos últimos 30 dias).
Gere um pequeno ranking justificando sua escolha. Seja direto, profissional e responda em português.`,
      tools
    })

    const chat = model.startChat()
    
    const result = await chat.sendMessage(message)
    const response = result.response
    const functionCalls = response.functionCalls()

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      
      if (call.name === "get_alocacao_sugestao") {
        const args = call.args as { linha: string, posto: string }

        const { data, error } = await supabase.rpc('get_alocacao_sugestao', {
          p_linha: args.linha,
          p_posto: args.posto
        })

        if (error) {
          throw new Error(`Erro no Supabase (get_alocacao_sugestao): ${error.message}`)
        }

        const finalResult = await chat.sendMessage([{
          functionResponse: {
            name: "get_alocacao_sugestao",
            response: { content: data || [] }
          }
        }])

        return NextResponse.json({ reply: finalResult.response.text() })
      }
    }

    return NextResponse.json({ reply: response.text() })

  } catch (error: any) {
    console.error("Erro no Chatbot AI:", error)
    // DEVOLVENDO O ERRO REAL PARA A TELA:
    return NextResponse.json({ 
      error: error.message || "Ocorreu um erro desconhecido no servidor da IA." 
    }, { status: 500 })
  }
}