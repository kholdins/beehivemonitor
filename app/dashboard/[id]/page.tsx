"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Thermometer, Droplets, Sun, Activity, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  beehive: {
    id: number
    name: string
    location: string
  }
  latestSensorData: {
    inside_temp: number | string
    inside_humidity: number | string
    outside_temp: number | string
    outside_humidity: number | string
    light_level: number | string
    system_active: boolean
    timestamp: string
  } | null
  sensorData: any[]
  beeFlowData: any[]
  alerts: any[]
  device: {
    device_id: string
    device_name: string
    is_active: boolean
    last_seen: string
  } | null
}

// Helper function to safely convert to number and format
const safeToFixed = (value: any, decimals = 1): string => {
  if (value === null || value === undefined || value === "") return "--"
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  if (isNaN(num)) return "--"
  return num.toFixed(decimals)
}

// Helper function to safely convert to number
const safeToNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(num) ? 0 : num
}

export default function BeehiveDashboard() {
  const params = useParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [params.id])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard/${params.id}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-amber-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !data.beehive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Beehive Not Found</h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { beehive, latestSensorData, sensorData, beeFlowData, alerts, device } = data

  // Format chart data with safe number conversion
  const chartData = sensorData.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    inside_temp: safeToNumber(item.inside_temp),
    inside_humidity: safeToNumber(item.inside_humidity),
    outside_temp: safeToNumber(item.outside_temp),
    outside_humidity: safeToNumber(item.outside_humidity),
    light_level: safeToNumber(item.light_level) / 100, // Scale down for better visualization
  }))

  const beeChartData = beeFlowData.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    bee_count: safeToNumber(item.bee_count),
  }))

  const isDeviceOnline =
    device && device.is_active && new Date(device.last_seen).getTime() > Date.now() - 15 * 60 * 1000 // 15 minutes

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{beehive.name}</h1>
              <p className="text-gray-600">{beehive.location}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isDeviceOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm text-gray-600">{device ? device.device_name : "No device"}</span>
              </div>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/compare">
                <Button variant="outline">Compare All Hives</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inside Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(latestSensorData?.inside_temp)}°C</div>
              <p className="text-xs text-muted-foreground">Hive internal temp</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outside Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(latestSensorData?.outside_temp)}°C</div>
              <p className="text-xs text-muted-foreground">
                Diff:{" "}
                {safeToFixed(
                  safeToNumber(latestSensorData?.inside_temp) - safeToNumber(latestSensorData?.outside_temp),
                )}
                °C
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inside Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(latestSensorData?.inside_humidity)}%</div>
              <p className="text-xs text-muted-foreground">Hive humidity</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outside Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(latestSensorData?.outside_humidity)}%</div>
              <p className="text-xs text-muted-foreground">
                Diff:{" "}
                {safeToFixed(
                  safeToNumber(latestSensorData?.inside_humidity) - safeToNumber(latestSensorData?.outside_humidity),
                )}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Light Level</CardTitle>
              <Sun className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(latestSensorData?.light_level, 0)}</div>
              <p className="text-xs text-muted-foreground">Lux units</p>
            </CardContent>
          </Card>
        </div>

        {/* Second row of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bee Activity</CardTitle>
              <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {beeFlowData.length > 0 ? safeToFixed(beeFlowData[beeFlowData.length - 1]?.bee_count, 0) : "--"}
              </div>
              <p className="text-xs text-muted-foreground">Active bees</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <div
                className={`w-3 h-3 rounded-full ${latestSensorData?.system_active ? "bg-green-500" : "bg-red-500"}`}
              ></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{latestSensorData?.system_active ? "Active" : "Inactive"}</div>
              <p className="text-xs text-muted-foreground">
                Last Update: {latestSensorData ? new Date(latestSensorData.timestamp).toLocaleTimeString() : "Never"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader>
              <CardTitle>Environmental Conditions (24h)</CardTitle>
              <CardDescription>Temperature, humidity, and light levels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inside_temp"
                    stroke="#ef4444"
                    name="Inside Temp (°C)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="outside_temp"
                    stroke="#f97316"
                    name="Outside Temp (°C)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="inside_humidity"
                    stroke="#3b82f6"
                    name="Inside Humidity (%)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="outside_humidity"
                    stroke="#06b6d4"
                    name="Outside Humidity (%)"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="light_level" stroke="#eab308" name="Light (x100)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-amber-200">
            <CardHeader>
              <CardTitle>Bee Activity (24h)</CardTitle>
              <CardDescription>Number of active bees over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={beeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bee_count"
                    stroke="#f59e0b"
                    name="Active Bees"
                    strokeWidth={3}
                    fill="#f59e0b"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card className="bg-white shadow-lg border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Recent Alerts</span>
            </CardTitle>
            <CardDescription>Latest alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent alerts</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium text-red-800">{alert.message}</p>
                      <p className="text-sm text-red-600">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant="destructive">{alert.alert_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-white shadow-lg border-amber-200 mt-6">
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
            <CardDescription>ESP32 device status and details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isDeviceOnline ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="font-medium">Device: {isDeviceOnline ? "Online" : "Offline"}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium">
                  Last Seen: {device ? new Date(device.last_seen).toLocaleTimeString() : "Never"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="font-medium">ID: {device ? device.device_id.substring(0, 8) + "..." : "None"}</span>
              </div>
            </div>
            {device && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Device ID:</strong> {device.device_id}
                  <br />
                  <strong>Device Name:</strong> {device.device_name}
                  <br />
                  <strong>Last Seen:</strong> {new Date(device.last_seen).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
