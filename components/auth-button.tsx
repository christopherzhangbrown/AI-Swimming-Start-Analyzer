"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { signOut, onAuthStateChanged, type User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { LogOut, UserCircle } from "lucide-react"
import { AuthDialog } from "@/components/auth-dialog"

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="h-10 w-20 bg-slate-800 animate-pulse rounded" />
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || "User"} 
            className="h-10 w-10 rounded-full border-2 border-slate-700"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-slate-400" />
          </div>
        )}
        <span className="text-slate-200 text-sm hidden sm:inline">
          {user.displayName || user.email || "User"}
        </span>
        <Button 
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button 
        variant="default"
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => setShowAuthDialog(true)}
      >
        Sign In
      </Button>
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </>
  )
}
