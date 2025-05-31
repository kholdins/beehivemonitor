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

export async function GET() {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const devices = await sql`
      SELECT 
        ed.*,
        b.name as beehive_name,
        b.location as beehive_location
      FROM esp32_devices ed
      LEFT JOIN beehives b ON ed.beehive_id = b.id AND b.farmer_id = ${farmer.farmer_id}
      WHERE ed.farmer_id = ${farmer.farmer_id}
      ORDER BY ed.id
    `

    return NextResponse.json(devices)
  } catch (error) {
    console.error("Error fetching ESP32 devices:", error)
    return NextResponse.json({ error: "Failed to fetch ESP32 devices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { device_id, device_name, beehive_id } = await request.json()

    if (!device_id || !device_name) {
      return NextResponse.json({ error: "Device ID and name are required" }, { status: 400 })
    }

    // Check if beehive belongs to this farmer (if beehive_id provided)
    if (beehive_id) {
      const beehive = await sql`
        SELECT id FROM beehives 
        WHERE id = ${beehive_id} AND farmer_id = ${farmer.farmer_id}
      `
      if (beehive.length === 0) {
        return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
      }
    }

    const result = await sql`
      INSERT INTO esp32_devices (device_id, device_name, beehive_id, farmer_id, is_active, last_seen)
      VALUES (${device_id}, ${device_name}, ${beehive_id || null}, ${farmer.farmer_id}, true, NOW())
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      device: result[0],
    })
  } catch (error) {
    console.error("Error creating ESP32 device:", error)
    return NextResponse.json({ error: "Failed to create ESP32 device" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, device_name, beehive_id, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Check if beehive belongs to this farmer (if beehive_id provided)
    if (beehive_id) {
      const beehive = await sql`
        SELECT id FROM beehives 
        WHERE id = ${beehive_id} AND farmer_id = ${farmer.farmer_id}
      `
      if (beehive.length === 0) {
        return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
      }
    }

    const result = await sql`
      UPDATE esp32_devices 
      SET 
        device_name = ${device_name},
        beehive_id = ${beehive_id || null},
        is_active = ${is_active}
      WHERE id = ${id} AND farmer_id = ${farmer.farmer_id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: result[0],
    })
  } catch (error) {
    console.error("Error updating ESP32 device:", error)
    return NextResponse.json({ error: "Failed to update ESP32 device" }, { status: 500 })
  }
}
