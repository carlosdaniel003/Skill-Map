// src/app/(system)/access/page.tsx
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
  "/access"
]

export default function AccessPage(){

  const [users,setUsers] = useState<User[]>([])

  const [username,setUsername] = useState("")
  const [password,setPassword] = useState("")
  const [allowedPages,setAllowedPages] = useState<string[]>([])

  const [visiblePasswords,setVisiblePasswords] = useState<Record<string,boolean>>({})

  // Estados para modais e alertas
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)
  const [promptConfig, setPromptConfig] = useState<{title: string, onConfirm: (val: string) => void} | null>(null)
  const [promptValue, setPromptValue] = useState("")

  const sessionUser = getSession()

  useEffect(()=>{
    setUsers(getUsers())
  },[])

  function togglePage(page:string){
    if(allowedPages.includes(page)){
      setAllowedPages(allowedPages.filter(p=>p !== page))
    }else{
      setAllowedPages([...allowedPages,page])
    }
  }

  function createUser(){
    if(!username || !password){
      setAlertConfig({
        title: "Atenção",
        message: "Preencha usuário e senha."
      })
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
      setAlertConfig({
        title: "Ação não permitida",
        message: "O usuário MASTER não pode ser removido."
      })
      return
    }

    if(user?.role === "admin"){
      setAlertConfig({
        title: "Ação não permitida",
        message: "Admins não podem ser removidos por aqui."
      })
      return
    }

    setConfirmConfig({
      title: "Desativar Usuário",
      message: `Tem certeza que deseja desativar o usuário ${user?.username}?`,
      onConfirm: () => {
        const updated = users.filter(u => u.id !== id)
        saveUsers(updated)
        setUsers(updated)
        logAction(
          sessionUser?.username || "unknown",
          "remove_user",
          user?.username
        )
      }
    })
  }

  function togglePassword(userId:string){
    setVisiblePasswords(prev=>({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  function changePassword(userId:string){
    const user = users.find(u=>u.id===userId)

    setPromptConfig({
      title: `Nova senha para ${user?.username}`,
      onConfirm: (newPassword) => {
        if(!newPassword) return

        const updated = users.map(u=>{
          if(u.id === userId){
            return {
              ...u,
              password:newPassword
            }
          }
          return u
        })

        saveUsers(updated)
        setUsers(updated)

        logAction(
          sessionUser?.username || "unknown",
          "change_password",
          user?.username
        )
      }
    })
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

    <div className="accessPage">

      <div className="pageHeader">
        <h1 className="accessTitle">Gerenciamento de Acesso</h1>
        <p className="accessSubtitle">Controle os usuários, permissões e monitore as ações do sistema.</p>
      </div>

      <div className="accessGrid">

        {/* CARD CRIAR USUÁRIO */}
        <div className="accessCard createUserCard">

          <h2>Criar Usuário</h2>

          <div className="formGroup">
            <input
              className="corporateInput"
              placeholder="Nome de Usuário"
              value={username}
              onChange={e=>setUsername(e.target.value)}
            />

            <input
              className="corporateInput"
              placeholder="Senha"
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
            />
          </div>

          <div className="permissionsGroup">
            <span className="groupLabel">Permissões de Acesso:</span>
            <div className="permissionsList">
              {ALL_PAGES.map(page=>(
                <label key={page} className="corporateCheckbox">
                  <input
                    type="checkbox"
                    checked={allowedPages.includes(page)}
                    onChange={()=>togglePage(page)}
                  />
                  <span>{page}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="primaryButton fullWidth"
            onClick={createUser}
            disabled={!username || !password}
          >
            Criar Usuário
          </button>

        </div>

        {/* CARD USUÁRIOS */}
        <div className="accessCard usersCard">

          <h2>Usuários Ativos</h2>

          <div className="tableWrapper">
            <table className="usersTable">

              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Senha</th>
                  <th>Páginas Permitidas</th>
                  <th className="alignRight">Ações</th>
                </tr>
              </thead>

              <tbody>
                {users.map(user=>(
                  <tr key={user.id}>

                    <td className="fontWeight600">{user.username}</td>

                    <td className="passwordCell">
                      <span className="pwdText">
                        {visiblePasswords[user.id] ? user.password : "••••••••"}
                      </span>
                      <button
                        className="iconButton"
                        onClick={()=>togglePassword(user.id)}
                        title={visiblePasswords[user.id] ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {visiblePasswords[user.id] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                            <line x1="2" x2="22" y1="2" y2="22"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </td>

                    <td>
                      <div className="inlinePermissions">
                        {ALL_PAGES.map(page=>(
                          <label key={page} className="corporateCheckbox smallCheckbox">
                            <input
                              type="checkbox"
                              checked={user.allowedPages.includes(page)}
                              onChange={()=>toggleUserPage(user.id,page)}
                              disabled={user.role === "admin"}
                            />
                            <span>{page.replace("/", "")}</span>
                          </label>
                        ))}
                      </div>
                    </td>

                    <td className="actionsCell">
                      <button
                        className="secondaryButton"
                        onClick={()=>changePassword(user.id)}
                      >
                        Nova Senha
                      </button>
                      <button
                        className="dangerButton"
                        onClick={()=>removeUser(user.id)}
                        disabled={user.role === "admin" || user.role === "master"}
                      >
                        Desativar
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>

        {/* AUDITORIA */}
        <div className="accessCard auditCard">
          <h2>Painel de Auditoria</h2>
          <AuditPanel />
        </div>

      </div>

      {/* =========================================
          MODAIS CORPORATIVOS 
          ========================================= */}

      {/* ALERT MODAL */}
      {alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
              </div>
              <h3>{alertConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{alertConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button className="primaryButton" onClick={() => setAlertConfig(null)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3>{confirmConfig.title}</h3>
            </div>
            <div className="modalBody">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="modalFooter">
              <button className="secondaryButton" onClick={() => setConfirmConfig(null)}>
                Cancelar
              </button>
              <button 
                className="dangerButtonSolid" 
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {promptConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon infoIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>{promptConfig.title}</h3>
            </div>
            <div className="modalBody">
              <input
                autoFocus
                className="corporateInput"
                type="text"
                placeholder="Digite aqui..."
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
              />
            </div>
            <div className="modalFooter">
              <button 
                className="secondaryButton" 
                onClick={() => {
                  setPromptConfig(null);
                  setPromptValue("");
                }}
              >
                Cancelar
              </button>
              <button 
                className="primaryButton" 
                onClick={() => {
                  promptConfig.onConfirm(promptValue);
                  setPromptConfig(null);
                  setPromptValue("");
                }}
                disabled={!promptValue}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  )

}