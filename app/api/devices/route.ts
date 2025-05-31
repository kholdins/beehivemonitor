import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const devices = await sql`SELECT * FROM esp32_devices ORDER BY id`
    return NextResponse.json(devices)
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_id, device_name } = body

    if (!device_id || !device_name) {
      return NextResponse.json({ error: "Device ID and name are required" }, { status: 400 })
    }

    // Check if device_id already exists
    const existingDevice = await sql`SELECT * FROM esp32_devices WHERE device_id = ${device_id}`
    if (existingDevice.length > 0) {
      return NextResponse.json({ error: "Device ID already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO esp32_devices (device_id, device_name, is_active, last_seen)
      VALUES (${device_id}, ${device_name}, true, NOW())
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
