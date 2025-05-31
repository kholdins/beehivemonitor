"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Thermometer, Droplets, Sun, Activity, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"

interface ComparisonData {
  beehives: any[]
  historicalData: any[]
  beeActivityData: any[]
}

export default function ComparisonDashboard() {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComparisonData()
    const interval = setInterval(fetchComparisonData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchComparisonData = async () => {
    try {
      const response = await fetch("/api/dashboard/comparison")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Error fetching comparison data:", error)
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Data</h1>
          <Button onClick={fetchComparisonData}>Retry</Button>
        </div>
      </div>
    )
  }

  const { beehives, historicalData, beeActivityData } = data

  // Prepare chart data
  const tempComparisonData = historicalData.reduce((acc, item) => {
    const hour = new Date(item.hour).toLocaleTimeString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    })

    const existing = acc.find((d) => d.hour === hour)
    if (existing) {
      existing[`hive_${item.beehive_id}_temp`] = Number.parseFloat(item.avg_temp)
    } else {
      acc.push({
        hour,
        [`hive_${item.beehive_id}_temp`]: Number.parseFloat(item.avg_temp),
      })
    }
    return acc
  }, [])

  const beeActivityComparisonData = beeActivityData.reduce((acc, item) => {
    const hour = new Date(item.hour).toLocaleTimeString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    })

    const existing = acc.find((d) => d.hour === hour)
    if (existing) {
      existing[`hive_${item.beehive_id}_bees`] = Number.parseFloat(item.avg_bee_count)
    } else {
      acc.push({
        hour,
        [`hive_${item.beehive_id}_bees`]: Number.parseFloat(item.avg_bee_count),
      })
    }
    return acc
  }, [])

  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Beehive Comparison Dashboard</h1>
              <p className="text-gray-600">Compare all your beehives at a glance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/dashboard/manage">
                <Button variant="outline">Manage Hives</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Beehive Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {beehives.map((hive, index) => {
            const isDeviceOnline =
              hive.device_active && hive.last_seen && new Date(hive.last_seen).getTime() > Date.now() - 15 * 60 * 1000

            return (
              <Card key={hive.id} className="bg-white shadow-lg border-amber-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{hive.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {isDeviceOnline ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                      {hive.recent_alerts > 0 && <Badge variant="destructive">{hive.recent_alerts}</Badge>}
                    </div>
                  </div>
                  <CardDescription>{hive.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-600">Temperature</p>
                        <p className="font-semibold">{hive.inside_temp ? `${hive.inside_temp.toFixed(1)}°C` : "--"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Humidity</p>
                        <p className="font-semibold">
                          {hive.inside_humidity ? `${hive.inside_humidity.toFixed(1)}%` : "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm text-gray-600">Light</p>
                        <p className="font-semibold">{hive.light_level || "--"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm text-gray-600">Bees</p>
                        <p className="font-semibold">{hive.bee_count || "--"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/dashboard/${hive.id}`}>
                      <Button size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Temperature Comparison Chart */}
        <Card className="bg-white shadow-lg border-amber-200 mb-8">
          <CardHeader>
            <CardTitle>Temperature Comparison (7 Days)</CardTitle>
            <CardDescription>Inside temperature trends across all beehives</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={tempComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                {beehives.map((hive, index) => (
                  <Line
                    key={hive.id}
                    type="monotone"
                    dataKey={`hive_${hive.id}_temp`}
                    stroke={colors[index % colors.length]}
                    name={hive.name}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bee Activity Comparison Chart */}
        <Card className="bg-white shadow-lg border-amber-200 mb-8">
          <CardHeader>
            <CardTitle>Bee Activity Comparison (7 Days)</CardTitle>
            <CardDescription>Bee activity levels across all beehives</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={beeActivityComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                {beehives.map((hive, index) => (
                  <Line
                    key={hive.id}
                    type="monotone"
                    dataKey={`hive_${hive.id}_bees`}
                    stroke={colors[index % colors.length]}
                    name={hive.name}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Current Status Summary */}
        <Card className="bg-white shadow-lg border-amber-200">
          <CardHeader>
            <CardTitle>Current Status Summary</CardTitle>
            <CardDescription>Latest readings from all beehives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Beehive</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Temperature</th>
                    <th className="text-left p-2">Humidity</th>
                    <th className="text-left p-2">Light</th>
                    <th className="text-left p-2">Bees</th>
                    <th className="text-left p-2">Alerts</th>
                    <th className="text-left p-2">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {beehives.map((hive) => {
                    const isDeviceOnline =
                      hive.device_active &&
                      hive.last_seen &&
                      new Date(hive.last_seen).getTime() > Date.now() - 15 * 60 * 1000

                    return (
                      <tr key={hive.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{hive.name}</p>
                            <p className="text-sm text-gray-600">{hive.location}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            {isDeviceOnline ? (
                              <Badge className="bg-green-500">Online</Badge>
                            ) : (
                              <Badge variant="secondary">Offline</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{hive.inside_temp ? `${hive.inside_temp.toFixed(1)}°C` : "--"}</td>
                        <td className="p-2">{hive.inside_humidity ? `${hive.inside_humidity.toFixed(1)}%` : "--"}</td>
                        <td className="p-2">{hive.light_level || "--"}</td>
                        <td className="p-2">{hive.bee_count || "--"}</td>
                        <td className="p-2">
                          {hive.recent_alerts > 0 ? (
                            <Badge variant="destructive">{hive.recent_alerts}</Badge>
                          ) : (
                            <Badge variant="secondary">None</Badge>
                          )}
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {hive.last_reading ? new Date(hive.last_reading).toLocaleString() : "Never"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
