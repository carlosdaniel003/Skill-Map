// src/components/ai/AIConsultant.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import AIExpandedView from "./AIExpandedView"
import "./AIConsultant.css"

function isComplexResponse(text: string) {
  return (
    text.includes("|") ||
    text.length > 500 ||
    text.includes("##") ||
    text.includes("Ranking") ||
    text.split("\n").length > 10
  )
}

export default function AIConsultant() {
  const [isOpen, setIsOpen] = useState(false)
  // 🆕 NOVOS ESTADOS DE JANELA
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "Olá! Sou o Assistente Industrial do Skill Map. Em qual linha e posto você precisa de ajuda para alocar operadores hoje?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [expandedContent, setExpandedContent] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen, isMinimized, isFullscreen])

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userText = input.trim()
    setMessages((prev) => [...prev, { role: "user", text: userText }])
    setInput("")
    setIsLoading(true)
    
    // Se o usuário enviar mensagem enquanto minimizado, restaura a janela
    if (isMinimized) setIsMinimized(false)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }])
        
        if (isComplexResponse(data.reply)) {
          setExpandedContent(data.reply)
        }
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: `⚠️ Falha técnica: ${data.error}` }])
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", text: "Erro na sua rede local ao tentar falar com a API." }])
    } finally {
      setIsLoading(false)
    }
  }

  // 🔄 Funções de Controle da Janela
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    if (!isMinimized) setIsFullscreen(false) // Tira do fullscreen ao minimizar
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) setIsMinimized(false) // Restaura se estava minimizado
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
    setIsFullscreen(false)
  }

  return (
    <>
      {!isOpen && (
        <button className="ai-fab" onClick={() => setIsOpen(true)} title="Assistente IA">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className={`ai-chat-window ${isMinimized ? 'minimized' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
          
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
                <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
              </svg>
              <span>Assistente IA</span>
            </div>
            
            {/* 🆕 NOVOS CONTROLES DE JANELA */}
            <div className="ai-window-controls">
              {/* Botão Minimizar */}
              <button className="ai-control-btn" onClick={toggleMinimize} title="Minimizar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              
              {/* Botão Tela Cheia / Restaurar */}
              <button className="ai-control-btn" onClick={toggleFullscreen} title={isFullscreen ? "Restaurar tamanho" : "Tela Cheia"}>
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                )}
              </button>

              {/* Botão Fechar */}
              <button className="ai-control-btn close" onClick={handleClose} title="Fechar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div className="ai-chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message-row ${msg.role}`}>
                <div className="ai-bubble-container">
                  <div className={`ai-bubble markdown-body ${msg.role}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'ai' && (
                    <button className="ai-expand-btn" onClick={() => setExpandedContent(msg.text)} title="Visualizar em tela cheia">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                      Expandir
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message-row ai">
                <div className="ai-bubble loading">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-footer">
            <input
              type="text"
              placeholder="Pergunte sobre operadores..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
      )}

      {expandedContent && (
        <AIExpandedView 
          content={expandedContent} 
          onClose={() => setExpandedContent(null)} 
        />
      )}
    </>
  )
}