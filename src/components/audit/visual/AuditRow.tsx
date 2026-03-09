// src/components/audit/visual/AuditRow.tsx
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

// Função para definir a cor da etiqueta (badge) baseada na ação
function getActionBadgeClass(action:string){
  if(action.includes("create")) return "badge-success"
  if(action.includes("remove")) return "badge-danger"
  if(action.includes("update") || action.includes("change")) return "badge-warning"
  
  return "badge-neutral"
}

// Função para separar a data da hora de forma elegante
function formatDateTime(isoString: string | number | Date) {
  const dateObj = new Date(isoString);
  return {
    date: dateObj.toLocaleDateString(),
    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
}

export default function AuditRow({log}:Props){

  const { date, time } = formatDateTime(log.time)

  return(

    <tr className="auditRow">

      <td>
        <div className="dateTimeCell">
          <span className="auditDate">{date}</span>
          <span className="auditTime">{time}</span>
        </div>
      </td>

      <td className="auditUser">
        {log.user}
      </td>

      <td>
        <span className={`auditBadge ${getActionBadgeClass(log.action)}`}>
          {translateAction(log.action)}
        </span>
      </td>

      <td>
        <span className={!log.target ? "emptyText" : "targetBadge"}>
          {log.target || "N/A"}
        </span>
      </td>

      <td>
        <span className={!log.duration ? "emptyText" : ""}>
          {log.duration ? `${log.duration}ms` : "-"}
        </span>
      </td>

    </tr>

  )

}