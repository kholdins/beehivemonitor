import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("farmer_session")?.value

    if (sessionToken) {
      // Delete the session from database
      await sql`
        DELETE FROM farmer_sessions 
        WHERE session_token = ${sessionToken}
      `
    }

    // Create response and clear cookie
    const response = NextResponse.json({ success: true, message: "Logged out successfully" })

    response.cookies.set("farmer_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
