// src/app/(system)/layout.tsx
"use client"

import "./layout.css"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar/Sidebar"
import { getSession } from "@/services/auth/sessionService"

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()
  const pathname = usePathname()

  useEffect(()=>{

    const user = getSession()

    if(!user){
      /* Dica da Alice: No futuro, podemos trocar esse alert por um Toast elegante! */
      alert("Sessão expirada. Faça login novamente.")
      router.push("/login")
      return
    }

    const allowed =
      user.role === "admin" ||
      user.allowedPages.some(page => pathname.startsWith(page))

    if(!allowed){
      alert("Você não tem acesso a esta página")
      router.push("/dashboard")
    }

  },[pathname, router])

  return (

    <div className="systemLayout">

      <Sidebar />

      <main className="systemMain">
        {children}
      </main>

    </div>

  )

}