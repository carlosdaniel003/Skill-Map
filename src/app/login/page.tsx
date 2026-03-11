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
  const [showPassword,setShowPassword] = useState(false)

  const [rememberUser,setRememberUser] = useState(false)

  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  useEffect(()=>{

  initializeUsers()

  const savedUser = localStorage.getItem("rememberUser")

  if(savedUser){
    setUsername(savedUser)
    setRememberUser(true)
  }

  const expired = localStorage.getItem("sessionExpired")

if(expired === "true"){

  setError("Sua sessão expirou. Faça login novamente.")

  localStorage.removeItem("sessionExpired")

}

},[])

  function handleLogin(){

    setError("")

    const user = authenticate(username,password)

    if(!user){
      setError("Usuário ou senha inválidos")
      return
    }

    setLoading(true)

    saveSession(user)

    logAction(user.username,"login")

    if(rememberUser){
      localStorage.setItem("rememberUser",username)
    }else{
      localStorage.removeItem("rememberUser")
    }

    setTimeout(()=>{
      router.push("/dashboard")
    },800)

  }

  function handleSubmit(e:React.FormEvent){

    e.preventDefault()

    if(!username || !password) return

    handleLogin()

  }

  return(

    <div className="loginPage">

      <div className="loginCard">

        <div className="loginHeader">
          <h1>SkillMap</h1>
          <span>Plataforma de Gestão de Habilidades</span>
        </div>

        <form 
          className="loginForm"
          onSubmit={handleSubmit}
        >

          <input 
            placeholder="Usuário ou Matrícula"
            value={username}
            autoFocus
            onChange={e=>{
              setUsername(e.target.value)
              setError("")
            }}
          />

          <div className="passwordField">
            
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={e=>{
                setPassword(e.target.value)
                setError("")
              }}
            />

            <button 
              className="togglePassword"
              onClick={()=>setShowPassword(!showPassword)}
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                /* SVG: Eye Off (Ocultar) */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              ) : (
                /* SVG: Eye (Mostrar) */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>

          </div>

          {error && (
            <div className="loginError">
              {error}
            </div>
          )}

          <div className="loginOptions">
            <label>
              <input 
                type="checkbox"
                checked={rememberUser}
                onChange={()=>setRememberUser(!rememberUser)}
              />
              Lembrar usuário
            </label>
          </div>

          <button 
            className="loginButton"
            type="submit"
            disabled={!username || !password || loading}
          >
            {loading ? "Entrando..." : "Entrar no Sistema"}
          </button>

        </form>

        <div className="loginFooter">
          <span>v1.0</span>
          <span>© 2026 SkillMap</span>
        </div>

      </div>

      {loading && (
        <div className="loginTransition">
          <div className="loginLoader"/>
        </div>
      )}

    </div>

  )

}