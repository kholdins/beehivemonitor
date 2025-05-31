"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, BeakerIcon as Bee, ArrowLeft, RefreshCw, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts"

interface SensorData {
  id: number
  beehive_id: number
  inside_temp: number
  inside_humidity: number
  outside_temp: number
  outside_humidity: number
  light_level: number
  system_active: boolean
  timestamp: string
}

interface BeeFlowData {
  id: number
  beehive_id: number
  bee_count: number
  timestamp: string
}

interface Alert {
  id: number
  beehive_id: number
  alert_type: string
  message: string
  timestamp: string
}

interface Device {
  id: number
  device_id: string
  device_name: string
  beehive_id: number
  is_active: boolean
  last_seen: string
}

interface Beehive {
  id: number
  name: string
  location: string
  created_at: string
  sensorData: SensorData | null
  beeFlowData: BeeFlowData | null
  alerts: Alert[]
  device: Device | null
}

interface ComparisonData {
  beehives: Beehive[]
  temperatureHistory: SensorData[]
  humidityHistory: SensorData[]
  beeFlowHistory: BeeFlowData[]
}

// Color palette for charts
const COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
]

export default function ComparePage() {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBeehives, setSelectedBeehives] = useState<number[]>([])
  const [timeRange, setTimeRange] = useState<"6h" | "12h" | "24h">("12h")

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/all-beehives-data")
      const result = await response.json()
      setData(result)

      // Initially select all beehives
      if (result.beehives && result.beehives.length > 0) {
        setSelectedBeehives(result.beehives.map((hive: Beehive) => hive.id))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const toggleBeehive = (beehiveId: number) => {
    setSelectedBeehives((prev) =>
      prev.includes(beehiveId) ? prev.filter((id) => id !== beehiveId) : [...prev, beehiveId],
    )
  }

  const selectAllBeehives = () => {
    if (data?.beehives) {
      setSelectedBeehives(data.beehives.map((hive) => hive.id))
    }
  }

  const deselectAllBeehives = () => {
    setSelectedBeehives([])
  }

  // Filter data based on selected beehives and time range
  const filteredData = useMemo(() => {
    if (!data) return null

    const hoursToFilter = timeRange === "6h" ? 6 : timeRange === "12h" ? 12 : 24
    const timeThreshold = new Date()
    timeThreshold.setHours(timeThreshold.getHours() - hoursToFilter)

    // Filter temperature history
    const filteredTemperatureHistory = data.temperatureHistory.filter(
      (item) => selectedBeehives.includes(item.beehive_id) && new Date(item.timestamp) >= timeThreshold,
    )

    // Filter humidity history
    const filteredHumidityHistory = data.humidityHistory.filter(
      (item) => selectedBeehives.includes(item.beehive_id) && new Date(item.timestamp) >= timeThreshold,
    )

    // Filter bee flow history
    const filteredBeeFlowHistory = data.beeFlowHistory.filter(
      (item) => selectedBeehives.includes(item.beehive_id) && new Date(item.timestamp) >= timeThreshold,
    )

    // Filter beehives
    const filteredBeehives = data.beehives.filter((hive) => selectedBeehives.includes(hive.id))

    return {
      beehives: filteredBeehives,
      temperatureHistory: filteredTemperatureHistory,
      humidityHistory: filteredHumidityHistory,
      beeFlowHistory: filteredBeeFlowHistory,
    }
  }, [data, selectedBeehives, timeRange])

  // Prepare chart data
  const temperatureChartData = useMemo(() => {
    if (!filteredData?.temperatureHistory) return []

    // Group data by timestamp (rounded to nearest 30 minutes)
    const groupedData: Record<string, any> = {}

    filteredData.temperatureHistory.forEach((item) => {
      const date = new Date(item.timestamp)
      // Round to nearest 30 minutes for better grouping
      date.setMinutes(Math.round(date.getMinutes() / 30) * 30)
      date.setSeconds(0)
      date.setMilliseconds(0)

      const timeKey = date.toISOString()

      if (!groupedData[timeKey]) {
        groupedData[timeKey] = {
          time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }
      }

      // Add inside temperature for this beehive
      groupedData[timeKey][`inside_${item.beehive_id}`] = Number.parseFloat(item.inside_temp.toString())
    })

    // Convert to array and sort by time
    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime(),
    )
  }, [filteredData?.temperatureHistory])

  const humidityChartData = useMemo(() => {
    if (!filteredData?.humidityHistory) return []

    // Group data by timestamp (rounded to nearest 30 minutes)
    const groupedData: Record<string, any> = {}

    filteredData.humidityHistory.forEach((item) => {
      const date = new Date(item.timestamp)
      // Round to nearest 30 minutes for better grouping
      date.setMinutes(Math.round(date.getMinutes() / 30) * 30)
      date.setSeconds(0)
      date.setMilliseconds(0)

      const timeKey = date.toISOString()

      if (!groupedData[timeKey]) {
        groupedData[timeKey] = {
          time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }
      }

      // Add inside humidity for this beehive
      groupedData[timeKey][`inside_${item.beehive_id}`] = Number.parseFloat(item.inside_humidity.toString())
    })

    // Convert to array and sort by time
    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime(),
    )
  }, [filteredData?.humidityHistory])

  const beeFlowChartData = useMemo(() => {
    if (!filteredData?.beeFlowHistory) return []

    // Group data by timestamp (rounded to nearest 30 minutes)
    const groupedData: Record<string, any> = {}

    filteredData.beeFlowHistory.forEach((item) => {
      const date = new Date(item.timestamp)
      // Round to nearest 30 minutes for better grouping
      date.setMinutes(Math.round(date.getMinutes() / 30) * 30)
      date.setSeconds(0)
      date.setMilliseconds(0)

      const timeKey = date.toISOString()

      if (!groupedData[timeKey]) {
        groupedData[timeKey] = {
          time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }
      }

      // Add bee count for this beehive
      groupedData[timeKey][`count_${item.beehive_id}`] = item.bee_count
    })

    // Convert to array and sort by time
    return Object.values(groupedData).sort(
      (a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime(),
    )
  }, [filteredData?.beeFlowHistory])

  // Prepare comparison bar chart data
  const currentComparisonData = useMemo(() => {
    if (!filteredData?.beehives) return []

    return filteredData.beehives.map((hive) => ({
      name: hive.name,
      id: hive.id,
      temperature: hive.sensorData ? Number.parseFloat(hive.sensorData.inside_temp.toString()) : 0,
      humidity: hive.sensorData ? Number.parseFloat(hive.sensorData.inside_humidity.toString()) : 0,
      beeCount: hive.beeFlowData ? hive.beeFlowData.bee_count : 0,
      lightLevel: hive.sensorData ? hive.sensorData.light_level : 0,
    }))
  }, [filteredData?.beehives])

  const getLightStatus = (lightLevel: number) => {
    if (lightLevel > 2000) return { status: "Day", color: "bg-yellow-500" }
    if (lightLevel > 500) return { status: "Twilight", color: "bg-orange-500" }
    return { status: "Night", color: "bg-blue-900" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)

    if (diffSec < 60) return `${diffSec} seconds ago`
    if (diffMin < 60) return `${diffMin} minutes ago`
    if (diffHour < 24) return `${diffHour} hours ago`
    return `${diffDay} days ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Bee className="h-12 w-12 text-yellow-600 animate-bounce mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading beehive comparison data...</p>
        </div>
      </div>
    )
  }

  if (!data || data.beehives.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">No beehives available for comparison</p>
          <Link href="/manage">
            <Button className="mt-4">Manage Beehives</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="bg-yellow-500 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Beehive Comparison</h1>
                <p className="text-sm text-gray-600">Compare data across all your beehives</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/manage">
                <Button variant="outline" size="sm">
                  Manage Hives
                </Button>
              </Link>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Beehive Selection and Time Range */}
        <div className="bg-white/80 backdrop-blur-sm border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Select Beehives to Compare</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={selectAllBeehives} className="text-xs">
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllBeehives} className="text-xs">
                  Deselect All
                </Button>
                {data.beehives.map((hive, index) => (
                  <div key={hive.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hive-${hive.id}`}
                      checked={selectedBeehives.includes(hive.id)}
                      onCheckedChange={() => toggleBeehive(hive.id)}
                    />
                    <label htmlFor={`hive-${hive.id}`} className="text-sm font-medium flex items-center cursor-pointer">
                      <div
                        className="w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      {hive.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Time Range</h2>
              <div className="flex space-x-2">
                <Button
                  variant={timeRange === "6h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("6h")}
                >
                  6 Hours
                </Button>
                <Button
                  variant={timeRange === "12h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("12h")}
                >
                  12 Hours
                </Button>
                <Button
                  variant={timeRange === "24h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("24h")}
                >
                  24 Hours
                </Button>
              </div>
            </div>
          </div>
        </div>

        {selectedBeehives.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-yellow-200 rounded-lg p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Please select at least one beehive to compare</p>
          </div>
        ) : (
          <>
            {/* Current Status Comparison */}
            <h2 className="text-xl font-semibold mb-4">Current Status Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Temperature Comparison</CardTitle>
                  <CardDescription>Current inside temperature (°C)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="temperature"
                        fill="#ef4444"
                        name="Temperature (°C)"
                        label={{ position: "top", fill: "#ef4444" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Humidity Comparison</CardTitle>
                  <CardDescription>Current inside humidity (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="humidity"
                        fill="#3b82f6"
                        name="Humidity (%)"
                        label={{ position: "top", fill: "#3b82f6" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Bee Activity Comparison</CardTitle>
                  <CardDescription>Current bee count</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="beeCount"
                        fill="#f59e0b"
                        name="Bee Count"
                        label={{ position: "top", fill: "#f59e0b" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Light Level Comparison</CardTitle>
                  <CardDescription>Current light levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="lightLevel"
                        fill="#8b5cf6"
                        name="Light Level"
                        label={{ position: "top", fill: "#8b5cf6" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Trend Comparison Tabs */}
            <h2 className="text-xl font-semibold mb-4">Trend Comparison</h2>
            <Tabs defaultValue="temperature" className="mb-8">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="humidity">Humidity</TabsTrigger>
                <TabsTrigger value="beeflow">Bee Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="temperature">
                <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                  <CardHeader>
                    <CardTitle>Temperature Trends Comparison</CardTitle>
                    <CardDescription>Inside temperature over time (°C)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={temperatureChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {filteredData?.beehives.map((hive, index) => (
                          <Line
                            key={hive.id}
                            type="monotone"
                            dataKey={`inside_${hive.id}`}
                            name={hive.name}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="humidity">
                <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                  <CardHeader>
                    <CardTitle>Humidity Trends Comparison</CardTitle>
                    <CardDescription>Inside humidity over time (%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={humidityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {filteredData?.beehives.map((hive, index) => (
                          <Line
                            key={hive.id}
                            type="monotone"
                            dataKey={`inside_${hive.id}`}
                            name={hive.name}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="beeflow">
                <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                  <CardHeader>
                    <CardTitle>Bee Activity Trends Comparison</CardTitle>
                    <CardDescription>Bee count over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={beeFlowChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {filteredData?.beehives.map((hive, index) => (
                          <Line
                            key={hive.id}
                            type="monotone"
                            dataKey={`count_${hive.id}`}
                            name={hive.name}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Beehives Summary Table */}
            <h2 className="text-xl font-semibold mb-4">Beehives Summary</h2>
            <Card className="bg-white/80 backdrop-blur-sm border-yellow-200 mb-8">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beehive</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Humidity</TableHead>
                      <TableHead>Light</TableHead>
                      <TableHead>Bee Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData?.beehives.map((hive) => {
                      const lightStatus = hive.sensorData
                        ? getLightStatus(hive.sensorData.light_level)
                        : { status: "Unknown", color: "bg-gray-400" }

                      return (
                        <TableRow key={hive.id}>
                          <TableCell className="font-medium">
                            <Link href={`/dashboard?hive=${hive.id}`} className="hover:underline">
                              {hive.name}
                            </Link>
                          </TableCell>
                          <TableCell>{hive.location}</TableCell>
                          <TableCell>{hive.sensorData ? `${hive.sensorData.inside_temp}°C` : "N/A"}</TableCell>
                          <TableCell>{hive.sensorData ? `${hive.sensorData.inside_humidity}%` : "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${lightStatus.color}`}></div>
                              <span>
                                {hive.sensorData ? `${lightStatus.status} (${hive.sensorData.light_level})` : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{hive.beeFlowData ? hive.beeFlowData.bee_count : "N/A"}</TableCell>
                          <TableCell>
                            {hive.sensorData ? (
                              <Badge
                                variant={hive.sensorData.system_active ? "default" : "destructive"}
                                className="whitespace-nowrap"
                              >
                                {hive.sensorData.system_active ? "🟢 Active" : "🔴 Inactive"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                Unknown
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {hive.sensorData ? (
                              <span title={formatDate(hive.sensorData.timestamp)}>
                                {getTimeAgo(hive.sensorData.timestamp)}
                              </span>
                            ) : (
                              "Never"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Alerts from All Beehives */}
            <h2 className="text-xl font-semibold mb-4">Recent Alerts (All Selected Beehives)</h2>
            <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {filteredData?.beehives.flatMap((hive) => hive.alerts).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent alerts for the selected beehives</p>
                  ) : (
                    filteredData?.beehives
                      .flatMap((hive) =>
                        hive.alerts.map((alert) => ({
                          ...alert,
                          hiveName: hive.name,
                        })),
                      )
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 10)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="text-xs font-medium text-red-800 capitalize">
                                {alert.alert_type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-red-500 ml-2">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                            <p className="text-xs text-red-600">{alert.message}</p>
                            <p className="text-xs font-medium text-red-700 mt-1">Beehive: {alert.hiveName}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
