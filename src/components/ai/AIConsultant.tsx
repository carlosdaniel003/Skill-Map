// src/components/ai/AIConsultant.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import AIExpandedView from "./AIExpandedView"
import "./AIConsultant.css"
import { useDashboardFilters } from "@/app/(system)/dashboard/context/DashboardFilterContext"

// 🛠️ FUNÇÃO MELHORADA PARA DETECTAR LISTAS E TABELAS
function isComplexResponse(text: string) {
  const hasTable = text.includes("|") && text.includes("---"); // Padrão Markdown de tabela
  const hasList = /\n\s*[-*]\s/.test(text) || /\n\s*\d+\.\s/.test(text); // Padrão de listas Markdown

  return (
    hasTable ||
    hasList ||
    text.length > 500 ||
    text.includes("##") ||
    text.includes("Ranking") ||
    text.split("\n").length > 10
  )
}

export default function AIConsultant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "Olá! Sou o Assistente Industrial do Skill Map. Me diga qual linha, posto e qual tipo de análise você precisa. Ex: 'Quem pode fazer Soldagem na linha TV?'",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [expandedContent, setExpandedContent] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  let dashboardContext: { linha: string | null; operatorId: string | null; turno: string | null } = { 
    linha: null, 
    operatorId: null, 
    turno: null 
  }
  
  try {
    const filters = useDashboardFilters()
    if (filters) {
      dashboardContext = {
        linha: filters.filters.linha || null,
        operatorId: filters.filters.operatorId || null,
        turno: filters.filters.turno || null
      }
    }
  } catch {
    // Ignora se não estiver no dashboard
  }

  const scrollToBottom = () => {
    if (!isMinimized && !expandedContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen, isMinimized, isFullscreen, expandedContent])

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userText = input.trim()
    
    const recentHistory = messages
      .filter(m => !m.text.includes("Olá! Sou o Assistente Industrial"))
      .slice(-6)

    setMessages((prev) => [...prev, { role: "user", text: userText }])
    setInput("")
    setIsLoading(true)
    
    if (isMinimized) setIsMinimized(false)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText,
          history: recentHistory,
          dashboardContext: {
            linha: dashboardContext.linha,
            operatorId: dashboardContext.operatorId,
            turno: dashboardContext.turno
          }
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const reply = data.reply || "Desculpe, recebi dados mas não consegui formular uma resposta clara."
        setMessages((prev) => [...prev, { role: "ai", text: reply }])
        
        // Se a resposta tiver tabela ou lista, já abre o modal sozinho!
        if (isComplexResponse(reply)) {
          setExpandedContent(reply)
        }
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: `⚠️ Erro: ${data.error || "Falha desconhecida"}` }])
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      setMessages((prev) => [...prev, { role: "ai", text: "❌ Erro de conexão. Tente novamente." }])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    if (!isMinimized) setIsFullscreen(false)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) setIsMinimized(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
    setIsFullscreen(false)
  }

  return (
    <>
      {!isOpen && (
        <button className="ai-fab" onClick={() => setIsOpen(true)} title="Abrir Assistente IA">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className={`ai-chat-window ${isMinimized ? 'minimized' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
          
          {/* CABEÇALHO */}
          <div className="ai-chat-header" onClick={isMinimized ? toggleMinimize : undefined}>
            <div className="ai-header-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              <span>Assistente Industrial</span>
            </div>
            <div className="ai-window-controls" onClick={(e) => e.stopPropagation()}>
              <button className="ai-control-btn" onClick={toggleMinimize} title={isMinimized ? "Restaurar" : "Minimizar"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button className="ai-control-btn" onClick={toggleFullscreen} title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              </button>
              <button className="ai-control-btn close" onClick={handleClose} title="Fechar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* CORPO DO CHAT */}
          {!isMinimized && (
            <>
              <div className="ai-chat-body">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`ai-message-row ${msg.role}`}>
                    <div className="ai-bubble-container">
                      <div className={`ai-bubble ${msg.role}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                      {/* Botão de Ver Detalhes no Balão */}
                      {msg.role === "ai" && isComplexResponse(msg.text) && (
                        <button className="ai-expand-btn" onClick={() => setExpandedContent(msg.text)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2v20"/></svg>
                          Ver Detalhes (Tela Cheia)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="ai-message-row ai">
                    <div className="ai-bubble-container">
                      <div className="ai-bubble ai loading">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* RODAPÉ DO CHAT */}
              <div className="ai-chat-footer">
                <div className="ai-input-wrapper">
                  <input
                    type="text"
                    className="ai-input"
                    placeholder="Faça sua pergunta ao assistente..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button 
                    className="ai-send-btn" 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()}
                    title="Enviar Mensagem"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 🛠️ MODAL EXPANDIDO (Agora RENDERIZADO FORA DA JANELA DO CHAT) */}
      {expandedContent && (
        <AIExpandedView content={expandedContent} onClose={() => setExpandedContent(null)} />
      )}
    </>
  )
}