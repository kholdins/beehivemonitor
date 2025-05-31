"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Zap, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await fetch("/api/auth/verify")
        if (response.ok) {
          // User is already logged in, redirect to dashboard
          router.replace("/dashboard")
        }
      } catch (error) {
        // User is not logged in, stay on login page
        console.log("No existing session")
      }
    }

    checkExistingSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Attempting login with code:", code.trim())

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      console.log("Login response status:", response.status)

      // Check if response is ok first
      if (!response.ok) {
        // Try to parse JSON error message
        try {
          const errorData = await response.json()
          setError(errorData.error || "Login failed")
        } catch {
          setError(`Login failed with status: ${response.status}`)
        }
        return
      }

      // Parse successful response
      const data = await response.json()
      console.log("Login response data:", data)

      if (data.success) {
        console.log("Login successful, redirecting to dashboard...")
        // Force a hard redirect to ensure the page loads
        window.location.href = "/dashboard"
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoCodeClick = (demoCode: string) => {
    setCode(demoCode)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Smart Beehive Dashboard</CardTitle>
          <CardDescription>Enter your access code to monitor your beehives</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Access Code
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Enter your farmer code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={loading}
                className="text-center font-mono text-lg tracking-wider"
                maxLength={20}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Access Codes:</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <button
                type="button"
                onClick={() => handleDemoCodeClick("FARM001")}
                className="font-mono bg-white px-2 py-1 rounded w-full text-left hover:bg-blue-100 transition-colors"
              >
                FARM001 - John Smith
              </button>
              <button
                type="button"
                onClick={() => handleDemoCodeClick("FARM002")}
                className="font-mono bg-white px-2 py-1 rounded w-full text-left hover:bg-blue-100 transition-colors"
              >
                FARM002 - Sarah Johnson
              </button>
              <button
                type="button"
                onClick={() => handleDemoCodeClick("FARM003")}
                className="font-mono bg-white px-2 py-1 rounded w-full text-left hover:bg-blue-100 transition-colors"
              >
                FARM003 - Mike Wilson
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">Click on any code above to use it</p>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700">💡 Tip: Access codes are automatically converted to uppercase</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
