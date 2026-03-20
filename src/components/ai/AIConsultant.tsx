// src/components/ai/AIConsultant.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import "./AIConsultant.css"

export default function AIConsultant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Olá! Sou o Assistente Industrial do Skill Map. Em qual linha e posto você precisa de ajuda para alocar operadores hoje?' }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userText = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }])
      } else {
        // AGORA ELE VAI TE DIZER EXATAMENTE O QUE QUEBROU:
        setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Falha técnica: ${data.error}` }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Erro na sua rede local ao tentar falar com a API." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante para abrir o chat */}
      {!isOpen && (
        <button className="ai-fab" onClick={() => setIsOpen(true)} title="Assistente IA">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
          </svg>
        </button>
      )}

      {/* Janela do Chat */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
              </svg>
              <span>Assistente IA</span>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message-row ${msg.role}`}>
                <div className="ai-bubble">
                  {msg.text}
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
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}