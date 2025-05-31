import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get all beehives
    const beehives = await sql`
      SELECT * FROM beehives 
      ORDER BY id
    `

    // Get latest sensor data for each beehive
    const latestSensorData = await sql`
      WITH ranked_data AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (PARTITION BY beehive_id ORDER BY timestamp DESC) as rn
        FROM sensor_data
      )
      SELECT * FROM ranked_data 
      WHERE rn = 1
    `

    // Get latest bee flow data for each beehive
    const latestBeeFlowData = await sql`
      WITH ranked_data AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (PARTITION BY beehive_id ORDER BY timestamp DESC) as rn
        FROM bee_flow
      )
      SELECT * FROM ranked_data 
      WHERE rn = 1
    `

    // Get recent alerts for each beehive (last 24 hours)
    const recentAlerts = await sql`
      SELECT * FROM alert_history 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
    `

    // Get temperature history for the last 24 hours for all beehives
    const temperatureHistory = await sql`
      SELECT 
        beehive_id, 
        inside_temp, 
        outside_temp, 
        timestamp 
      FROM sensor_data 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY beehive_id, timestamp
    `

    // Get humidity history for the last 24 hours for all beehives
    const humidityHistory = await sql`
      SELECT 
        beehive_id, 
        inside_humidity, 
        outside_humidity, 
        timestamp 
      FROM sensor_data 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY beehive_id, timestamp
    `

    // Get bee flow history for the last 24 hours for all beehives
    const beeFlowHistory = await sql`
      SELECT 
        beehive_id, 
        bee_count, 
        timestamp 
      FROM bee_flow 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY beehive_id, timestamp
    `

    // Get ESP32 devices linked to beehives
    const devices = await sql`
      SELECT * FROM esp32_devices
      WHERE beehive_id IS NOT NULL
    `

    // Combine the data
    const beehivesWithData = beehives.map((beehive) => {
      const sensorData = latestSensorData.find((data) => data.beehive_id === beehive.id) || null
      const beeFlowData = latestBeeFlowData.find((data) => data.beehive_id === beehive.id) || null
      const alerts = recentAlerts.filter((alert) => alert.beehive_id === beehive.id)
      const device = devices.find((device) => device.beehive_id === beehive.id) || null

      return {
        ...beehive,
        sensorData,
        beeFlowData,
        alerts,
        device,
      }
    })

    return NextResponse.json({
      beehives: beehivesWithData,
      temperatureHistory,
      humidityHistory,
      beeFlowHistory,
    })
  } catch (error) {
    console.error("Error fetching all beehives data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
