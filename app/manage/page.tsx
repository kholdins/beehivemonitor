"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  BeakerIcon as Bee,
  Plus,
  Trash,
  Edit,
  LinkIcon,
  Unlink,
  RefreshCw,
  ArrowLeft,
  Copy,
  Code,
  Settings,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Beehive {
  id: number
  name: string
  location: string
  created_at: string
}

interface ESP32Device {
  id: number
  device_id: string
  device_name: string
  beehive_id: number | null
  is_active: boolean
  last_seen: string
  created_at: string
}

export default function ManagePage() {
  const router = useRouter()
  const [beehives, setBeehives] = useState<Beehive[]>([])
  const [devices, setDevices] = useState<ESP32Device[]>([])
  const [loading, setLoading] = useState(true)
  const [newBeehive, setNewBeehive] = useState({ name: "", location: "" })
  const [newDevice, setNewDevice] = useState({ device_id: "", device_name: "" })
  const [editBeehive, setEditBeehive] = useState<Beehive | null>(null)
  const [editDevice, setEditDevice] = useState<ESP32Device | null>(null)
  const [beehiveToDelete, setBeehiveToDelete] = useState<number | null>(null)
  const [deviceToDelete, setDeviceToDelete] = useState<number | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedBeehive, setSelectedBeehive] = useState<string>("")
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [isAddBeehiveOpen, setIsAddBeehiveOpen] = useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const [isEditBeehiveOpen, setIsEditBeehiveOpen] = useState(false)
  const [isEditDeviceOpen, setIsEditDeviceOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsBeehive, setSettingsBeehive] = useState<Beehive | null>(null)
  const [beehiveSettings, setBeehiveSettings] = useState({
    min_temp_threshold: 15.0,
    max_temp_threshold: 35.0,
    min_humidity_threshold: 35.0,
    max_humidity_threshold: 75.0,
    min_bee_count_threshold: 10,
    alert_email: "",
    alerts_enabled: true,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [beehivesResponse, devicesResponse] = await Promise.all([fetch("/api/beehives"), fetch("/api/devices")])

      if (!beehivesResponse.ok || !devicesResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const beehivesData = await beehivesResponse.json()
      const devicesData = await devicesResponse.json()

      setBeehives(beehivesData)
      setDevices(devicesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Check URL parameters for tab and settings
    const searchParams = new URLSearchParams(window.location.search)
    const tab = searchParams.get("tab")
    const settingsId = searchParams.get("settings")

    // Set active tab if specified
    if (tab === "beehives" || tab === "devices") {
      // Set the active tab
    }

    // Open settings dialog if specified
    if (settingsId) {
      const beehiveId = Number.parseInt(settingsId)
      const beehive = beehives.find((b) => b.id === beehiveId)
      if (beehive) {
        setSettingsBeehive(beehive)
        fetchBeehiveSettings(beehiveId)
        setIsSettingsOpen(true)
      }
    }
  }, [])

  const handleAddBeehive = async () => {
    try {
      const response = await fetch("/api/beehives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBeehive),
      })

      if (!response.ok) {
        throw new Error("Failed to add beehive")
      }

      await fetchData()
      setNewBeehive({ name: "", location: "" })
      setIsAddBeehiveOpen(false)
      toast({
        title: "Success",
        description: "Beehive added successfully!",
      })
    } catch (error) {
      console.error("Error adding beehive:", error)
      toast({
        title: "Error",
        description: "Failed to add beehive. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditBeehive = async () => {
    if (!editBeehive) return

    try {
      const response = await fetch(`/api/beehives/${editBeehive.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editBeehive),
      })

      if (!response.ok) {
        throw new Error("Failed to update beehive")
      }

      await fetchData()
      setEditBeehive(null)
      setIsEditBeehiveOpen(false)
      toast({
        title: "Success",
        description: "Beehive updated successfully!",
      })
    } catch (error) {
      console.error("Error updating beehive:", error)
      toast({
        title: "Error",
        description: "Failed to update beehive. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBeehive = async () => {
    if (!beehiveToDelete) return

    try {
      const response = await fetch(`/api/beehives/${beehiveToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete beehive")
      }

      await fetchData()
      setBeehiveToDelete(null)
      toast({
        title: "Success",
        description: "Beehive deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting beehive:", error)
      toast({
        title: "Error",
        description: "Failed to delete beehive. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddDevice = async () => {
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDevice),
      })

      if (!response.ok) {
        throw new Error("Failed to add device")
      }

      await fetchData()
      setNewDevice({ device_id: "", device_name: "" })
      setIsAddDeviceOpen(false)
      toast({
        title: "Success",
        description: "ESP32 device added successfully!",
      })
    } catch (error) {
      console.error("Error adding device:", error)
      toast({
        title: "Error",
        description: "Failed to add ESP32 device. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditDevice = async () => {
    if (!editDevice) return

    try {
      const response = await fetch(`/api/devices/${editDevice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editDevice),
      })

      if (!response.ok) {
        throw new Error("Failed to update device")
      }

      await fetchData()
      setEditDevice(null)
      setIsEditDeviceOpen(false)
      toast({
        title: "Success",
        description: "ESP32 device updated successfully!",
      })
    } catch (error) {
      console.error("Error updating device:", error)
      toast({
        title: "Error",
        description: "Failed to update ESP32 device. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return

    try {
      const response = await fetch(`/api/devices/${deviceToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete device")
      }

      await fetchData()
      setDeviceToDelete(null)
      toast({
        title: "Success",
        description: "ESP32 device deleted successfully!",
      })
    } catch (error) {
      console.error("Error deleting device:", error)
      toast({
        title: "Error",
        description: "Failed to delete ESP32 device. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLinkDeviceToBeehive = async () => {
    try {
      const response = await fetch("/api/link-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: Number.parseInt(selectedDevice),
          beehive_id: Number.parseInt(selectedBeehive),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to link device to beehive")
      }

      await fetchData()
      setLinkDialogOpen(false)
      setSelectedBeehive("")
      setSelectedDevice("")
      toast({
        title: "Success",
        description: "ESP32 device linked to beehive successfully!",
      })
    } catch (error) {
      console.error("Error linking device:", error)
      toast({
        title: "Error",
        description: "Failed to link ESP32 device to beehive. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUnlinkDevice = async (deviceId: number) => {
    try {
      const response = await fetch(`/api/unlink-device/${deviceId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to unlink device")
      }

      await fetchData()
      toast({
        title: "Success",
        description: "ESP32 device unlinked successfully!",
      })
    } catch (error) {
      console.error("Error unlinking device:", error)
      toast({
        title: "Error",
        description: "Failed to unlink ESP32 device. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Device ID copied to clipboard",
    })
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

  const fetchBeehiveSettings = async (beehiveId: number) => {
    try {
      const response = await fetch(`/api/beehives/${beehiveId}/settings`)
      if (response.ok) {
        const data = await response.json()
        setBeehiveSettings(data)
      } else {
        // Use default settings if none exist
        setBeehiveSettings({
          min_temp_threshold: 15.0,
          max_temp_threshold: 35.0,
          min_humidity_threshold: 35.0,
          max_humidity_threshold: 75.0,
          min_bee_count_threshold: 10,
          alert_email: "",
          alerts_enabled: true,
        })
      }
    } catch (error) {
      console.error("Error fetching beehive settings:", error)
      toast({
        title: "Error",
        description: "Failed to load beehive settings. Using defaults.",
        variant: "destructive",
      })
    }
  }

  const saveBeehiveSettings = async () => {
    if (!settingsBeehive) return

    try {
      const response = await fetch(`/api/beehives/${settingsBeehive.id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(beehiveSettings),
      })

      if (!response.ok) {
        throw new Error("Failed to update beehive settings")
      }

      setIsSettingsOpen(false)
      toast({
        title: "Success",
        description: "Beehive settings updated successfully!",
      })
    } catch (error) {
      console.error("Error updating beehive settings:", error)
      toast({
        title: "Error",
        description: "Failed to update beehive settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Bee className="h-12 w-12 text-yellow-600 animate-bounce mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading management data...</p>
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
                <Bee className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Beehive Management</h1>
                <p className="text-sm text-gray-600">Add, edit, and link your beehives and ESP32 devices</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/esp32-guide">
                <Button variant="outline" size="sm">
                  <Code className="h-4 w-4 mr-2" />
                  Setup Guide
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
        <Tabs defaultValue="beehives" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="beehives">Beehives</TabsTrigger>
            <TabsTrigger value="devices">ESP32 Devices</TabsTrigger>
          </TabsList>

          {/* Beehives Tab */}
          <TabsContent value="beehives">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage Beehives</h2>
              <Dialog open={isAddBeehiveOpen} onOpenChange={setIsAddBeehiveOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Beehive
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Beehive</DialogTitle>
                    <DialogDescription>Enter the details for your new beehive.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newBeehive.name}
                        onChange={(e) => setNewBeehive({ ...newBeehive, name: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g. North Field Hive"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={newBeehive.location}
                        onChange={(e) => setNewBeehive({ ...newBeehive, location: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g. North Field"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddBeehiveOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddBeehive}>Add Beehive</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Linked Device</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beehives.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No beehives found. Add your first beehive to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      beehives.map((beehive) => {
                        const linkedDevice = devices.find((device) => device.beehive_id === beehive.id)
                        return (
                          <TableRow key={beehive.id}>
                            <TableCell>{beehive.id}</TableCell>
                            <TableCell className="font-medium">{beehive.name}</TableCell>
                            <TableCell>{beehive.location}</TableCell>
                            <TableCell>{formatDate(beehive.created_at)}</TableCell>
                            <TableCell>
                              {linkedDevice ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {linkedDevice.device_name}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                  No device linked
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog
                                  open={isEditBeehiveOpen && editBeehive?.id === beehive.id}
                                  onOpenChange={(open) => {
                                    setIsEditBeehiveOpen(open)
                                    if (!open) setEditBeehive(null)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setEditBeehive(beehive)
                                        setIsEditBeehiveOpen(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Beehive</DialogTitle>
                                      <DialogDescription>Update the details for this beehive.</DialogDescription>
                                    </DialogHeader>
                                    {editBeehive && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="edit-name" className="text-right">
                                            Name
                                          </Label>
                                          <Input
                                            id="edit-name"
                                            value={editBeehive.name}
                                            onChange={(e) => setEditBeehive({ ...editBeehive, name: e.target.value })}
                                            className="col-span-3"
                                          />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="edit-location" className="text-right">
                                            Location
                                          </Label>
                                          <Input
                                            id="edit-location"
                                            value={editBeehive.location}
                                            onChange={(e) =>
                                              setEditBeehive({ ...editBeehive, location: e.target.value })
                                            }
                                            className="col-span-3"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsEditBeehiveOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleEditBeehive}>Save Changes</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 border-red-200 hover:bg-red-50"
                                      onClick={() => setBeehiveToDelete(beehive.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Beehive</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this beehive? This action cannot be undone and
                                        will remove all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setBeehiveToDelete(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={handleDeleteBeehive}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-blue-500 border-blue-200 hover:bg-blue-50"
                                  onClick={() => {
                                    setSelectedBeehive(beehive.id.toString())
                                    setLinkDialogOpen(true)
                                  }}
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSettingsBeehive(beehive)
                                    fetchBeehiveSettings(beehive.id)
                                    setIsSettingsOpen(true)
                                  }}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESP32 Devices Tab */}
          <TabsContent value="devices">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Manage ESP32 Devices</h2>
              <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add ESP32 Device
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New ESP32 Device</DialogTitle>
                    <DialogDescription>Enter the details for your new ESP32 device.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="device_id" className="text-right">
                        Device ID
                      </Label>
                      <Input
                        id="device_id"
                        value={newDevice.device_id}
                        onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g. ESP32_001"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="device_name" className="text-right">
                        Device Name
                      </Label>
                      <Input
                        id="device_name"
                        value={newDevice.device_name}
                        onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g. North Field ESP32"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDevice}>Add Device</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Linked Beehive</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No ESP32 devices found. Add your first device to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      devices.map((device) => {
                        const linkedBeehive = beehives.find((beehive) => beehive.id === device.beehive_id)
                        return (
                          <TableRow key={device.id}>
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center space-x-2">
                                <span>{device.device_id}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => copyToClipboard(device.device_id)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{device.device_name}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  device.is_active
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }
                              >
                                {device.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {device.last_seen ? (
                                <span title={formatDate(device.last_seen)}>{getTimeAgo(device.last_seen)}</span>
                              ) : (
                                "Never"
                              )}
                            </TableCell>
                            <TableCell>
                              {linkedBeehive ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {linkedBeehive.name}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                  Not linked
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog
                                  open={isEditDeviceOpen && editDevice?.id === device.id}
                                  onOpenChange={(open) => {
                                    setIsEditDeviceOpen(open)
                                    if (!open) setEditDevice(null)
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setEditDevice(device)
                                        setIsEditDeviceOpen(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit ESP32 Device</DialogTitle>
                                      <DialogDescription>Update the details for this device.</DialogDescription>
                                    </DialogHeader>
                                    {editDevice && (
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="edit-device-id" className="text-right">
                                            Device ID
                                          </Label>
                                          <Input
                                            id="edit-device-id"
                                            value={editDevice.device_id}
                                            onChange={(e) =>
                                              setEditDevice({ ...editDevice, device_id: e.target.value })
                                            }
                                            className="col-span-3"
                                          />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="edit-device-name" className="text-right">
                                            Device Name
                                          </Label>
                                          <Input
                                            id="edit-device-name"
                                            value={editDevice.device_name}
                                            onChange={(e) =>
                                              setEditDevice({ ...editDevice, device_name: e.target.value })
                                            }
                                            className="col-span-3"
                                          />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="edit-device-status" className="text-right">
                                            Status
                                          </Label>
                                          <Select
                                            value={editDevice.is_active ? "active" : "inactive"}
                                            onValueChange={(value) =>
                                              setEditDevice({ ...editDevice, is_active: value === "active" })
                                            }
                                          >
                                            <SelectTrigger className="col-span-3">
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="active">Active</SelectItem>
                                              <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsEditDeviceOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleEditDevice}>Save Changes</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 border-red-200 hover:bg-red-50"
                                      onClick={() => setDeviceToDelete(device.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete ESP32 Device</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this ESP32 device? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeviceToDelete(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={handleDeleteDevice}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                {device.beehive_id ? (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-orange-500 border-orange-200 hover:bg-orange-50"
                                    onClick={() => handleUnlinkDevice(device.id)}
                                  >
                                    <Unlink className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-blue-500 border-blue-200 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedDevice(device.id.toString())
                                      setLinkDialogOpen(true)
                                    }}
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Link Device Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link ESP32 Device to Beehive</DialogTitle>
              <DialogDescription>
                Select a beehive and an ESP32 device to link them together. This will allow the device to send data for
                the selected beehive.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="beehive" className="text-right">
                  Beehive
                </Label>
                <Select value={selectedBeehive} onValueChange={setSelectedBeehive}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a beehive" />
                  </SelectTrigger>
                  <SelectContent>
                    {beehives.map((beehive) => (
                      <SelectItem key={beehive.id} value={beehive.id.toString()}>
                        {beehive.name} ({beehive.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device" className="text-right">
                  ESP32 Device
                </Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices
                      .filter((device) => !device.beehive_id)
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id.toString()}>
                          {device.device_name} ({device.device_id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLinkDeviceToBeehive} disabled={!selectedBeehive || !selectedDevice}>
                Link Device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Beehive Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Beehive Settings: {settingsBeehive?.name}</DialogTitle>
              <DialogDescription>
                Configure alert thresholds and notification settings for this beehive.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_temp">Minimum Temperature (°C)</Label>
                  <Input
                    id="min_temp"
                    type="number"
                    value={beehiveSettings.min_temp_threshold}
                    onChange={(e) =>
                      setBeehiveSettings({
                        ...beehiveSettings,
                        min_temp_threshold: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Alert when temperature falls below this value</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_temp">Maximum Temperature (°C)</Label>
                  <Input
                    id="max_temp"
                    type="number"
                    value={beehiveSettings.max_temp_threshold}
                    onChange={(e) =>
                      setBeehiveSettings({
                        ...beehiveSettings,
                        max_temp_threshold: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Alert when temperature rises above this value</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_humidity">Minimum Humidity (%)</Label>
                  <Input
                    id="min_humidity"
                    type="number"
                    value={beehiveSettings.min_humidity_threshold}
                    onChange={(e) =>
                      setBeehiveSettings({
                        ...beehiveSettings,
                        min_humidity_threshold: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Alert when humidity falls below this value</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_humidity">Maximum Humidity (%)</Label>
                  <Input
                    id="max_humidity"
                    type="number"
                    value={beehiveSettings.max_humidity_threshold}
                    onChange={(e) =>
                      setBeehiveSettings({
                        ...beehiveSettings,
                        max_humidity_threshold: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Alert when humidity rises above this value</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_bee_count">Minimum Bee Count</Label>
                <Input
                  id="min_bee_count"
                  type="number"
                  value={beehiveSettings.min_bee_count_threshold}
                  onChange={(e) =>
                    setBeehiveSettings({
                      ...beehiveSettings,
                      min_bee_count_threshold: Number.parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Alert when bee activity falls below this count</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_email">Alert Email</Label>
                <Input
                  id="alert_email"
                  type="email"
                  value={beehiveSettings.alert_email}
                  onChange={(e) =>
                    setBeehiveSettings({
                      ...beehiveSettings,
                      alert_email: e.target.value,
                    })
                  }
                  placeholder="email@example.com"
                />
                <p className="text-xs text-muted-foreground">Email address for alert notifications</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alerts_enabled"
                  checked={beehiveSettings.alerts_enabled}
                  onCheckedChange={(checked) =>
                    setBeehiveSettings({
                      ...beehiveSettings,
                      alerts_enabled: checked === true,
                    })
                  }
                />
                <Label htmlFor="alerts_enabled">Enable Alerts</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveBeehiveSettings}>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Toaster />
    </div>
  )
}
