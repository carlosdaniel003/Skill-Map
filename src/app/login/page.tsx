// src/app/login/page.tsx
"use client"

import "./page.css"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { authenticate, initializeUsers } from "@/services/auth/authService"
import { saveSession } from "@/services/auth/sessionService"
import { logAction } from "@/services/audit/auditService"

export default function LoginPage(){

  const router = useRouter()

  const [username,setUsername] = useState("")
  const [password,setPassword] = useState("")

  useEffect(()=>{

    /* garante criação do master e admin padrão */
    initializeUsers()

  },[])

  function handleLogin(){

    const user = authenticate(username,password)

    if(!user){

      alert("Usuário ou senha inválidos")
      return

    }

    /* salva sessão */
    saveSession(user)

    /* registra auditoria */
    logAction(
      user.username,
      "login"
    )

    /* redireciona */
    router.push("/dashboard")

  }

  return(

    <div className="loginPage">

      <h1>SkillMap</h1>

      <input
        placeholder="Usuário"
        value={username}
        onChange={e=>setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e=>setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Entrar
      </button>

    </div>

  )

}