import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

async function getFarmerFromSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("farmer_session")?.value

    if (!sessionToken) {
      return null
    }

    const session = await sql`
      SELECT fs.*, fc.id as farmer_id, fc.farmer_name, fc.email, fc.code, fc.api_key
      FROM farmer_sessions fs
      JOIN farmer_codes fc ON fs.farmer_code_id = fc.id
      WHERE fs.session_token = ${sessionToken}
      AND fs.expires_at > NOW()
      AND fc.is_active = true
    `

    return session[0] || null
  } catch (error) {
    console.error("Error getting farmer from session:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const beehiveId = Number.parseInt(params.id)

    // Get beehive info and verify ownership
    const beehive = await sql`
      SELECT * FROM beehives 
      WHERE id = ${beehiveId} AND farmer_id = ${farmer.farmer_id}
    `

    if (beehive.length === 0) {
      return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
    }

    // Get latest sensor data
    const latestSensorData = await sql`
      SELECT * FROM sensor_data 
      WHERE beehive_id = ${beehiveId}
      ORDER BY timestamp DESC 
      LIMIT 1
    `

    // Get sensor data for the last 24 hours
    const sensorData = await sql`
      SELECT 
        beehive_id,
        CAST(inside_temp AS DECIMAL(5,2)) as inside_temp,
        CAST(inside_humidity AS DECIMAL(5,2)) as inside_humidity,
        CAST(outside_temp AS DECIMAL(5,2)) as outside_temp,
        CAST(outside_humidity AS DECIMAL(5,2)) as outside_humidity,
        CAST(light_level AS INTEGER) as light_level,
        system_active,
        timestamp
      FROM sensor_data 
      WHERE beehive_id = ${beehiveId}
      AND timestamp > NOW() - INTERVAL '24 hours'
      ORDER BY timestamp ASC
    `

    // Get bee flow data for the last 24 hours
    const beeFlowData = await sql`
      SELECT 
        beehive_id,
        CAST(bee_count AS INTEGER) as bee_count,
        timestamp
      FROM bee_flow 
      WHERE beehive_id = ${beehiveId}
      AND timestamp > NOW() - INTERVAL '24 hours'
      ORDER BY timestamp ASC
    `

    // Get recent alerts
    const alerts = await sql`
      SELECT * FROM alert_history 
      WHERE beehive_id = ${beehiveId}
      ORDER BY timestamp DESC 
      LIMIT 10
    `

    // Get ESP32 device info (only devices belonging to this farmer)
    const device = await sql`
      SELECT * FROM esp32_devices 
      WHERE beehive_id = ${beehiveId} AND farmer_id = ${farmer.farmer_id}
    `

    // Process latest sensor data to ensure proper types
    const processedLatestSensorData = latestSensorData[0]
      ? {
          ...latestSensorData[0],
          inside_temp: Number.parseFloat(latestSensorData[0].inside_temp) || 0,
          inside_humidity: Number.parseFloat(latestSensorData[0].inside_humidity) || 0,
          outside_temp: Number.parseFloat(latestSensorData[0].outside_temp) || 0,
          outside_humidity: Number.parseFloat(latestSensorData[0].outside_humidity) || 0,
          light_level: Number.parseInt(latestSensorData[0].light_level) || 0,
        }
      : null

    return NextResponse.json({
      beehive: beehive[0],
      latestSensorData: processedLatestSensorData,
      sensorData,
      beeFlowData,
      alerts,
      device: device[0] || null,
      farmer: {
        name: farmer.farmer_name,
        api_key: farmer.api_key,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
