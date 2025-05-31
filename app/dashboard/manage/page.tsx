"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Settings, Wifi, WifiOff, MapPin, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

interface ESP32Device {
  id: number
  device_id: string
  device_name: string
  beehive_id: number | null
  beehive_name: string | null
  is_active: boolean
  last_seen: string
}

export default function ManageBeehives() {
  const [beehives, setBeehives] = useState<Beehive[]>([])
  const [devices, setDevices] = useState<ESP32Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddHive, setShowAddHive] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newHive, setNewHive] = useState({ name: "", location: "" })
  const [newDevice, setNewDevice] = useState({ device_id: "", device_name: "", beehive_id: "" })
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      // First check if we're authenticated
      const authResponse = await fetch("/api/auth/verify")
      if (!authResponse.ok) {
        router.push("/login")
        return
      }

      await fetchData()
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    }
  }

  const fetchData = async () => {
    try {
      setError(null)
      const [beehivesRes, devicesRes] = await Promise.all([fetch("/api/beehives"), fetch("/api/esp32-devices")])

      if (!beehivesRes.ok) {
        if (beehivesRes.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(`Failed to fetch beehives: ${beehivesRes.status}`)
      }

      if (!devicesRes.ok) {
        if (devicesRes.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(`Failed to fetch devices: ${devicesRes.status}`)
      }

      const beehivesData = await beehivesRes.json()
      const devicesData = await devicesRes.json()

      // Ensure we have arrays
      setBeehives(Array.isArray(beehivesData) ? beehivesData : [])
      setDevices(Array.isArray(devicesData) ? devicesData : [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
      setBeehives([])
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddBeehive = async () => {
    try {
      const response = await fetch("/api/beehives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHive),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Failed to add beehive")
      }

      setNewHive({ name: "", location: "" })
      setShowAddHive(false)
      fetchData()
    } catch (error) {
      console.error("Error adding beehive:", error)
      setError("Failed to add beehive")
    }
  }

  const handleAddDevice = async () => {
    try {
      const response = await fetch("/api/esp32-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDevice,
          beehive_id: newDevice.beehive_id ? Number.parseInt(newDevice.beehive_id) : null,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Failed to add device")
      }

      setNewDevice({ device_id: "", device_name: "", beehive_id: "" })
      setShowAddDevice(false)
      fetchData()
    } catch (error) {
      console.error("Error adding device:", error)
      setError("Failed to add device")
    }
  }

  const handleLinkDevice = async (deviceId: number, beehiveId: number | null) => {
    try {
      const device = devices.find((d) => d.id === deviceId)
      if (!device) return

      const response = await fetch("/api/esp32-devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deviceId,
          device_name: device.device_name,
          beehive_id: beehiveId,
          is_active: device.is_active,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Failed to link device")
      }

      fetchData()
    } catch (error) {
      console.error("Error linking device:", error)
      setError("Failed to link device")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-amber-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span>Error Loading Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex space-x-2">
                <Button onClick={fetchData} variant="outline">
                  Try Again
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const unlinkedDevices = devices.filter((device) => !device.beehive_id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Beehives</h1>
              <p className="text-gray-600">Add new hives and link ESP32 devices</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/esp32-guide">
                <Button variant="outline">ESP32 Setup Guide</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <Dialog open={showAddHive} onOpenChange={setShowAddHive}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Beehive
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Beehive</DialogTitle>
                <DialogDescription>
                  Create a new beehive to monitor. You can link an ESP32 device later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Beehive Name</Label>
                  <Input
                    id="name"
                    value={newHive.name}
                    onChange={(e) => setNewHive({ ...newHive, name: e.target.value })}
                    placeholder="e.g., Garden Hive Alpha"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newHive.location}
                    onChange={(e) => setNewHive({ ...newHive, location: e.target.value })}
                    placeholder="e.g., Community Garden"
                  />
                </div>
                <Button onClick={handleAddBeehive} className="w-full">
                  Add Beehive
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add ESP32 Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add ESP32 Device</DialogTitle>
                <DialogDescription>Register a new ESP32 device for monitoring.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device_id">Device ID</Label>
                  <Input
                    id="device_id"
                    value={newDevice.device_id}
                    onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                    placeholder="e.g., ESP32_ALPHA_001"
                  />
                </div>
                <div>
                  <Label htmlFor="device_name">Device Name</Label>
                  <Input
                    id="device_name"
                    value={newDevice.device_name}
                    onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                    placeholder="e.g., Garden Monitor"
                  />
                </div>
                <div>
                  <Label htmlFor="beehive">Link to Beehive (Optional)</Label>
                  <Select
                    value={newDevice.beehive_id}
                    onValueChange={(value) => setNewDevice({ ...newDevice, beehive_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a beehive" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No beehive</SelectItem>
                      {beehives.map((hive) => (
                        <SelectItem key={hive.id} value={hive.id.toString()}>
                          {hive.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddDevice} className="w-full">
                  Add Device
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Beehives and Devices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Beehives ({beehives.length})</h2>
            <div className="space-y-4">
              {beehives.length === 0 ? (
                <Card className="bg-white shadow-lg border-amber-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No beehives yet. Add your first beehive to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                beehives.map((hive) => {
                  const isDeviceOnline =
                    hive.device_active &&
                    hive.last_seen &&
                    new Date(hive.last_seen).getTime() > Date.now() - 15 * 60 * 1000

                  return (
                    <Card key={hive.id} className="bg-white shadow-lg border-amber-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>{hive.name}</span>
                              {hive.recent_alerts > 0 && (
                                <Badge variant="destructive">{hive.recent_alerts} alerts</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{hive.location}</span>
                            </CardDescription>
                          </div>
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {hive.device_id ? (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="font-medium text-green-800">Linked Device: {hive.device_name}</p>
                              <p className="text-sm text-green-600">ID: {hive.device_id}</p>
                              <p className="text-sm text-green-600">
                                Last seen: {hive.last_seen ? new Date(hive.last_seen).toLocaleString() : "Never"}
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="font-medium text-yellow-800">No device linked</p>
                              <p className="text-sm text-yellow-600">Link an ESP32 device to start monitoring</p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Link href={`/dashboard/${hive.id}`}>
                              <Button size="sm" variant="outline">
                                View Dashboard
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4 mr-1" />
                              Settings
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your ESP32 Devices ({devices.length})</h2>
            <div className="space-y-4">
              {devices.length === 0 ? (
                <Card className="bg-white shadow-lg border-amber-200">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No ESP32 devices yet. Add your first device to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                devices.map((device) => {
                  const isOnline =
                    device.is_active && new Date(device.last_seen).getTime() > Date.now() - 15 * 60 * 1000

                  return (
                    <Card key={device.id} className="bg-white shadow-lg border-amber-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>{device.device_name}</span>
                              {isOnline ? (
                                <Badge className="bg-green-500">Online</Badge>
                              ) : (
                                <Badge variant="secondary">Offline</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>ID: {device.device_id}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {device.beehive_id ? (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="font-medium text-blue-800">Linked to: {device.beehive_name}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLinkDevice(device.id, null)}
                                className="mt-2"
                              >
                                Unlink Device
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="font-medium text-gray-800 mb-2">Not linked to any beehive</p>
                              <Select onValueChange={(value) => handleLinkDevice(device.id, Number.parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Link to beehive" />
                                </SelectTrigger>
                                <SelectContent>
                                  {beehives
                                    .filter((hive) => !hive.device_id)
                                    .map((hive) => (
                                      <SelectItem key={hive.id} value={hive.id.toString()}>
                                        {hive.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <p className="text-sm text-gray-600">
                            Last seen: {new Date(device.last_seen).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
