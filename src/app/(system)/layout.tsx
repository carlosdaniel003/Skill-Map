// src\app\(system)\layout.tsx
"use client"

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

    alert("Sessão expirada. Faça login novamente.")

    router.push("/login")
    return

  }

  const allowed =
    user.role === "admin" ||
    user.allowedPages.some(page =>
      pathname.startsWith(page)
    )

  if(!allowed){

    alert("Você não tem acesso a esta página")

    router.push("/dashboard")

  }

},[pathname])

  return (

    <div style={{display:"flex"}}>

      <Sidebar />

      <main style={{
        marginLeft:"220px",
        width:"100%",
        padding:"30px"
      }}>

        {children}

      </main>

    </div>

  )

}