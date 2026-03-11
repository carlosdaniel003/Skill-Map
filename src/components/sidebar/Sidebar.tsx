// src/components/sidebar/Sidebar.tsx
"use client"

import "./Sidebar.css"
import { logout, getSessionData } from "@/services/auth/sessionService"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const MENU = [
  {
    label:"Dashboard",
    path:"/dashboard",
    icon:(
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    label:"Operadores",
    path:"/operators",
    icon:(
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="4"/>
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
      </svg>
    )
  },
  {
    label:"Acesso",
    path:"/access",
    icon:(
      <svg viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )
  }
]

const SESSION_DURATION = 30 * 60 * 1000

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

  const [loggingOut,setLoggingOut] = useState(false)
  const [navigating,setNavigating] = useState(false)

  const [collapsed,setCollapsed] = useState(true)

  useEffect(()=>{
    setNavigating(false)
  },[pathname])

  // Substitua o useEffect do cronômetro no seu src/components/sidebar/Sidebar.tsx
  useEffect(()=>{

    const sessionData = getSessionData()
    if(!sessionData) return

    setSession(sessionData)
    setUsername(sessionData.user.username)

    const interval = setInterval(()=>{

      const now = Date.now()
      
      // Calcula o tempo restante com base na data de expiração real da sessão
      const remaining = sessionData.expiresAt - now
      
      // O tempo total da sessão é 30 minutos (1.800.000 ms)
      const SESSION_DURATION = 30 * 60 * 1000
      const elapsed = SESSION_DURATION - remaining

      setSessionTime(formatTime(elapsed > 0 ? elapsed : 0))

      if(remaining <= 0){
        logout()
        router.push("/login?expired=true")
        return
      }

      setRemainingTime(formatTime(remaining))

      // Avisa quando faltarem menos de 2 minutos
      if(remaining < 2 * 60 * 1000){
        setIsWarning(true)
      }else{
        setIsWarning(false)
      }

    },1000)

    return ()=>clearInterval(interval)

  },[])

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

  if(!session) return null

  const user = session.user

  const allowedMenu = user.role === "admin"
      ? MENU
      : MENU.filter(item => user.allowedPages.includes(item.path))

  return(

    <>

      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""}`}
        onMouseEnter={()=>setCollapsed(false)}
        onMouseLeave={()=>setCollapsed(true)}
      >

        <div className="sidebarHeader">
          <h2>SM</h2>
          {!collapsed && (
            <span>SkillMap</span>
          )}
        </div>

        <div className="sessionCard">
          {!collapsed && (
            <>
              <div className="userName">
                {username}
              </div>
              <div className="sessionTimer">
                sessão {sessionTime}
              </div>
              <div
                className="sessionRemaining"
                style={{
                  color: isWarning ? "#d40000" : "#666666",
                  fontWeight: isWarning ? "600" : "normal"
                }}
              >
                expira em {remainingTime}
              </div>
            </>
          )}
        </div>

        <nav className="menuArea">

          {allowedMenu.map(item => {

            const active = pathname === item.path

            return(

              <div
                key={item.path}
                className={`menuItem ${active ? "active" : ""}`}
                onClick={()=>handleNavigate(item.path)}
              >

                <div className="menuIcon">
                  {item.icon}
                </div>

                {!collapsed && (
                  <span>{item.label}</span>
                )}

              </div>

            )

          })}

        </nav>

        <div className="logoutArea">

          <button
            className={`logoutButton ${collapsed ? "collapsedBtn" : ""}`}
            onClick={handleLogout}
            title="Sair do sistema"
          >
            {!collapsed ? (
              "Sair"
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
            )}
          </button>

        </div>

      </aside>

      {(loggingOut || navigating) && (
        <div className="pageTransition">
          <div className="pageLoader"/>
        </div>
      )}

    </>

  )

}