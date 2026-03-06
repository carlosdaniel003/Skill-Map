export interface AuditLog{

  time:number
  user:string
  action:string
  target?:string
  duration?:string

}

const STORAGE_KEY = "sigma_audit"

/* logs mais antigos que isso serão removidos */
const LOG_RETENTION_TIME = 24 * 60 * 60 * 1000 // 1 dia

/* limite máximo de logs */
const MAX_LOGS = 1000

function isBrowser(){
  return typeof window !== "undefined"
}

function cleanOldLogs(logs:AuditLog[]){

  const now = Date.now()

  return logs.filter(log =>
    now - log.time <= LOG_RETENTION_TIME
  )

}

function limitLogs(logs:AuditLog[]){

  if(logs.length <= MAX_LOGS) return logs

  return logs.slice(logs.length - MAX_LOGS)

}

function formatTarget(action:string,target?:string){

  if(!target) return ""

  switch(action){

    case "create_user":
      return `usuário: ${target}`

    case "remove_user":
      return `usuário: ${target}`

    case "change_password":
      return `usuário: ${target}`

    case "update_permissions":
      return `usuário: ${target}`

    default:
      return target

  }

}

export function logAction(
  user:string,
  action:string,
  target?:string,
  duration?:string
){

  if(!isBrowser()) return

  let logs:AuditLog[] =
    JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    )

  /* limpeza automática */
  logs = cleanOldLogs(logs)

  /* adiciona novo log */

  logs.push({

    time:Date.now(),
    user,
    action,
    target: formatTarget(action,target),
    duration: duration || ""

  })

  /* limite de logs */
  logs = limitLogs(logs)

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(logs)
  )

}

export function getLogs():AuditLog[]{

  if(!isBrowser()) return []

  let logs:AuditLog[] =
    JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    )

  /* limpeza ao ler também */
  logs = cleanOldLogs(logs)

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(logs)
  )

  return logs.sort((a,b)=>b.time-a.time)

}

export function clearLogs(){

  if(!isBrowser()) return

  localStorage.removeItem(STORAGE_KEY)

}