// src/services/ai/geminiService.ts
import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai";
import { supabase } from "../database/supabaseClient";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runDecisionAI(userInput: string) {
  // 1. Configura o modelo com a "Ferramenta" (Tool)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "Você é um consultor industrial. Sua missão é ajudar gestores a alocar operadores. Use a ferramenta get_alocacao_sugestao para buscar dados reais antes de responder. Analise skills e frequência.",
  });

  // 2. Define a função que a IA pode "chamar"
  const tools: Tool[] = [
    {
      functionDeclarations: [{
        name: "get_alocacao_sugestao",
        description: "Busca os melhores operadores para um determinado posto e linha baseado em skill e assiduidade.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            linha: { type: SchemaType.STRING, description: "Nome do modelo" },
            posto: { type: SchemaType.STRING, description: "Nome do posto" }
          },
          required: ["linha", "posto"]
        } as any // <-- O "as any" aqui resolve a limitação de tipagem da biblioteca do Google
      }]
    }
  ];

  const chat = model.startChat({ tools });

  // 3. Envia a pergunta do usuário
  const result = await chat.sendMessage(userInput);
  const response = result.response;
  const call = response.functionCalls()?.[0];

  // 4. Se a IA quiser chamar a função (Decisão de busca)
  if (call) {
    const { linha, posto } = call.args as any;
    
    // Busca os dados reais no Supabase
    const { data } = await supabase.rpc('get_alocacao_sugestao', { 
      p_linha: linha, 
      p_posto: posto 
    });

    // Envia os dados de volta para a IA finalizar a análise
    const finalResult = await chat.sendMessage([{
      functionResponse: {
        name: "get_alocacao_sugestao",
        response: { content: data }
      }
    }]);

    return finalResult.response.text();
  }

  return response.text();
}