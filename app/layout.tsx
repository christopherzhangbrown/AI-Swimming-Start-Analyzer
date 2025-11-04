import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthButton } from "@/components/auth-button"
import Link from "next/link"
import { Activity } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Swim Start - Analyze Your Swimming Technique",
  description: "AI-powered swimming start analysis using pose detection",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-50 hover:text-blue-400 transition-colors">
              <Activity className="h-6 w-6" />
              <span className="font-bold text-lg">AI Swim Start</span>
            </Link>
            <AuthButton />
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
