// src\services\auth\routeGuard.ts
import { getSession } from "./sessionService"

export function canAccess(path:string){

  const user = getSession()

  if(!user) return false

  return user.allowedPages.includes(path)

}