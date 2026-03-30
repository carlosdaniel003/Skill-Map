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
  
  // Estado para monitorar o Caps Lock
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

  // Função que verifica se o Caps Lock está ativo quando o usuário digita
  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
  }

  return(
    <>
      <div className="modLoginPage">
        <div className="modLoginCard">
          
          <div className="modLoginHeader">
            <div className="modLoginIconWrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="32" height="32">
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="110" fontFamily="system-ui, sans-serif" fontWeight="800" fill="#ffffff">SM</text>
              </svg>
            </div>
            <h1>SkillMap</h1>
            <span>Plataforma de Gestão de Habilidades</span>
          </div>

          <form className="modLoginForm" onSubmit={handleSubmit}>
            
            <div className="modLoginInputWrapper">
              <svg className="modLoginInputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input 
                className="modLoginInput"
                placeholder="Usuário ou Matrícula"
                value={username}
                autoFocus
                onChange={e=>{
                  setUsername(e.target.value)
                  setError("")
                }}
              />
            </div>

            <div className="modLoginInputWrapper">
              <svg className="modLoginInputIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input 
                className="modLoginInput"
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={e=>{
                  setPassword(e.target.value)
                  setError("")
                }}
                onKeyDown={checkCapsLock}
                onKeyUp={checkCapsLock}
              />
              <button 
                className="modLoginTogglePassword"
                onClick={()=>setShowPassword(!showPassword)}
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {/* Aviso Visual do Caps Lock ligado */}
            {capsLockOn && (
              <div className="modLoginCapsLock">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/><path d="M5 22h14"/></svg>
                Caps Lock está ativado
              </div>
            )}

            {error && (
              <div className="modLoginError">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {error}
              </div>
            )}

            <div className="modLoginOptions">
              <label className="modLoginCheckbox">
                <input 
                  type="checkbox"
                  checked={rememberUser}
                  onChange={()=>setRememberUser(!rememberUser)}
                />
                <span className="modCheckmark"></span>
                <span className="modCheckLabel">Lembrar usuário</span>
              </label>
            </div>

            <button 
              className="modLoginButton"
              type="submit"
              disabled={!username || !password || loading}
            >
              {loading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modLoginSpinIcon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              )}
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </button>
          </form>

          <div className="modLoginFooter">
            <span>v1.0</span>
            <span>© 2026 SkillMap</span>
          </div>
        </div>

        {loading && (
          <div className="modLoginTransition">
            <div className="modLoginLoader" />
          </div>
        )}
      </div>

      {/* MODAL DE SESSÃO EXPIRADA */}
      {sessionExpiredModal && (
        <div className="modLoginModalOverlay">
          <div className="modLoginModal">
            
            <div className="modLoginModalHeader">
              <div className="modLoginModalIcon infoIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3>Sessão Encerrada</h3>
            </div>
            
            <div className="modLoginModalBody">
              <p>Por motivos de segurança, a sua sessão expirou devido à inatividade prolongada.</p>
              <p>Por favor, insira as suas credenciais novamente para acessar o sistema.</p>
            </div>
            
            <div className="modLoginModalFooter">
              <button 
                className="modLoginModalPrimaryBtn" 
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
      <div className="modLoginPage">
        <div className="modLoginTransition">
          <div className="modLoginLoader" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}