"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { canAccess } from "@/services/auth/routeGuard"

export default function DashboardPage(){

  const router = useRouter()

  useEffect(()=>{

    if(!canAccess("/dashboard")){

      router.push("/login")

    }

  },[])

  return(

    <div className="page">

      <h1>Dashboard</h1>

    </div>

  )

}