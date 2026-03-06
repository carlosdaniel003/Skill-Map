// src\core\auth\authTypes.ts
export interface User {

  id:string
  username:string
  password:string
  role:string
  allowedPages:string[]

}