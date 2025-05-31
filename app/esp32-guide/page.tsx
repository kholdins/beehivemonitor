"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Code,
  Zap,
  Settings,
  Monitor,
  HardDrive,
  Thermometer,
  Sun,
  Activity,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface FarmerInfo {
  name: string
  email: string
  code: string
  api_key: string
}

export default function ESP32GuidePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFarmerInfo()
  }, [])

  const fetchFarmerInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try the farmer-info endpoint first
      let response = await fetch("/api/farmer-info")

      if (!response.ok) {
        // Fallback to auth verify
        response = await fetch("/api/auth/verify")
      }

      if (response.ok) {
        const data = await response.json()
        console.log("Farmer data received:", data)

        if (data.farmer) {
          setFarmerInfo(data.farmer)

          // Check if API key exists
          if (!data.farmer.api_key) {
            setError("API key not found. Please run the migration first.")
          }
        } else {
          setError("No farmer data found")
        }
      } else {
        setError(`Failed to fetch farmer info: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching farmer info:", error)
      setError("Network error while fetching farmer info")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === "undefined") {
      toast({
        title: "Error",
        description: "No data to copy",
        variant: "destructive",
      })
      return
    }

    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const apiEndpoint = typeof window !== "undefined" ? `${window.location.origin}/api` : "https://your-domain.com/api"

  const arduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Wi-Fi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration - FARMER SPECIFIC
const char* serverURL = "${apiEndpoint}";
const char* apiKey = "${farmerInfo?.api_key || "YOUR_API_KEY"}";  // Your unique API key
const char* deviceID = "ESP32_${farmerInfo?.name?.replace(/\s+/g, "").toUpperCase() || "FARMER"}_001";  // Change this for each device
const int beehiveID = 1;  // Change this to match your beehive ID

// Pin definitions
#define DHTPIN_INSIDE 33
#define DHTPIN_OUTSIDE 32
#define DHTTYPE_INSIDE DHT11
#define DHTTYPE_OUTSIDE DHT22
#define LDR_PIN 34
#define IR_SENSOR_PIN 5
#define RELAY_PIN 4

DHT insideDHT(DHTPIN_INSIDE, DHTTYPE_INSIDE);
DHT outsideDHT(DHTPIN_OUTSIDE, DHTTYPE_OUTSIDE);

// Bee counting
volatile int beeCount = 0;
volatile unsigned long lastIRTrigger = 0;
const unsigned long debounceTime = 500;
unsigned long lastBeePostTime = 0;
const unsigned long beePostInterval = 60000; // 1 minute

// Light detection
int lightThreshold = 3500;
bool irActive = true;

void IRAM_ATTR countBee() {
  unsigned long now = millis();
  if (now - lastIRTrigger > debounceTime && irActive) {
    beeCount++;
    lastIRTrigger = now;
  }
}

void setup() {
  Serial.begin(115200);
  insideDHT.begin();
  outsideDHT.begin();

  pinMode(LDR_PIN, INPUT);
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), countBee, FALLING);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConnected to WiFi");
  Serial.println("Farmer: ${farmerInfo?.name || "Unknown"}");
  Serial.println("API Key: ${farmerInfo?.api_key || "Not loaded"}");

  Serial.println("System ready. Testing sensors and logic...");
}

void loop() {
  int ldrValue = analogRead(LDR_PIN);

  // Day/Night detection
  if (ldrValue > lightThreshold && irActive) {
    digitalWrite(RELAY_PIN, LOW);
    detachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN));
    irActive = false;
    Serial.println("Night – IR OFF");
  } else if (ldrValue <= lightThreshold && !irActive) {
    digitalWrite(RELAY_PIN, HIGH);
    attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), countBee, FALLING);
    irActive = true;
    Serial.println("Day – IR ON");
  }

  // Read sensors
  float temp_in = insideDHT.readTemperature();
  float hum_in = insideDHT.readHumidity();
  float temp_out = outsideDHT.readTemperature();
  float hum_out = outsideDHT.readHumidity();

  // Print sensor values
  Serial.println("======== SENSOR READINGS ========");
  Serial.print("LDR Value: "); Serial.print(ldrValue);
  Serial.print(" → "); Serial.println(irActive ? "DAY ☀️" : "NIGHT 🌙");

  if (!isnan(temp_in)) {
    Serial.print("Inside Temp: "); Serial.print(temp_in); Serial.println(" °C");
    Serial.print("Inside Humidity: "); Serial.print(hum_in); Serial.println(" %");
  } else {
    Serial.println("Failed to read DHT11 (inside)");
  }

  if (!isnan(temp_out)) {
    Serial.print("Outside Temp: "); Serial.print(temp_out); Serial.println(" °C");
    Serial.print("Outside Humidity: "); Serial.print(hum_out); Serial.println(" %");
  } else {
    Serial.println("Failed to read DHT22 (outside)");
  }

  // Send real-time data
  if (!isnan(temp_in) && !isnan(hum_in) && !isnan(temp_out) && !isnan(hum_out)) {
    StaticJsonDocument<256> doc;
    doc["beehive_id"] = beehiveID;
    doc["inside_temp"] = temp_in;
    doc["inside_humidity"] = hum_in;
    doc["outside_temp"] = temp_out;
    doc["outside_humidity"] = hum_out;
    doc["light_level"] = ldrValue;
    doc["system_active"] = irActive;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(String(serverURL) + "/sensor-data");
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-device-id", deviceID);
      http.addHeader("x-api-key", apiKey);  // Add API key header

      String jsonStr;
      serializeJson(doc, jsonStr);

      int httpResponseCode = http.POST(jsonStr);
      Serial.println("Sensor Data Response: " + String(httpResponseCode));
      http.end();
    }
  }

  // Send bee count every minute
  if (millis() - lastBeePostTime > beePostInterval && irActive) {
    StaticJsonDocument<128> beeDoc;
    beeDoc["beehive_id"] = beehiveID;
    beeDoc["bee_count"] = beeCount;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(String(serverURL) + "/bee-flow");
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-device-id", deviceID);
      http.addHeader("x-api-key", apiKey);  // Add API key header

      String beeJson;
      serializeJson(beeDoc, beeJson);

      int httpCode = http.POST(beeJson);
      Serial.println("Bee Count Response: " + String(httpCode));
      http.end();
    }

    Serial.print("Bee count in the last minute: ");
    Serial.println(beeCount);

    beeCount = 0;
    lastBeePostTime = millis();
  }

  Serial.println("==================================");
  delay(30000); // Wait 30 seconds
}
`

  const librariesList = [
    { name: "WiFi", description: "Built-in ESP32 WiFi library", version: "Built-in" },
    { name: "HTTPClient", description: "For making HTTP requests", version: "Built-in" },
    { name: "ArduinoJson", description: "JSON parsing and creation", version: "6.21.3+" },
    { name: "DHT sensor library", description: "For DHT22 temperature/humidity sensor", version: "1.4.4+" },
  ]

  const wiringDiagram = [
    { component: "DHT11 Sensor (Inside)", pin: "GPIO 33", description: "Inside Temperature & Humidity" },
    { component: "DHT22 Sensor (Outside)", pin: "GPIO 32", description: "Outside Temperature & Humidity" },
    { component: "LDR (Light Sensor)", pin: "GPIO 34 (ADC)", description: "Light level detection" },
    { component: "IR Sensor", pin: "GPIO 5", description: "Bee counting sensor" },
    { component: "Relay Module", pin: "GPIO 4", description: "IR sensor power control" },
    { component: "Power", pin: "5V/3.3V", description: "Power supply" },
    { component: "Ground", pin: "GND", description: "Common ground" },
  ]

  const troubleshootingSteps = [
    {
      issue: "WiFi Connection Failed",
      solutions: [
        "Check WiFi credentials (SSID and password)",
        "Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)",
        "Move ESP32 closer to router",
        "Check if network has MAC address filtering enabled",
      ],
    },
    {
      issue: "Sensor Readings are NaN",
      solutions: [
        "Check DHT22 wiring connections",
        "Verify power supply (3.3V or 5V)",
        "Add delay after sensor initialization",
        "Try different GPIO pin for DHT22",
      ],
    },
    {
      issue: "API Requests Failing",
      solutions: [
        "Verify API endpoint URL is correct",
        "Check internet connectivity",
        "Ensure device ID and beehive ID are correct",
        "Check server logs for error details",
      ],
    },
    {
      issue: "No Bee Count Detection",
      solutions: [
        "Check PIR sensor wiring and power",
        "Adjust PIR sensor sensitivity",
        "Verify PIR sensor placement near hive entrance",
        "Test PIR sensor with manual movement",
      ],
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading farmer information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Farmer Info</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={fetchFarmerInfo} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Link href="/api/migrate-auth">
              <Button variant="outline" className="w-full">
                Run Migration
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
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
              <div className="bg-blue-500 p-2 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ESP32 Integration Guide</h1>
                <p className="text-sm text-gray-600">
                  Setup guide for {farmerInfo?.name || "your"} beehive monitoring devices
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={fetchFarmerInfo}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/manage">
                <Button variant="outline" size="sm">
                  Manage Devices
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Farmer Info Card */}
        {farmerInfo && (
          <Card className="bg-white/80 backdrop-blur-sm border-yellow-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-green-500" />
                <span>Your Farmer Configuration</span>
              </CardTitle>
              <CardDescription>Use these credentials in your ESP32 code for secure authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Farmer Name</h4>
                  <div className="flex items-center justify-between">
                    <code className="text-sm bg-white px-2 py-1 rounded">{farmerInfo.name}</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(farmerInfo.name, "Farmer Name")}>
                      {copiedCode === "Farmer Name" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Your API Key</h4>
                  <div className="flex items-center justify-between">
                    <code className="text-sm bg-white px-2 py-1 rounded">{farmerInfo.api_key || "Not generated"}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(farmerInfo.api_key || "", "API Key")}
                      disabled={!farmerInfo.api_key}
                    >
                      {copiedCode === "API Key" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {!farmerInfo.api_key && (
                    <p className="text-xs text-red-600 mt-1">API key not found. Please run the migration.</p>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h5>
                <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(farmerInfo, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rest of the tabs content remains the same */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
            <TabsTrigger value="wiring">Wiring</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="troubleshooting">Help</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>What You'll Build</CardTitle>
                  <CardDescription>A complete IoT beehive monitoring system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Real-time Environmental Monitoring</p>
                        <p className="text-sm text-gray-600">
                          Track temperature, humidity, and light levels inside and around your hive
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Bee Activity Detection</p>
                        <p className="text-sm text-gray-600">
                          Monitor bee movement and activity patterns using motion sensors
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Wireless Data Transmission</p>
                        <p className="text-sm text-gray-600">Automatic data upload to your dashboard via WiFi</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Smart Alerts</p>
                        <p className="text-sm text-gray-600">Get notified when conditions go outside optimal ranges</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>System Requirements</CardTitle>
                  <CardDescription>What you need to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Hardware Required:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• ESP32 Development Board</li>
                        <li>• DHT22 Temperature/Humidity Sensor</li>
                        <li>• PIR Motion Sensor</li>
                        <li>• LDR Light Sensor</li>
                        <li>• Breadboard and Jumper Wires</li>
                        <li>• Power Supply (5V or Battery Pack)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Software Required:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Arduino IDE</li>
                        <li>• ESP32 Board Package</li>
                        <li>• Required Libraries (listed in Code tab)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Network Requirements:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 2.4GHz WiFi Network</li>
                        <li>• Internet Connection</li>
                        <li>• Router within range of beehive location</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-6 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important Note</AlertTitle>
              <AlertDescription>
                Make sure your beehive location has reliable WiFi coverage. Consider using a WiFi extender if the signal
                is weak at your hive location.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Hardware Tab */}
          <TabsContent value="hardware">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Required Components</CardTitle>
                  <CardDescription>
                    Complete list of hardware components needed for your beehive monitor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <HardDrive className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium">ESP32 Development Board</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Main microcontroller with built-in WiFi</p>
                        <Badge variant="outline">Required</Badge>
                        <p className="text-xs text-gray-500 mt-2">Recommended: ESP32 DevKit V1 or NodeMCU-32S</p>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Thermometer className="h-5 w-5 text-red-500" />
                          <h4 className="font-medium">DHT22 Sensor</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Temperature and humidity sensor</p>
                        <Badge variant="outline">Required</Badge>
                        <p className="text-xs text-gray-500 mt-2">High accuracy digital sensor with 3-5V operation</p>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Activity className="h-5 w-5 text-green-500" />
                          <h4 className="font-medium">PIR Motion Sensor</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Detects bee movement and activity</p>
                        <Badge variant="outline">Required</Badge>
                        <p className="text-xs text-gray-500 mt-2">HC-SR501 or similar passive infrared sensor</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Sun className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-medium">LDR Light Sensor</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Measures ambient light levels</p>
                        <Badge variant="outline">Required</Badge>
                        <p className="text-xs text-gray-500 mt-2">Light Dependent Resistor with 10kΩ resistor</p>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Zap className="h-5 w-5 text-purple-500" />
                          <h4 className="font-medium">Power Supply</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">5V power adapter or battery pack</p>
                        <Badge variant="outline">Required</Badge>
                        <p className="text-xs text-gray-500 mt-2">USB power bank or solar panel for remote locations</p>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <Settings className="h-5 w-5 text-gray-500" />
                          <h4 className="font-medium">Breadboard & Wires</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">For connecting components</p>
                        <Badge variant="secondary">Optional</Badge>
                        <p className="text-xs text-gray-500 mt-2">Half-size breadboard and male-to-male jumper wires</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Shopping List</CardTitle>
                  <CardDescription>Estimated costs and where to buy components</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Est. Price</th>
                          <th className="text-left p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">ESP32 DevKit</td>
                          <td className="p-2">1</td>
                          <td className="p-2">$8-15</td>
                          <td className="p-2">Choose version with built-in antenna</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">DHT22 Sensor</td>
                          <td className="p-2">1</td>
                          <td className="p-2">$5-10</td>
                          <td className="p-2">Includes pull-up resistor</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">PIR Sensor</td>
                          <td className="p-2">1</td>
                          <td className="p-2">$3-7</td>
                          <td className="p-2">HC-SR501 recommended</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">LDR + Resistor</td>
                          <td className="p-2">1</td>
                          <td className="p-2">$2-5</td>
                          <td className="p-2">10kΩ resistor included</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Breadboard</td>
                          <td className="p-2">1</td>
                          <td className="p-2">$3-8</td>
                          <td className="p-2">Half-size sufficient</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Jumper Wires</td>
                          <td className="p-2">1 pack</td>
                          <td className="p-2">$3-8</td>
                          <td className="p-2">Male-to-male wires</td>
                        </tr>
                        <tr className="border-b font-medium">
                          <td className="p-2">Total</td>
                          <td className="p-2">-</td>
                          <td className="p-2">$24-53</td>
                          <td className="p-2">Per monitoring unit</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wiring Tab */}
          <TabsContent value="wiring">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Wiring Diagram</CardTitle>
                  <CardDescription>Connect your sensors to the ESP32 following this pin configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">Pin Connections</h4>
                      <div className="space-y-3">
                        {wiringDiagram.map((connection, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div>
                              <p className="font-medium text-sm">{connection.component}</p>
                              <p className="text-xs text-gray-600">{connection.description}</p>
                            </div>
                            <Badge variant="outline" className="font-mono">
                              {connection.pin}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Wiring Notes</h4>
                      <div className="space-y-4">
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Power Supply</AlertTitle>
                          <AlertDescription className="text-sm">
                            Connect all sensors to 3.3V or 5V depending on sensor requirements. DHT22 works with both.
                          </AlertDescription>
                        </Alert>

                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>LDR Wiring</AlertTitle>
                          <AlertDescription className="text-sm">
                            Connect LDR in voltage divider configuration: LDR → GPIO34 → 10kΩ resistor → GND
                          </AlertDescription>
                        </Alert>

                        <Alert className="border-green-200 bg-green-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>PIR Sensor</AlertTitle>
                          <AlertDescription className="text-sm">
                            Position PIR sensor near hive entrance for best bee detection. Adjust sensitivity as needed.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Step-by-Step Wiring Instructions</CardTitle>
                  <CardDescription>Follow these steps to wire your components safely</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Power Off</p>
                        <p className="text-sm text-gray-600">Ensure ESP32 is not connected to power before wiring</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Connect Power Rails</p>
                        <p className="text-sm text-gray-600">
                          Connect 3.3V and GND from ESP32 to breadboard power rails
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Wire DHT22</p>
                        <p className="text-sm text-gray-600">Connect VCC to 3.3V, GND to ground, DATA to GPIO 4</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Wire PIR Sensor</p>
                        <p className="text-sm text-gray-600">Connect VCC to 5V, GND to ground, OUT to GPIO 2</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        5
                      </div>
                      <div>
                        <p className="font-medium">Wire LDR Circuit</p>
                        <p className="text-sm text-gray-600">
                          Create voltage divider: 3.3V → LDR → GPIO34 → 10kΩ → GND
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        6
                      </div>
                      <div>
                        <p className="font-medium">Double Check</p>
                        <p className="text-sm text-gray-600">Verify all connections before applying power</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Complete Arduino Code - Farmer Specific</CardTitle>
                      <CardDescription>
                        This code is pre-configured with your farmer credentials and API key
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(arduinoCode, "Arduino Code")}
                      className="flex items-center space-x-2"
                    >
                      {copiedCode === "Arduino Code" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>Copy Code</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{arduinoCode}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Pre-configured for You!</AlertTitle>
                <AlertDescription>
                  This code is already configured with your farmer API key ({farmerInfo?.api_key}). Just update the WiFi
                  credentials and beehive ID, then upload to your ESP32.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Arduino IDE Setup</CardTitle>
                  <CardDescription>Configure Arduino IDE for ESP32 development</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Install Arduino IDE</p>
                        <p className="text-sm text-gray-600 mb-2">Download from arduino.cc (version 1.8.19 or newer)</p>
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://www.arduino.cc/en/software" target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download Arduino IDE
                          </a>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Add ESP32 Board Package</p>
                        <p className="text-sm text-gray-600 mb-2">Add ESP32 support to Arduino IDE</p>
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Steps:</p>
                          <ol className="text-sm text-gray-600 space-y-1">
                            <li>1. Open Arduino IDE</li>
                            <li>2. Go to File → Preferences</li>
                            <li>3. Add this URL to "Additional Board Manager URLs":</li>
                          </ol>
                          <div className="flex items-center justify-between mt-2 p-2 bg-white rounded border">
                            <code className="text-xs">https://dl.espressif.com/dl/package_esp32_index.json</code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard("https://dl.espressif.com/dl/package_esp32_index.json", "ESP32 URL")
                              }
                            >
                              {copiedCode === "ESP32 URL" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <ol className="text-sm text-gray-600 space-y-1 mt-2" start={4}>
                            <li>4. Go to Tools → Board → Boards Manager</li>
                            <li>5. Search for "ESP32" and install "ESP32 by Espressif Systems"</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Install Required Libraries</p>
                        <p className="text-sm text-gray-600 mb-2">Install libraries for sensors and JSON handling</p>
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Go to Tools → Manage Libraries and install:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• ArduinoJson by Benoit Blanchon</li>
                            <li>• DHT sensor library by Adafruit</li>
                            <li>• Adafruit Unified Sensor</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Upload Process</CardTitle>
                  <CardDescription>Step-by-step guide to upload code to your ESP32</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Connect ESP32</p>
                        <p className="text-sm text-gray-600">Connect ESP32 to computer via USB cable</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Select Board</p>
                        <p className="text-sm text-gray-600">Tools → Board → ESP32 Arduino → ESP32 Dev Module</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Select Port</p>
                        <p className="text-sm text-gray-600">
                          Tools → Port → Select your ESP32 port (usually COM3 on Windows or /dev/ttyUSB0 on Linux)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Configure Code</p>
                        <p className="text-sm text-gray-600">
                          Update WiFi credentials, device ID, and beehive ID in the code
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        5
                      </div>
                      <div>
                        <p className="font-medium">Upload</p>
                        <p className="text-sm text-gray-600">Click Upload button (→) or press Ctrl+U</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        6
                      </div>
                      <div>
                        <p className="font-medium">Monitor Serial</p>
                        <p className="text-sm text-gray-600">
                          Open Serial Monitor (Tools → Serial Monitor) to see debug output
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success Indicators</AlertTitle>
                    <AlertDescription className="text-sm">
                      You should see "WiFi connected!" and sensor readings in the Serial Monitor. The ESP32 will beep
                      once when connected to WiFi.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Device Registration</CardTitle>
                  <CardDescription>Register your ESP32 device in the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      After uploading the code, register your device in the management interface:
                    </p>

                    <div className="flex items-center space-x-4">
                      <Link href="/manage">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Settings className="h-4 w-4 mr-2" />
                          Go to Device Management
                        </Button>
                      </Link>
                      <Link href="/dashboard">
                        <Button variant="outline">
                          <Monitor className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>
                      </Link>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Registration Steps:</h4>
                      <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Go to the Device Management page</li>
                        <li>2. Click "Add ESP32 Device"</li>
                        <li>3. Enter the Device ID from your code (e.g., "ESP32_HIVE_001")</li>
                        <li>4. Give it a descriptive name</li>
                        <li>5. Link it to the appropriate beehive</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value="troubleshooting">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Common Issues & Solutions</CardTitle>
                  <CardDescription>Troubleshoot common problems with your ESP32 beehive monitor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {troubleshootingSteps.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-3 flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          {item.issue}
                        </h4>
                        <div className="space-y-2">
                          {item.solutions.map((solution, sIndex) => (
                            <div key={sIndex} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-600">{solution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Testing Your Setup</CardTitle>
                  <CardDescription>Verify that everything is working correctly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ System Health Checklist</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">ESP32 connects to WiFi successfully</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Serial Monitor shows sensor readings</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Temperature and humidity values are reasonable</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Light sensor responds to changes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">PIR sensor detects movement</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Data appears in dashboard</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Device shows as "Online" in management page</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📊 Expected Values</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Temperature:</strong> 15-40°C (typical range)
                          </p>
                          <p>
                            <strong>Humidity:</strong> 30-80% (typical range)
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Light Level:</strong> 0-4095 (ADC reading)
                          </p>
                          <p>
                            <strong>Bee Count:</strong> 0-100+ (depends on activity)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
                <CardHeader>
                  <CardTitle>Getting Help</CardTitle>
                  <CardDescription>Additional resources and support options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2">📚 Documentation</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• ESP32 Arduino Core Documentation</li>
                        <li>• DHT22 Sensor Datasheet</li>
                        <li>• Arduino IDE User Guide</li>
                        <li>• WiFi Connection Troubleshooting</li>
                      </ul>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2">🛠️ Tools</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Serial Monitor for debugging</li>
                        <li>• WiFi Scanner apps</li>
                        <li>• Multimeter for voltage checking</li>
                        <li>• Network connectivity tests</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  )
}
