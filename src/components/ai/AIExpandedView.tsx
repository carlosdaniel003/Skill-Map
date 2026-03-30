// src/components/ai/AIExpandedView.tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './AIExpandedView.css'

interface AIExpandedViewProps {
  content: string
  onClose: () => void
}

export default function AIExpandedView({ content, onClose }: AIExpandedViewProps) {
  return (
    <div className="modAiExpanded-overlay" onClick={onClose}>
      <div 
        className="modAiExpanded-card" 
        style={{ maxWidth: '800px', width: '95%' }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="modAiExpanded-header">
          <div className="modAiExpanded-title">
            <div className="modAiExpanded-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3>Análise Detalhada (IA)</h3>
          </div>
          
          <button className="modAiExpanded-closeBtn" onClick={onClose} title="Fechar Relatório">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modAiExpanded-body">
          <div className="modAiExpanded-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
        
      </div>
    </div>
  )
}