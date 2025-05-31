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
      SELECT fs.*, fc.id as farmer_id, fc.farmer_name, fc.email, fc.code
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

export async function GET() {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const beehives = await sql`
      SELECT 
        b.*,
        ed.device_id,
        ed.device_name,
        ed.is_active as device_active,
        ed.last_seen,
        (
          SELECT COUNT(*) 
          FROM alert_history ah 
          WHERE ah.beehive_id = b.id 
          AND ah.timestamp > NOW() - INTERVAL '24 hours'
        ) as recent_alerts
      FROM beehives b
      LEFT JOIN esp32_devices ed ON b.id = ed.beehive_id
      WHERE b.farmer_id = ${farmer.farmer_id}
      ORDER BY b.id
    `

    return NextResponse.json(beehives)
  } catch (error) {
    console.error("Error fetching beehives:", error)
    return NextResponse.json({ error: "Failed to fetch beehives" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, location } = await request.json()

    if (!name || !location) {
      return NextResponse.json({ error: "Name and location are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO beehives (name, location, farmer_id)
      VALUES (${name}, ${location}, ${farmer.farmer_id})
      RETURNING *
    `

    // Create default alert settings for the new beehive
    await sql`
      INSERT INTO alert_settings (
        beehive_id, 
        min_temp_threshold, 
        max_temp_threshold, 
        min_humidity_threshold, 
        max_humidity_threshold, 
        min_bee_count_threshold, 
        alert_email, 
        alerts_enabled
      )
      VALUES (
        ${result[0].id}, 
        15.0, 
        35.0, 
        35.0, 
        75.0, 
        10, 
        ${farmer.email || "alerts@example.com"}, 
        true
      )
    `

    return NextResponse.json({
      success: true,
      beehive: result[0],
    })
  } catch (error) {
    console.error("Error creating beehive:", error)
    return NextResponse.json({ error: "Failed to create beehive" }, { status: 500 })
  }
}
