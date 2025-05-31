import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("farmer_session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Get farmer info with API key
    const sessions = await sql`
      SELECT fc.farmer_name, fc.email, fc.code, fc.api_key
      FROM farmer_sessions fs
      JOIN farmer_codes fc ON fs.farmer_code_id = fc.id
      WHERE fs.session_token = ${sessionToken} 
      AND fs.expires_at > NOW()
      AND fc.is_active = true
    `

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    const farmer = sessions[0]

    return NextResponse.json({
      success: true,
      farmer: {
        name: farmer.farmer_name,
        email: farmer.email,
        code: farmer.code,
        api_key: farmer.api_key,
      },
    })
  } catch (error) {
    console.error("Error fetching farmer info:", error)
    return NextResponse.json({ error: "Failed to fetch farmer info" }, { status: 500 })
  }
}
