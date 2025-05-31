import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const settings = await sql`
      SELECT * FROM alert_settings 
      WHERE beehive_id = ${id}
    `

    if (settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        min_temp_threshold: 15.0,
        max_temp_threshold: 35.0,
        min_humidity_threshold: 35.0,
        max_humidity_threshold: 75.0,
        min_bee_count_threshold: 10,
        alert_email: "",
        alerts_enabled: true,
      })
    }

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Error fetching beehive settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const {
      min_temp_threshold,
      max_temp_threshold,
      min_humidity_threshold,
      max_humidity_threshold,
      min_bee_count_threshold,
      alert_email,
      alerts_enabled,
    } = body

    // Check if settings exist for this beehive
    const existingSettings = await sql`
      SELECT * FROM alert_settings 
      WHERE beehive_id = ${id}
    `

    let result
    if (existingSettings.length === 0) {
      // Create new settings
      result = await sql`
        INSERT INTO alert_settings (
          beehive_id,
          min_temp_threshold,
          max_temp_threshold,
          min_humidity_threshold,
          max_humidity_threshold,
          min_bee_count_threshold,
          alert_email,
          alerts_enabled
        ) VALUES (
          ${id},
          ${min_temp_threshold},
          ${max_temp_threshold},
          ${min_humidity_threshold},
          ${max_humidity_threshold},
          ${min_bee_count_threshold},
          ${alert_email},
          ${alerts_enabled}
        )
        RETURNING *
      `
    } else {
      // Update existing settings
      result = await sql`
        UPDATE alert_settings
        SET 
          min_temp_threshold = ${min_temp_threshold},
          max_temp_threshold = ${max_temp_threshold},
          min_humidity_threshold = ${min_humidity_threshold},
          max_humidity_threshold = ${max_humidity_threshold},
          min_bee_count_threshold = ${min_bee_count_threshold},
          alert_email = ${alert_email},
          alerts_enabled = ${alerts_enabled}
        WHERE beehive_id = ${id}
        RETURNING *
      `
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating beehive settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
