import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Create farmer_codes table with consistent column names
    await sql`
      CREATE TABLE IF NOT EXISTS farmer_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        farmer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        api_key VARCHAR(255) UNIQUE,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create farmer_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS farmer_sessions (
        id SERIAL PRIMARY KEY,
        farmer_code_id INTEGER REFERENCES farmer_codes(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Add farmer_id column to beehives table if it doesn't exist
    await sql`
      ALTER TABLE beehives 
      ADD COLUMN IF NOT EXISTS farmer_id INTEGER REFERENCES farmer_codes(id) ON DELETE CASCADE
    `

    // Add farmer_id column to esp32_devices table if it doesn't exist
    await sql`
      ALTER TABLE esp32_devices 
      ADD COLUMN IF NOT EXISTS farmer_id INTEGER REFERENCES farmer_codes(id) ON DELETE CASCADE
    `

    // Check if demo codes exist
    const existingCodes = await sql`SELECT COUNT(*) as count FROM farmer_codes`

    if (existingCodes[0].count === 0) {
      // Insert demo farmer codes with API keys
      await sql`
        INSERT INTO farmer_codes (code, farmer_name, email, api_key, is_active) VALUES
        ('FARM001', 'John Smith', 'john@farm.com', 'API_FARM001_KEY', true),
        ('FARM002', 'Sarah Johnson', 'sarah@farm.com', 'API_FARM002_KEY', true),
        ('FARM003', 'Mike Wilson', 'mike@farm.com', 'API_FARM003_KEY', true)
      `

      // Create sample beehives for each farmer
      await sql`
        INSERT INTO beehives (name, location, farmer_id) VALUES
        ('Garden Hive Alpha', 'North Garden', 1),
        ('Orchard Hive Beta', 'Apple Orchard', 1),
        ('Field Hive Gamma', 'South Field', 2),
        ('Meadow Hive Delta', 'East Meadow', 3)
      `

      // Create sample ESP32 devices for each farmer
      await sql`
        INSERT INTO esp32_devices (device_id, device_name, farmer_id, is_active, last_seen) VALUES
        ('ESP32_FARM001_001', 'Garden Monitor 1', 1, true, NOW()),
        ('ESP32_FARM001_002', 'Orchard Monitor 1', 1, true, NOW()),
        ('ESP32_FARM002_001', 'Field Monitor 1', 2, true, NOW()),
        ('ESP32_FARM003_001', 'Meadow Monitor 1', 3, true, NOW())
      `
    }

    return NextResponse.json({
      success: true,
      message: "Authentication tables created and demo data inserted successfully",
    })
  } catch (error) {
    console.error("Error setting up auth tables:", error)
    return NextResponse.json({ error: "Failed to setup auth tables" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { farmer_name, email, expires_days } = await request.json()

    if (!farmer_name) {
      return NextResponse.json({ error: "Farmer name is required" }, { status: 400 })
    }

    // Generate a unique code and API key
    const code = `FARM${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const apiKey = `API_${code}_KEY`

    // Calculate expiration date if provided
    const expiresAt = expires_days ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000) : null

    const result = await sql`
      INSERT INTO farmer_codes (code, farmer_name, email, api_key, expires_at, is_active)
      VALUES (${code}, ${farmer_name}, ${email || null}, ${apiKey}, ${expiresAt}, true)
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      farmer: result[0],
      message: `Farmer code ${code} created successfully`,
    })
  } catch (error) {
    console.error("Error creating farmer code:", error)
    return NextResponse.json({ error: "Failed to create farmer code" }, { status: 500 })
  }
}
