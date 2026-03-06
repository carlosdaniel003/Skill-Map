import "./OperatorRow.css"

interface Props{

  operator:any
  onRemove:(id:string)=>void

}

export default function OperatorRow({operator,onRemove}:Props){

  return(

    <tr>

      <td>{operator.matricula}</td>
      <td>{operator.nome}</td>
      <td>{operator.linhaAtual}</td>

      <td>

        <button
        onClick={()=>onRemove(operator.id)}
        >
          Remover
        </button>

      </td>

    </tr>

  )

}