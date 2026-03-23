// src/components/ai/AIExpandedView.tsx
"use client"

import React, { useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props {
  content: string
  onClose: () => void
}

export default function AIExpandedView({ content, onClose }: Props) {
  
  // Fecha com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div className="ai-expanded-overlay" onClick={onClose}>
      <div className="ai-expanded-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="ai-expanded-header">
          <div className="ai-expanded-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            <span>Relatório Analítico de IA</span>
          </div>
          <button onClick={onClose} className="ai-expanded-close" title="Fechar (ESC)">✕</button>
        </div>

        {/* Classe especial "expanded-markdown" para formatar tabelas grandes */}
        <div className="ai-expanded-body expanded-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

      </div>
    </div>
  )
}