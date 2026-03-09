"use client"

import "./page.css"
import { useEffect, useState } from "react"

import { getUsers, saveUsers } from "@/services/auth/authRepository"
import { User } from "@/core/auth/authTypes"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

import AuditPanel from "@/components/audit/AuditPanel"

const ALL_PAGES = [
  "/dashboard",
  "/operators",
  "/validation",
  "/access"
]

export default function AccessPage(){

  const [users,setUsers] = useState<User[]>([])

  const [username,setUsername] = useState("")
  const [password,setPassword] = useState("")
  const [allowedPages,setAllowedPages] = useState<string[]>([])

  const [visiblePasswords,setVisiblePasswords] =
    useState<Record<string,boolean>>({})

  const sessionUser = getSession()

  useEffect(()=>{

    setUsers(getUsers())

  },[])

  function togglePage(page:string){

    if(allowedPages.includes(page)){

      setAllowedPages(
        allowedPages.filter(p=>p !== page)
      )

    }else{

      setAllowedPages([...allowedPages,page])

    }

  }

  function createUser(){

    if(!username || !password){

      alert("Preencha usuário e senha")
      return

    }

    const newUser:User = {

      id: Date.now().toString(),
      username,
      password,
      role:"user",
      allowedPages

    }

    const updated = [...users,newUser]

    saveUsers(updated)

    setUsers(updated)

    logAction(
      sessionUser?.username || "unknown",
      "create_user",
      username
    )

    setUsername("")
    setPassword("")
    setAllowedPages([])

  }

  function removeUser(id:string){

    const user = users.find(u => u.id === id)

    if(user?.role === "master"){

      alert("O usuário MASTER não pode ser removido")
      return

    }

    if(user?.role === "admin"){

      alert("Admins não podem ser removidos por aqui")
      return

    }

    const updated = users.filter(
      u => u.id !== id
    )

    saveUsers(updated)

    setUsers(updated)

    logAction(
      sessionUser?.username || "unknown",
      "remove_user",
      user?.username
    )

  }

  function togglePassword(userId:string){

    setVisiblePasswords(prev=>({

      ...prev,
      [userId]: !prev[userId]

    }))

  }

  function changePassword(userId:string){

    const newPassword = prompt("Nova senha:")

    if(!newPassword) return

    const user = users.find(u=>u.id===userId)

    const updated = users.map(user=>{

      if(user.id === userId){

        return {

          ...user,
          password:newPassword

        }

      }

      return user

    })

    saveUsers(updated)

    setUsers(updated)

    logAction(
      sessionUser?.username || "unknown",
      "change_password",
      user?.username
    )

  }

  function toggleUserPage(userId:string,page:string){

    const updated = users.map(user=>{

      if(user.id !== userId) return user

      const hasPage = user.allowedPages.includes(page)

      const pages = hasPage
        ? user.allowedPages.filter(p=>p !== page)
        : [...user.allowedPages,page]

      return {

        ...user,
        allowedPages:pages

      }

    })

    saveUsers(updated)

    setUsers(updated)

    logAction(
      sessionUser?.username || "unknown",
      "update_permissions",
      userId
    )

  }

  return(

    <div className="page">

      <h1>Gerenciamento de Acesso</h1>

      <div className="createUser">

        <input
          placeholder="Usuário"
          value={username}
          onChange={e=>setUsername(e.target.value)}
        />

        <input
          placeholder="Senha"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <div className="permissions">

          {ALL_PAGES.map(page=>(

            <label key={page}>

              <input
                type="checkbox"
                checked={allowedPages.includes(page)}
                onChange={()=>togglePage(page)}
              />

              {page}

            </label>

          ))}

        </div>

        <button onClick={createUser}>
          Criar Usuário
        </button>

      </div>

      <h2>Usuários</h2>

      <table>

        <thead>
          <tr>
            <th>Usuário</th>
            <th>Senha</th>
            <th>Páginas</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>

          {users.map(user=>(

            <tr key={user.id}>

              <td>{user.username}</td>

              <td>

                {visiblePasswords[user.id]
                  ? user.password
                  : "••••••••"}

                <button
                  onClick={()=>togglePassword(user.id)}
                >
                  👁
                </button>

              </td>

              <td>

                {ALL_PAGES.map(page=>(

                  <label key={page} style={{marginRight:10}}>

                    <input
                      type="checkbox"
                      checked={user.allowedPages.includes(page)}
                      onChange={()=>toggleUserPage(user.id,page)}
                    />

                    {page}

                  </label>

                ))}

              </td>

              <td>

                <button
                  onClick={()=>changePassword(user.id)}
                >
                  Alterar Senha
                </button>

                <button
                  onClick={()=>removeUser(user.id)}
                >
                  Desativar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* Painel de Auditoria Modular */}

      <AuditPanel />

    </div>

  )

}