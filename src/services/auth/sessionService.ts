// src\services\auth\sessionService.ts
import { User } from "@/core/auth/authTypes"
import { logAction } from "@/services/audit/auditService"

interface SessionData{
  user:User
  loginTime:number
}

const STORAGE_KEY = "sigma_session"

/* duração da sessão (30 minutos) */
const SESSION_DURATION = 30 * 60 * 1000

function isBrowser(){
  return typeof window !== "undefined"
}

function formatDuration(ms:number){

  const seconds = Math.floor(ms/1000)
  const minutes = Math.floor(seconds/60)
  const remainingSeconds = seconds % 60

  return `${minutes}m ${remainingSeconds}s`

}

export function saveSession(user:User){

  if(!isBrowser()) return

  const session:SessionData = {
    user,
    loginTime:Date.now()
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(session)
  )

}

export function getSession():User | null{

  const session = getSessionData()

  if(!session) return null

  if(isSessionExpired(session)){

    const duration = Date.now() - session.loginTime

    logAction(
      session.user.username,
      "session_expired",
      "",
      formatDuration(duration)
    )

    logout(false)

    return null

  }

  return session.user

}

export function getSessionData():SessionData | null{

  if(!isBrowser()) return null

  const raw = localStorage.getItem(STORAGE_KEY)

  if(!raw) return null

  return JSON.parse(raw)

}

export function isSessionExpired(session:SessionData){

  const now = Date.now()

  const diff = now - session.loginTime

  return diff > SESSION_DURATION

}

export function logout(registerLog:boolean = true){

  if(!isBrowser()) return

  const session = getSessionData()

  if(registerLog && session){

    const duration = Date.now() - session.loginTime

    logAction(
      session.user.username,
      "logout",
      "",
      formatDuration(duration)
    )

  }

  localStorage.removeItem(STORAGE_KEY)

}