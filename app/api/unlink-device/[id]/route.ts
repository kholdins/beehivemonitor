import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Update device to remove beehive_id
    const result = await sql`
      UPDATE esp32_devices
      SET beehive_id = NULL
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error unlinking device:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
