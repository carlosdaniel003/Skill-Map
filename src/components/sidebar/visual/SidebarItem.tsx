// src\components\sidebar\visual\SidebarItem.tsx
import "./SidebarItem.css"
import Link from "next/link"

interface Props {

  label:string
  link:string

}

export default function SidebarItem({label,link}:Props){

  return(

    <Link href={link} className="sidebarItem">

      {label}

    </Link>

  )

}