import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get all beehives with their latest data
    const beehives = await sql`
      SELECT 
        b.id,
        b.name,
        b.location,
        sd.inside_temp,
        sd.inside_humidity,
        sd.outside_temp,
        sd.outside_humidity,
        sd.light_level,
        sd.system_active,
        sd.timestamp as last_reading,
        bf.bee_count,
        bf.timestamp as last_bee_count,
        ed.device_id,
        ed.is_active as device_active,
        ed.last_seen,
        (
          SELECT COUNT(*) 
          FROM alert_history ah 
          WHERE ah.beehive_id = b.id 
          AND ah.timestamp > NOW() - INTERVAL '24 hours'
        ) as recent_alerts
      FROM beehives b
      LEFT JOIN LATERAL (
        SELECT * FROM sensor_data 
        WHERE beehive_id = b.id 
        ORDER BY timestamp DESC 
        LIMIT 1
      ) sd ON true
      LEFT JOIN LATERAL (
        SELECT * FROM bee_flow 
        WHERE beehive_id = b.id 
        ORDER BY timestamp DESC 
        LIMIT 1
      ) bf ON true
      LEFT JOIN esp32_devices ed ON b.id = ed.beehive_id
      ORDER BY b.id
    `

    // Get historical data for charts (last 7 days, hourly averages)
    const historicalData = await sql`
      SELECT 
        beehive_id,
        DATE_TRUNC('hour', timestamp) as hour,
        AVG(inside_temp) as avg_temp,
        AVG(inside_humidity) as avg_humidity,
        AVG(light_level) as avg_light
      FROM sensor_data 
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY beehive_id, DATE_TRUNC('hour', timestamp)
      ORDER BY hour ASC
    `

    // Get bee activity data (last 7 days, hourly averages)
    const beeActivityData = await sql`
      SELECT 
        beehive_id,
        DATE_TRUNC('hour', timestamp) as hour,
        AVG(bee_count) as avg_bee_count
      FROM bee_flow 
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY beehive_id, DATE_TRUNC('hour', timestamp)
      ORDER BY hour ASC
    `

    return NextResponse.json({
      beehives,
      historicalData,
      beeActivityData,
    })
  } catch (error) {
    console.error("Error fetching comparison data:", error)
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 })
  }
}
