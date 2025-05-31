import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

async function getFarmerFromSession() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return null
    }

    const session = await sql`
      SELECT fs.*, fc.id as farmer_id, fc.name, fc.email, fc.code
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

async function checkBeehiveOwnership(beehiveId: string, farmerId: number) {
  const beehive = await sql`
    SELECT * FROM beehives 
    WHERE id = ${beehiveId} AND farmer_id = ${farmerId}
  `
  return beehive.length > 0
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    // Check if beehive belongs to this farmer
    const hasAccess = await checkBeehiveOwnership(id, farmer.farmer_id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
    }

    const beehive = await sql`SELECT * FROM beehives WHERE id = ${id}`

    if (beehive.length === 0) {
      return NextResponse.json({ error: "Beehive not found" }, { status: 404 })
    }

    return NextResponse.json(beehive[0])
  } catch (error) {
    console.error("Error fetching beehive:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    const body = await request.json()
    const { name, location } = body

    if (!name) {
      return NextResponse.json({ error: "Beehive name is required" }, { status: 400 })
    }

    // Check if beehive belongs to this farmer
    const hasAccess = await checkBeehiveOwnership(id, farmer.farmer_id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
    }

    const result = await sql`
      UPDATE beehives
      SET name = ${name}, location = ${location}
      WHERE id = ${id} AND farmer_id = ${farmer.farmer_id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Beehive not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating beehive:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const farmer = await getFarmerFromSession()

    if (!farmer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    // Check if beehive belongs to this farmer
    const hasAccess = await checkBeehiveOwnership(id, farmer.farmer_id)
    if (!hasAccess) {
      return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
    }

    // First, unlink any devices connected to this beehive
    await sql`UPDATE esp32_devices SET beehive_id = NULL WHERE beehive_id = ${id}`

    // Delete the beehive
    const result = await sql`
      DELETE FROM beehives 
      WHERE id = ${id} AND farmer_id = ${farmer.farmer_id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Beehive not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Beehive deleted successfully" })
  } catch (error) {
    console.error("Error deleting beehive:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
