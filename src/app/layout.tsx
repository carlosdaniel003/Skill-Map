// src\app\layout.tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {

  title: "SkillMap I Gestão de Habilidades",
  description: "Sistema de análise de habilidades da produção"

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <html lang="pt-BR">

      <body>

        {children}

      </body>

    </html>

  )

}