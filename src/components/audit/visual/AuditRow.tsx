import "./AuditRow.css"
import { AuditLog } from "@/services/audit/auditService"

interface Props{
  log:AuditLog
}

const ACTION_LABELS:Record<string,string> = {

  login: "Login no sistema",

  logout: "Logout do sistema",

  session_expired: "Sessão expirada",

  create_user: "Criou usuário",

  remove_user: "Removeu usuário",

  change_password: "Alterou senha",

  update_permissions: "Alterou permissões"

}

function translateAction(action:string){

  return ACTION_LABELS[action] || action

}

export default function AuditRow({log}:Props){

  return(

    <tr>

      <td>
        {new Date(log.time).toLocaleString()}
      </td>

      <td>
        {log.user}
      </td>

      <td>
        {translateAction(log.action)}
      </td>

      <td>
        {log.target || "-"}
      </td>

      <td>
        {log.duration || "-"}
      </td>

    </tr>

  )

}