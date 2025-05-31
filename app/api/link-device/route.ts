import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_id, beehive_id } = body

    if (!device_id || !beehive_id) {
      return NextResponse.json({ error: "Device ID and Beehive ID are required" }, { status: 400 })
    }

    // Check if device exists
    const device = await sql`SELECT * FROM esp32_devices WHERE id = ${device_id}`
    if (device.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Check if beehive exists
    const beehive = await sql`SELECT * FROM beehives WHERE id = ${beehive_id}`
    if (beehive.length === 0) {
      return NextResponse.json({ error: "Beehive not found" }, { status: 404 })
    }

    // Update device with beehive_id
    const result = await sql`
      UPDATE esp32_devices
      SET beehive_id = ${beehive_id}
      WHERE id = ${device_id}
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error linking device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
