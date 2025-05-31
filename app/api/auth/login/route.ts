import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Access code is required" }, { status: 400 })
    }

    // First, ensure tables exist and create demo data
    await setupTables()

    // Find farmer by code
    const farmers = await sql`
      SELECT * FROM farmer_codes 
      WHERE code = ${code.toUpperCase()} 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `

    if (farmers.length === 0) {
      return NextResponse.json({ error: "Invalid or expired access code" }, { status: 401 })
    }

    const farmer = farmers[0]

    // Generate session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create session
    await sql`
      INSERT INTO farmer_sessions (farmer_code_id, session_token, expires_at)
      VALUES (${farmer.id}, ${sessionToken}, ${expiresAt})
    `

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("farmer_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    })

    return NextResponse.json({
      success: true,
      farmer: {
        id: farmer.id,
        name: farmer.farmer_name,
        email: farmer.email,
        code: farmer.code,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 })
  }
}

async function setupTables() {
  try {
    // Create farmer_codes table
    await sql`
      CREATE TABLE IF NOT EXISTS farmer_codes (
        id SERIAL PRIMARY KEY,
        farmer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        code VARCHAR(50) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create farmer_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS farmer_sessions (
        id SERIAL PRIMARY KEY,
        farmer_code_id INTEGER REFERENCES farmer_codes(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if demo data exists
    const existingCodes = await sql`SELECT COUNT(*) as count FROM farmer_codes`

    if (existingCodes[0].count === 0) {
      // Insert demo farmer codes
      await sql`
        INSERT INTO farmer_codes (farmer_name, email, code) VALUES
        ('John Smith', 'john@farm001.com', 'FARM001'),
        ('Sarah Johnson', 'sarah@farm002.com', 'FARM002'),
        ('Mike Wilson', 'mike@farm003.com', 'FARM003')
      `
    }
  } catch (error) {
    console.error("Setup error:", error)
  }
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
