import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const deviceId = request.headers.get("x-device-id")

    const { beehive_id, bee_count } = body

    // Validate required fields
    if (!beehive_id || bee_count === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update ESP32 device last seen timestamp if device ID provided
    if (deviceId) {
      await sql`
        UPDATE esp32_devices 
        SET last_seen = NOW() 
        WHERE device_id = ${deviceId}
      `
    }

    // Insert bee flow data
    const result = await sql`
      INSERT INTO bee_flow (beehive_id, bee_count, timestamp)
      VALUES (${beehive_id}, ${bee_count}, NOW())
      RETURNING id
    `

    // Check for low bee count alerts
    await checkBeeCountAlert(beehive_id, bee_count)

    return NextResponse.json({
      success: true,
      message: "Bee flow data recorded successfully",
      id: result[0].id,
    })
  } catch (error) {
    console.error("Error recording bee flow data:", error)
    return NextResponse.json({ error: "Failed to record bee flow data" }, { status: 500 })
  }
}

async function checkBeeCountAlert(beehiveId: number, beeCount: number) {
  try {
    // Get alert settings for this beehive
    const settings = await sql`
      SELECT * FROM alert_settings 
      WHERE beehive_id = ${beehiveId} AND alerts_enabled = true
    `

    if (settings.length === 0) return

    const setting = settings[0]

    // Check bee count alert
    if (beeCount < setting.min_bee_count_threshold) {
      await sql`
        INSERT INTO alert_history (beehive_id, alert_type, message, timestamp)
        VALUES (
          ${beehiveId}, 
          'low_bee_count', 
          ${`Low bee activity detected: ${beeCount} bees (threshold: ${setting.min_bee_count_threshold})`},
          NOW()
        )
      `
    }
  } catch (error) {
    console.error("Error checking bee count alert:", error)
  }
}

export async function GET() {
  try {
    const data = await sql`
      SELECT 
        bf.*,
        b.name as beehive_name,
        b.location
      FROM bee_flow bf
      JOIN beehives b ON bf.beehive_id = b.id
      ORDER BY bf.timestamp DESC
      LIMIT 100
    `

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching bee flow data:", error)
    return NextResponse.json({ error: "Failed to fetch bee flow data" }, { status: 500 })
  }
}
