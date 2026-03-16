// src/app/(system)/access/page.tsx
"use client"

import "./page.css"
import { useEffect, useState } from "react"

import { 
  getUsers, 
  createUser, 
  deleteUser, 
  updateUserPassword, 
  updateUserPermissions,
  updateUserRole 
} from "@/services/auth/authRepository"
import { User } from "@/core/auth/authTypes"

import { logAction } from "@/services/audit/auditService"
import { getSession } from "@/services/auth/sessionService"

import AuditPanel from "@/components/audit/AuditPanel"

const ALL_PAGES = [
  "/dashboard",
  "/operators",
  "/attendance", 
  "/access"
]

export default function AccessPage(){

  const [users,setUsers] = useState<User[]>([])

  const [username,setUsername] = useState("")
  const [password,setPassword] = useState("")
  const [newUserRole,setNewUserRole] = useState("user")
  const [allowedPages,setAllowedPages] = useState<string[]>([])

  const [alertConfig, setAlertConfig] = useState<{title: string, message: string} | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => void} | null>(null)
  const [promptConfig, setPromptConfig] = useState<{title: string, onConfirm: (val: string) => void} | null>(null)
  const [promptValue, setPromptValue] = useState("")

  const sessionUser = getSession()
  const isMaster = sessionUser?.role === "master"
  const isAdmin = sessionUser?.role === "admin"

  useEffect(()=>{
    loadData()
  },[])

  async function loadData() {
    const data = await getUsers()
    setUsers(data)
  }

  function togglePage(page:string){
    if(allowedPages.includes(page)){
      setAllowedPages(allowedPages.filter(p=>p !== page))
    }else{
      setAllowedPages([...allowedPages,page])
    }
  }

  async function handleCreateUser(){
    if(!username || !password){
      setAlertConfig({
        title: "Atenção",
        message: "Por favor, preencha os campos de usuário e senha antes de continuar."
      })
      return
    }

    const roleToCreate = isMaster ? newUserRole : "user"

    const success = await createUser({
      username,
      password,
      role: roleToCreate,
      allowedPages
    })

    if (success) {
      await logAction(sessionUser?.username || "sistema", "create_user", `Conta criada para: ${username} (${roleToCreate.toUpperCase()})`)
      
      setUsername("")
      setPassword("")
      setNewUserRole("user")
      setAllowedPages([])
      await loadData()
      
      setAlertConfig({
        title: "Sucesso",
        message: "Usuário criado e registrado no banco de dados."
      })
    } else {
      setAlertConfig({
        title: "Erro",
        message: "Não foi possível criar o usuário. O nome de usuário já existe?"
      })
    }
  }

  function handleRemoveUser(id:string){
    const targetUser = users.find(u => u.id === id)

    if(targetUser?.role === "master"){
      setAlertConfig({
        title: "Ação Bloqueada",
        message: "A conta MASTER não pode ser removida do sistema."
      })
      return
    }

    if(isAdmin && targetUser?.role === "admin"){
      setAlertConfig({
        title: "Ação Bloqueada",
        message: "Um Administrador não tem privilégios para remover outro Administrador."
      })
      return
    }

    setConfirmConfig({
      title: "Remover Usuário",
      message: `Tem certeza que deseja excluir permanentemente o acesso de "${targetUser?.username}"?`,
      onConfirm: async () => {
        const success = await deleteUser(id)
        if (success) {
          await logAction(sessionUser?.username || "sistema", "remove_user", `Conta removida: ${targetUser?.username}`)
          await loadData()
        }
      }
    })
  }

  function handleChangePassword(userId:string){
    const targetUser = users.find(u=>u.id===userId)

    setPromptConfig({
      title: `Nova senha para ${targetUser?.username}`,
      onConfirm: async (newPassword) => {
        if(!newPassword) return

        const success = await updateUserPassword(userId, newPassword)
        
        if (success) {
          await logAction(sessionUser?.username || "sistema", "change_password", `Definiu nova senha para: ${targetUser?.username}`)
          setAlertConfig({
            title: "Sucesso",
            message: "Senha atualizada com sucesso."
          })
        } else {
          setAlertConfig({
            title: "Erro",
            message: "Falha ao atualizar a senha no banco de dados."
          })
        }
      }
    })
  }

  async function handleToggleUserPage(userId:string, page:string){
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser) return

    const hasPage = targetUser.allowedPages.includes(page)
    const newPages = hasPage
      ? targetUser.allowedPages.filter(p=>p !== page)
      : [...targetUser.allowedPages, page]

    setUsers(users.map(u => u.id === userId ? { ...u, allowedPages: newPages } : u))

    const success = await updateUserPermissions(userId, newPages)
    
    if (success) {
      const actionDesc = hasPage ? `Removeu acesso à ${page}` : `Concedeu acesso à ${page}`
      await logAction(sessionUser?.username || "sistema", "update_permissions", `${actionDesc} para ${targetUser.username}`)
    } else {
      await loadData()
      setAlertConfig({
        title: "Erro",
        message: "Falha ao sincronizar as permissões com o banco de dados."
      })
    }
  }

  async function handleChangeRole(userId:string, newRole:string){
    const targetUser = users.find(u => u.id === userId)
    if(!targetUser) return

    const success = await updateUserRole(userId, newRole)

    if(success) {
      await logAction(sessionUser?.username || "sistema", "update_permissions", `Alterou o cargo de ${targetUser.username} para ${newRole.toUpperCase()}`)
      await loadData()
      setAlertConfig({ 
        title: "Sucesso", 
        message: `Cargo de ${targetUser.username} alterado para ${newRole}.` 
      })
    } else {
      setAlertConfig({ 
        title: "Erro", 
        message: "Falha ao alterar o cargo no banco de dados." 
      })
    }
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
            
            {isMaster && (
              <select 
                className="corporateInput" 
                value={newUserRole} 
                onChange={e=>setNewUserRole(e.target.value)}
                title="Definir cargo"
              >
                <option value="user">Usuário Padrão</option>
                <option value="admin">Administrador (Admin)</option>
              </select>
            )}
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
            onClick={handleCreateUser}
            disabled={!username || !password}
          >
            Criar Usuário
          </button>
        </div>

        {/* CARD USUÁRIOS */}
        <div className="accessCard usersCard">
          <h2>Usuários Ativos</h2>
          <div className="tableWrapper">
            <table className="usersTable corporateTable">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Senha</th>
                  <th>Páginas Permitidas</th>
                  <th className="alignRight">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user=>{
                  
                  const isTargetMaster = user.role === "master";
                  const isTargetAdmin = user.role === "admin";
                  
                  // Apenas Admin comum fica bloqueado de mexer em Master ou outros Admins
                  const adminBlocked = isAdmin && (isTargetAdmin || isTargetMaster);

                  return(
                    <tr key={user.id}>
                      <td className="fontWeight600">
                        {user.username}
                        
                        {isTargetMaster && <span className="statusBadge badge-active" style={{marginLeft: 8}}>Master</span>}
                        
                        {!isTargetMaster && isMaster ? (
                          <select 
                            className="corporateInput"
                            style={{marginLeft: 8, padding: '2px 6px', fontSize: '11px', width: 'auto', display: 'inline-block'}}
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          >
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        ) : (
                          !isTargetMaster && isTargetAdmin && <span className="statusBadge badge-active" style={{marginLeft: 8}}>Admin</span>
                        )}
                      </td>

                      <td className="passwordCell">
                        <span className="pwdText">
                          ••••••••
                        </span>
                      </td>

                      <td>
                        <div className="inlinePermissions">
                          {ALL_PAGES.map(page=>(
                            <label key={page} className="corporateCheckbox smallCheckbox">
                              <input
                                type="checkbox"
                                // REGRA APLICADA: Se for master, mostra checked. Senão, olha no banco de dados.
                                checked={isTargetMaster ? true : user.allowedPages.includes(page)}
                                onChange={()=>handleToggleUserPage(user.id,page)}
                                // REGRA APLICADA: Master pode editar todo mundo (menos ele mesmo). Admin não edita outros Admins/Master.
                                disabled={isTargetMaster || adminBlocked}
                              />
                              <span>{page.replace("/", "")}</span>
                            </label>
                          ))}
                        </div>
                      </td>

                      <td className="actionsCell">
                        <button
                          className="secondaryButton smallButton"
                          onClick={()=>handleChangePassword(user.id)}
                          disabled={adminBlocked}
                        >
                          Nova Senha
                        </button>
                        <button
                          className="dangerButton smallButton"
                          onClick={()=>handleRemoveUser(user.id)}
                          disabled={isTargetMaster || adminBlocked}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      {/* MODAIS CORPORATIVOS (MANTIDOS) */}
      
      {alertConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className={`modalIcon ${alertConfig.title === "Sucesso" ? "successIcon" : "warningIcon"}`}>
                {alertConfig.title === "Sucesso" ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                     <polyline points="22 4 12 14.01 9 11.01"/>
                   </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" x2="12" y1="8" y2="12"/>
                    <line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                )}
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

      {confirmConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon warningIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/>
                  <line x1="12" x2="12.01" y1="17" y2="17"/>
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

      {promptConfig && (
        <div className="modalOverlay">
          <div className="corporateModal">
            <div className="modalHeader">
              <div className="modalIcon infoIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                placeholder="Digite a nova senha aqui..."
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
                Salvar Nova Senha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}