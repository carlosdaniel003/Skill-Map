// src/components/ai/AIExpandedView.tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AIExpandedViewProps {
  content: string
  onClose: () => void
}

export default function AIExpandedView({ content, onClose }: AIExpandedViewProps) {
  return (
    <div className="emergencyModalOverlay" onClick={onClose}>
      <div 
        className="emergencyModalCard" 
        style={{ maxWidth: '800px', width: '95%' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="emergencyHeader">
          <div className="emergencyTitle">
            <div className="emergencyIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3>Análise Detalhada (IA)</h3>
          </div>
          <button className="closeEmergencyBtn" onClick={onClose} title="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="emergencyBody" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="markdown-body expanded-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}