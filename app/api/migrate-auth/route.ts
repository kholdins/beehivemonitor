import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Add api_key column to farmer_codes table if it doesn't exist
    await sql`
      ALTER TABLE farmer_codes 
      ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE
    `

    // Add farmer_id column to esp32_devices table if it doesn't exist
    await sql`
      ALTER TABLE esp32_devices 
      ADD COLUMN IF NOT EXISTS farmer_id INTEGER REFERENCES farmer_codes(id) ON DELETE CASCADE
    `

    // Update existing farmer codes with API keys if they don't have them
    const farmersWithoutApiKeys = await sql`
      SELECT id, code FROM farmer_codes WHERE api_key IS NULL
    `

    for (const farmer of farmersWithoutApiKeys) {
      const apiKey = `API_${farmer.code}_KEY`
      await sql`
        UPDATE farmer_codes 
        SET api_key = ${apiKey}
        WHERE id = ${farmer.id}
      `
    }

    // Check if we need to create sample data
    const beehiveCount = await sql`SELECT COUNT(*) as count FROM beehives WHERE farmer_id IS NOT NULL`
    const deviceCount = await sql`SELECT COUNT(*) as count FROM esp32_devices WHERE farmer_id IS NOT NULL`

    if (beehiveCount[0].count === 0) {
      // Assign existing beehives to farmers or create new ones
      const existingBeehives = await sql`SELECT id FROM beehives LIMIT 3`
      const farmers = await sql`SELECT id FROM farmer_codes ORDER BY id LIMIT 3`

      if (existingBeehives.length > 0 && farmers.length > 0) {
        // Assign existing beehives to farmers
        for (let i = 0; i < Math.min(existingBeehives.length, farmers.length); i++) {
          await sql`
            UPDATE beehives 
            SET farmer_id = ${farmers[i].id}
            WHERE id = ${existingBeehives[i].id}
          `
        }
      }

      // Create additional sample beehives if needed
      if (farmers.length > 0) {
        await sql`
          INSERT INTO beehives (name, location, farmer_id) VALUES
          ('Garden Hive Alpha', 'North Garden', ${farmers[0]?.id || 1}),
          ('Orchard Hive Beta', 'Apple Orchard', ${farmers[0]?.id || 1})
        `

        if (farmers.length > 1) {
          await sql`
            INSERT INTO beehives (name, location, farmer_id) VALUES
            ('Field Hive Gamma', 'South Field', ${farmers[1].id})
          `
        }

        if (farmers.length > 2) {
          await sql`
            INSERT INTO beehives (name, location, farmer_id) VALUES
            ('Meadow Hive Delta', 'East Meadow', ${farmers[2].id})
          `
        }
      }
    }

    if (deviceCount[0].count === 0) {
      // Create sample ESP32 devices for each farmer
      const farmers = await sql`SELECT id, code FROM farmer_codes ORDER BY id LIMIT 3`

      for (const farmer of farmers) {
        await sql`
          INSERT INTO esp32_devices (device_id, device_name, farmer_id, is_active, last_seen) VALUES
          (${`ESP32_${farmer.code}_001`}, ${`${farmer.code} Monitor 1`}, ${farmer.id}, true, NOW())
        `
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully. API keys added and sample data created.",
    })
  } catch (error) {
    console.error("Error during migration:", error)
    return NextResponse.json({ error: "Migration failed: " + error.message }, { status: 500 })
  }
}
