// src/services/auth/authService.ts

import { findUser, saveUsers, getUsers } from "./authRepository"
import { User } from "@/core/auth/authTypes"

/*
Inicializa usuários padrão do sistema.
Somente executa se o banco local ainda estiver vazio.
*/
export function initializeUsers(){

  const users = getUsers()

  if(users.length > 0) return

  const defaultUsers:User[] = [

    /* MASTER ADMIN - controle total do sistema */
    {
      id:"0",
      username:"master",
      password:"master123",
      role:"master",
      allowedPages:[
        "/dashboard",
        "/operators",
        "/access"
      ]
    },

    /* ADMIN PADRÃO */
    {
      id:"1",
      username:"admin",
      password:"admin",
      role:"admin",
      allowedPages:[
        "/dashboard",
        "/operators",
      ]
    }

  ]

  saveUsers(defaultUsers)

}

/*
Autenticação de usuário
*/
export function authenticate(
  username:string,
  password:string
):User | null{

  const user = findUser(username)

  if(!user) return null

  if(user.password !== password) return null

  return user

}

/*
Verifica se usuário é MASTER
*/
export function isMaster(user:User){

  return user.role === "master"

}

/*
Verifica se usuário é ADMIN
*/
export function isAdmin(user:User){

  return user.role === "admin" || user.role === "master"

}