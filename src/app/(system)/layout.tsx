// src/app/(system)/layout.tsx
"use client"

import "./layout.css"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import { getSession } from "@/services/auth/sessionService"

// IMPORTAMOS O NOSSO ASSISTENTE IA AQUI
import AIConsultant from "@/components/ai/AIConsultant"

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()
  const pathname = usePathname()

  // Estado para controlar nosso Modal de Alerta Customizado
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string, redirectPath: string} | null>(null)

  useEffect(()=>{

    const user = getSession()

    if(!user){
      setAlertConfig({
        title: "Sessão Expirada",
        message: "Sua sessão expirou. Por favor, faça login novamente para continuar.",
        redirectPath: "/login"
      })
      return
    }

    // REGRA DE NEGÓCIO CORRIGIDA AQUI:
    // - MASTER tem acesso absoluto a qualquer URL do sistema.
    // - ADMIN e USER dependem estritamente do que o Master liberou no allowedPages.
    const allowed =
      user.role === "master" || 
      user.allowedPages.some((page: string) => pathname.startsWith(page))

    if(!allowed){
      setAlertConfig({
        title: "Acesso Restrito",
        message: "Você não tem permissão para acessar esta página. Redirecionando para o início...",
        redirectPath: "/dashboard"
      })
    }

  },[pathname, router])

  function handleAlertConfirm() {
    if(alertConfig){
      router.push(alertConfig.redirectPath)
      setAlertConfig(null) // Esconde o modal após o clique
    }
  }

  return (

    <div className="modSystemLayout">

      <Sidebar />

      <main className="modSystemMain">
        {children}
      </main>

      {/* O NOSSO ASSISTENTE VIRTUAL IA (FLUTUANTE) */}
      <AIConsultant />

      {/* NOSSO MODAL DE SISTEMA (Substitui os alerts nativos) */}
      {alertConfig && (
        <div className="modLayoutModalOverlay">
          <div className="modLayoutModal">
            
            <div className="modLayoutModalHeader">
              <div className="modLayoutModalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>{alertConfig.title}</h3>
            </div>
            
            <div className="modLayoutModalBody">
              <p>{alertConfig.message}</p>
            </div>
            
            <div className="modLayoutModalFooter">
              <button className="modLayoutPrimaryBtn" onClick={handleAlertConfirm}>
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>

  )

}