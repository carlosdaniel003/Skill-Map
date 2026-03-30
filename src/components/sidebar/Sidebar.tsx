// src/components/sidebar/Sidebar.tsx
"use client"

import "./Sidebar.css"
import { logout, getSessionData, renewSession, SESSION_DURATION_MS } from "@/services/auth/sessionService"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const MENU = [
  {
    label:"Dashboard",
    path:"/dashboard",
    icon:(
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    )
  },
  {
    label:"Operadores",
    path:"/operators",
    icon:(
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4"/>
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
      </svg>
    )
  },
  {
    label:"Frequência",
    path:"/attendance",
    icon:(
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    label:"Acesso",
    path:"/access",
    icon:(
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )
  }
]

function formatTime(ms:number){
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`
}

export default function Sidebar(){

  const router = useRouter()
  const pathname = usePathname()

  const [session,setSession] = useState<any>(null)

  const [username,setUsername] = useState("")
  const [sessionTime,setSessionTime] = useState("00:00")
  const [remainingTime,setRemainingTime] = useState("00:00")

  const [isWarning,setIsWarning] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)

  const [loggingOut,setLoggingOut] = useState(false)
  const [navigating,setNavigating] = useState(false)

  const [collapsed,setCollapsed] = useState(true)

  useEffect(()=>{
    setNavigating(false)
  },[pathname])

  useEffect(()=>{

    const interval = setInterval(()=>{
      const sessionData = getSessionData()
      
      if(!sessionData) {
        clearInterval(interval)
        return
      }

      setSession(sessionData)
      setUsername(sessionData.user.username)

      const now = Date.now()
      const remaining = sessionData.expiresAt - now
      const elapsed = SESSION_DURATION_MS - remaining

      setSessionTime(formatTime(elapsed > 0 ? elapsed : 0))

      if(remaining <= 0){
        clearInterval(interval)
        setShowRenewModal(false) 
        setRemainingTime("00:00")
        logout() 
        window.location.href = "/login?expired=true"
        return
      }

      setRemainingTime(formatTime(remaining))

      if(remaining < 2 * 60 * 1000){ // 2 minutos de aviso
        setIsWarning(true)
        setShowRenewModal(true)
      }else{
        setIsWarning(false)
        setShowRenewModal(false)
      }

    },1000)

    return ()=>clearInterval(interval)

  },[router])

  function handleNavigate(path:string){
    if(path === pathname) return
    setNavigating(true)
    router.push(path)
  }

  function handleLogout(){
    setLoggingOut(true)
    setTimeout(()=>{
      logout()
      router.push("/login")
    },800)
  }

  function handleRenewSession() {
    const sessionData = getSessionData()
    if(!sessionData || (sessionData.expiresAt - Date.now()) <= 0) {
        setShowRenewModal(false)
        logout()
        window.location.href = "/login?expired=true"
        return
    }

    renewSession()
    setShowRenewModal(false)
    setIsWarning(false)
  }

  if(!session) return null

  const user = session.user

  const allowedMenu = user.role === "master"
      ? MENU
      : MENU.filter(item => user.allowedPages.includes(item.path))

  return(
    <>
      <aside
        className={`modSidebar ${collapsed ? "collapsed" : ""}`}
        onMouseEnter={()=>setCollapsed(false)}
        onMouseLeave={()=>setCollapsed(true)}
      >
        <div className="modSidebarHeader">
          <div className="sidebarLogoWrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="36" height="36" className="sidebarLogo">
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="110" fontFamily="system-ui, sans-serif" fontWeight="800" fill="#ffffff">SM</text>
            </svg>
          </div>
          {!collapsed && (
            <span className="sidebarTitle">SkillMap</span>
          )}
        </div>

        <div className={`modSessionCard ${isWarning ? 'warningState' : ''}`}>
          {!collapsed ? (
            <>
              <div className="sessionUserInfo">
                <div className="sessionAvatar">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="sessionText">
                  <div className="userName">{username}</div>
                  <div className="sessionTimer">Sessão {sessionTime}</div>
                </div>
              </div>
              <div className="sessionRemainingBox">
                <div className="remainingDot"></div>
                <span>Expira em {remainingTime}</span>
              </div>
            </>
          ) : (
            <div className="collapsedSessionAvatar">
              {username ? username.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </div>

        <nav className="modMenuArea">
          {allowedMenu.map(item => {
            const active = pathname.startsWith(item.path)
            return(
              <div
                key={item.path}
                className={`modMenuItem ${active ? "active" : ""}`}
                onClick={()=>handleNavigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <div className="modMenuIcon">
                  {item.icon}
                </div>
                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </div>
            )
          })}
        </nav>

        <div className="modLogoutArea">
          <button
            className={`modLogoutButton ${collapsed ? "collapsedBtn" : ""}`}
            onClick={handleLogout}
            title="Sair do sistema"
          >
            {!collapsed ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                Sair da Conta
              </>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
            )}
          </button>
        </div>

      </aside>

      {/* MODAL MODERNO DE AVISO DE SESSÃO */}
      {showRenewModal && (
        <div className="modSidebarModalOverlay">
          <div className="modSidebarModal">
            
            <div className="modSidebarModalHeader">
              <div className="modSidebarModalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
              </div>
              <h3>Sessão Expirando</h3>
            </div>
            
            <div className="modSidebarModalBody">
              <p>Por inatividade, sua sessão irá expirar em <strong>{remainingTime}</strong>.</p>
              <p>Deseja renovar sua sessão para continuar trabalhando e não perder seus dados não salvos?</p>
            </div>
            
            <div className="modSidebarModalFooter">
              <button className="modSidebarGhostButton" onClick={handleLogout}>
                Sair Agora
              </button>
              <button className="modSidebarPrimaryButton" onClick={handleRenewSession}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                Renovar Sessão
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LOADER DE TRANSIÇÃO MODERNO */}
      {(loggingOut || navigating) && (
        <div className="modPageTransition">
          <div className="modPageLoader">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spinIcon">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        </div>
      )}

    </>
  )
}