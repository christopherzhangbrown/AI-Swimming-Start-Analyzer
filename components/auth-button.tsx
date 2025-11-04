"use client"

import { Button } from "@/components/ui/button"

export function AuthButton() {
  // Simple version without Supabase for now
  // You can add Supabase integration later

  return (
    <Button 
      variant="ghost"
      className="text-slate-300 hover:text-slate-50 hover:bg-slate-800"
      disabled
    >
      Sign In (Coming Soon)
    </Button>
  )
}
