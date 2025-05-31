"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, Plus, Settings, Wifi, WifiOff, Code, LogOut } from "lucide-react"
import Link from "next/link"

interface Beehive {
  id: number
  name: string
  location: string
  device_id: string | null
  device_name: string | null
  device_active: boolean
  last_seen: string | null
  recent_alerts: number
}

interface Farmer {
  id: number
  name: string
  email: string | null
  code: string
}

export default function Dashboard() {
  const router = useRouter()
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [beehives, setBeehives] = useState<Beehive[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (farmer) {
      fetchBeehives()
      const interval = setInterval(fetchBeehives, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [farmer])

  const checkAuth = async () => {
    try {
      console.log("Checking authentication...")
      const response = await fetch("/api/auth/verify")
      console.log("Auth verify response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Auth verify data:", data)
        setFarmer(data.farmer)
      } else {
        console.log("Auth verification failed, redirecting to login")
        router.replace("/login")
        return
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.replace("/login")
      return
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchBeehives = async () => {
    try {
      const response = await fetch("/api/beehives")
      if (response.ok) {
        const data = await response.json()
        setBeehives(data)
      }
    } catch (error) {
      console.error("Error fetching beehives:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/login"
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Authentication required</p>
          <Button onClick={() => router.replace("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-amber-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Beehive Dashboard</h1>
              <p className="text-gray-600">Welcome back, {farmer?.name} | Monitor and manage your beehive colonies</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Code: {farmer?.code}</span>
              <Link href="/dashboard/comparison">
                <Button variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Compare All Hives
                </Button>
              </Link>
              <Link href="/dashboard/manage">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Hives
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beehives</CardTitle>
              <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beehives.length}</div>
              <p className="text-xs text-muted-foreground">{beehives.filter((h) => h.device_id).length} with devices</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  beehives.filter((h) => {
                    return (
                      h.device_active && h.last_seen && new Date(h.last_seen).getTime() > Date.now() - 15 * 60 * 1000
                    )
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Active monitoring</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beehives.reduce((sum, h) => sum + h.recent_alerts, 0)}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Settings className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (beehives.filter((h) => h.device_id && h.device_active).length / Math.max(beehives.length, 1)) * 100,
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Beehives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beehives.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No beehives yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first beehive</p>
              <Link href="/dashboard/manage">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Beehive
                </Button>
              </Link>
            </div>
          ) : (
            beehives.map((hive) => {
              const isDeviceOnline =
                hive.device_active && hive.last_seen && new Date(hive.last_seen).getTime() > Date.now() - 15 * 60 * 1000

              return (
                <Card key={hive.id} className="bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{hive.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {hive.device_id ? (
                          isDeviceOnline ? (
                            <Wifi className="h-5 w-5 text-green-500" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <Badge variant="secondary">No device</Badge>
                        )}
                        {hive.recent_alerts > 0 && <Badge variant="destructive">{hive.recent_alerts} alerts</Badge>}
                      </div>
                    </div>
                    <CardDescription>{hive.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Device Status */}
                      {hive.device_id ? (
                        <div
                          className={`p-3 rounded-lg border ${
                            isDeviceOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <p className={`font-medium ${isDeviceOnline ? "text-green-800" : "text-red-800"}`}>
                            Device: {hive.device_name}
                          </p>
                          <p className={`text-sm ${isDeviceOnline ? "text-green-600" : "text-red-600"}`}>
                            Status: {isDeviceOnline ? "Online" : "Offline"}
                          </p>
                          {hive.last_seen && (
                            <p className={`text-sm ${isDeviceOnline ? "text-green-600" : "text-red-600"}`}>
                              Last seen: {new Date(hive.last_seen).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="font-medium text-yellow-800">No device linked</p>
                          <p className="text-sm text-yellow-600">Link an ESP32 device to start monitoring</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/${hive.id}`} className="flex-1">
                          <Button className="w-full" variant="outline">
                            View Dashboard
                          </Button>
                        </Link>
                        <Link href={`/manage?tab=beehives&settings=${hive.id}`}>
                          <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Getting Started Section */}
        {beehives.length > 0 && (
          <Card className="bg-white shadow-lg border-amber-200 mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your beehive monitoring system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/manage">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Plus className="h-6 w-6 mb-2" />
                    Add New Beehive
                  </Button>
                </Link>
                <Link href="/dashboard/comparison">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Activity className="h-6 w-6 mb-2" />
                    Compare All Hives
                  </Button>
                </Link>
                <Link href="/esp32-guide">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                    <Code className="h-6 w-6 mb-2" />
                    ESP32 Setup Guide
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
