import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beehiveId = searchParams.get("beehive_id") || "3"

    // Get latest sensor data
    const latestSensorData = await sql`
      SELECT * FROM sensor_data 
      WHERE beehive_id = ${beehiveId}
      ORDER BY timestamp DESC 
      LIMIT 1
    `

    // Get sensor data for the last 24 hours
    const sensorHistory = await sql`
      SELECT * FROM sensor_data 
      WHERE beehive_id = ${beehiveId} 
      AND timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
    `

    // Get bee flow data for the last 24 hours
    const beeFlowHistory = await sql`
      SELECT * FROM bee_flow 
      WHERE beehive_id = ${beehiveId} 
      AND timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
    `

    // Get recent alerts
    const recentAlerts = await sql`
      SELECT * FROM alert_history 
      WHERE beehive_id = ${beehiveId}
      AND timestamp >= NOW() - INTERVAL '7 days'
      ORDER BY timestamp DESC
      LIMIT 10
    `

    // Get beehive info
    const beehiveInfo = await sql`
      SELECT * FROM beehives WHERE id = ${beehiveId}
    `

    return NextResponse.json({
      beehive: beehiveInfo[0] || null,
      latestSensorData: latestSensorData[0] || null,
      sensorHistory,
      beeFlowHistory,
      recentAlerts,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
