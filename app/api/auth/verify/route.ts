import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("farmer_session")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Verify session and get farmer info INCLUDING API KEY
    const sessions = await sql`
      SELECT fs.*, fc.farmer_name, fc.email, fc.code, fc.api_key
      FROM farmer_sessions fs
      JOIN farmer_codes fc ON fs.farmer_code_id = fc.id
      WHERE fs.session_token = ${sessionToken} 
      AND fs.expires_at > NOW()
      AND fc.is_active = true
    `

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    const session = sessions[0]

    return NextResponse.json({
      success: true,
      farmer: {
        id: session.farmer_code_id,
        name: session.farmer_name,
        email: session.email,
        code: session.code,
        api_key: session.api_key, // Include the API key
      },
    })
  } catch (error) {
    console.error("Session verification error:", error)
    return NextResponse.json({ error: "Session verification failed" }, { status: 500 })
  }
}
