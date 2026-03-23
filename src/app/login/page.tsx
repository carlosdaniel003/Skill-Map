// src/app/login/page.tsx
"use client"

import "./page.css"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authenticate } from "@/services/auth/authService"
import { saveSession } from "@/services/auth/sessionService"

function LoginContent(){

  const router = useRouter()
  const searchParams = useSearchParams()
  const [username,setUsername] = useState("")
  const [password,setPassword] = useState("")
  const [showPassword,setShowPassword] = useState(false)
  
  // 🆕 Estado para monitorar o Caps Lock
  const [capsLockOn, setCapsLockOn] = useState(false)

  const [rememberUser,setRememberUser] = useState(false)

  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")
  
  // Controle do modal de sessão expirada
  const [sessionExpiredModal, setSessionExpiredModal] = useState(false)

  useEffect(()=>{
    const savedUser = localStorage.getItem("rememberUser")

    if(savedUser){
      setUsername(savedUser)
      setRememberUser(true)
    }

    const expired = searchParams.get("expired")

    if(expired === "true"){
      setSessionExpiredModal(true)
      // Remove o parâmetro da URL para não ficar reabrindo se o usuário der F5
      router.replace("/login") 
    }
  },[searchParams, router])

  async function handleLogin(){
    setError("")
    setLoading(true)

    try {
      const user = await authenticate(username, password)

      if(!user){
        setError("Usuário ou senha inválidos")
        setLoading(false)
        return
      }

      saveSession(user)

      if(rememberUser){
        localStorage.setItem("rememberUser",username)
      }else{
        localStorage.removeItem("rememberUser")
      }

      setTimeout(()=>{
        router.push("/dashboard")
      }, 800)

    } catch (err) {
      console.error(err)
      setError("Erro ao conectar com o servidor.")
      setLoading(false)
    }
  }

  function handleSubmit(e:React.FormEvent){
    e.preventDefault()
    if(!username || !password) return
    handleLogin()
  }

  // 🆕 Função que verifica se o Caps Lock está ativo quando o usuário digita
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
  }

  return(
    <>
      <div className="loginPage">
        <div className="loginCard">
          <div className="loginHeader">
            <h1>SkillMap</h1>
            <span>Plataforma de Gestão de Habilidades</span>
          </div>

          <form className="loginForm" onSubmit={handleSubmit}>
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
                // 🆕 Eventos para capturar o Caps Lock enquanto digita
                onKeyDown={checkCapsLock}
                onKeyUp={checkCapsLock}
              />
              <button 
                className="togglePassword"
                onClick={()=>setShowPassword(!showPassword)}
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* 🆕 Aviso Visual do Caps Lock ligado */}
            {capsLockOn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d40000', fontSize: '13px', marginTop: '-4px', marginBottom: '8px', fontWeight: 600, animation: 'fadeIn 0.3s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"/><path d="m17 7-5-5-5 5"/><path d="M5 22h14"/>
                </svg>
                Caps Lock está ativado
              </div>
            )}

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

      {/* MODAL DE SESSÃO EXPIRADA */}
      {sessionExpiredModal && (
        <div className="loginModalOverlay">
          <div className="loginCorporateModal">
            
            <div className="loginModalHeader">
              <div className="loginModalIcon infoIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3>Sessão Encerrada</h3>
            </div>
            
            <div className="loginModalBody">
              <p>Por motivos de segurança, a sua sessão expirou devido à inatividade prolongada.</p>
              <p>Por favor, insira as suas credenciais novamente para acessar o sistema.</p>
            </div>
            
            <div className="loginModalFooter">
              <button 
                className="loginPrimaryButton" 
                onClick={() => setSessionExpiredModal(false)}
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

// COMPONENTE PRINCIPAL ENVOLVIDO EM SUSPENSE
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="loginPage">
        <div className="loginTransition">
          <div className="loginLoader" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}