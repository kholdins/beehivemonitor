import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const device = await sql`SELECT * FROM esp32_devices WHERE id = ${id}`

    if (device.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json(device[0])
  } catch (error) {
    console.error("Error fetching device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { device_id, device_name, is_active } = body

    if (!device_id || !device_name) {
      return NextResponse.json({ error: "Device ID and name are required" }, { status: 400 })
    }

    // Check if device_id already exists for another device
    const existingDevice = await sql`
      SELECT * FROM esp32_devices 
      WHERE device_id = ${device_id} AND id != ${id}
    `

    if (existingDevice.length > 0) {
      return NextResponse.json({ error: "Device ID already exists" }, { status: 400 })
    }

    const result = await sql`
      UPDATE esp32_devices
      SET device_id = ${device_id}, device_name = ${device_name}, is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await sql`DELETE FROM esp32_devices WHERE id = ${id} RETURNING *`

    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Device deleted successfully" })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
