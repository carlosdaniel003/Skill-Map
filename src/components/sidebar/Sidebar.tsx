"use client"

import "./Sidebar.css"
import SidebarItem from "./visual/SidebarItem"
import { logout, getSessionData } from "@/services/auth/sessionService"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const MENU = [
  { label:"Dashboard", path:"/dashboard" },
  { label:"Operadores", path:"/operators" },
  { label:"Validação", path:"/validation" },
  { label:"Acesso", path:"/access" }
]

/* mesma duração usada no sessionService */
const SESSION_DURATION = 30 * 60 * 1000

function formatTime(ms:number){

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${minutes.toString().padStart(2,"0")}:${secs
    .toString()
    .padStart(2,"0")}`

}

export default function Sidebar(){

  const router = useRouter()

  const [session,setSession] = useState<any>(null)

  const [username,setUsername] = useState("")
  const [sessionTime,setSessionTime] = useState("00:00")
  const [remainingTime,setRemainingTime] = useState("00:00")

  const [isWarning,setIsWarning] = useState(false)

  useEffect(()=>{

    const sessionData = getSessionData()

    if(!sessionData) return

    setSession(sessionData)
    setUsername(sessionData.user.username)

    const interval = setInterval(()=>{

      const now = Date.now()

      const elapsed = now - sessionData.loginTime
      const remaining = SESSION_DURATION - elapsed

      setSessionTime(formatTime(elapsed))

      if(remaining <= 0){

        logout()
        router.push("/login")
        return

      }

      setRemainingTime(formatTime(remaining))

      /* alerta quando faltar menos de 2 minutos */

      if(remaining < 2 * 60 * 1000){
        setIsWarning(true)
      }else{
        setIsWarning(false)
      }

    },1000)

    return ()=>clearInterval(interval)

  },[])

  function handleLogout(){

    logout()

    router.push("/login")

  }

  if(!session) return null

  const user = session.user

  const allowedMenu =
    user.role === "admin"
      ? MENU
      : MENU.filter(item =>
          user.allowedPages.includes(item.path)
        )

  return(

    <aside className="sidebar">

      <h2>Skill-Map</h2>

      <div className="sessionInfo">

        <div className="userName">
          {username}
        </div>

        <div className="sessionTimer">
          sessão {sessionTime}
        </div>

        <div
          className="sessionRemaining"
          style={{
            color: isWarning ? "red" : "inherit",
            fontWeight: isWarning ? "bold" : "normal"
          }}
        >
          expira em {remainingTime}
        </div>

      </div>

      {allowedMenu.map(item => (

        <SidebarItem
          key={item.path}
          label={item.label}
          link={item.path}
        />

      ))}

      <div className="logoutArea">

        <button
          className="logoutButton"
          onClick={handleLogout}
        >
          Sair
        </button>

      </div>

    </aside>

  )

}