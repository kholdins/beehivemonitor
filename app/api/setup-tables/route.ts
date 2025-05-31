import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Check if alert_settings table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'alert_settings'
      );
    `

    if (!tableExists[0].exists) {
      // Create alert_settings table
      await sql`
        CREATE TABLE IF NOT EXISTS alert_settings (
          id SERIAL PRIMARY KEY,
          beehive_id INTEGER NOT NULL,
          min_temp_threshold DECIMAL(5,2) DEFAULT 15.0,
          max_temp_threshold DECIMAL(5,2) DEFAULT 35.0,
          min_humidity_threshold DECIMAL(5,2) DEFAULT 30.0,
          max_humidity_threshold DECIMAL(5,2) DEFAULT 80.0,
          min_bee_count_threshold INTEGER DEFAULT 5,
          alerts_enabled BOOLEAN DEFAULT true,
          alert_email VARCHAR(255) DEFAULT 'alerts@example.com',
          CONSTRAINT fk_beehive FOREIGN KEY (beehive_id) REFERENCES beehives(id) ON DELETE CASCADE
        )
      `
    }

    // Create default alert settings for all beehives that don't have settings
    await sql`
      INSERT INTO alert_settings (
        beehive_id, 
        min_temp_threshold, 
        max_temp_threshold, 
        min_humidity_threshold, 
        max_humidity_threshold, 
        min_bee_count_threshold, 
        alerts_enabled, 
        alert_email
      )
      SELECT 
        b.id, 
        15.0, 
        35.0, 
        30.0, 
        80.0, 
        5, 
        true, 
        'alerts@example.com'
      FROM beehives b
      LEFT JOIN alert_settings a ON b.id = a.beehive_id
      WHERE a.id IS NULL
    `

    return NextResponse.json({
      success: true,
      message: "Tables checked and created if needed. Default alert settings applied.",
    })
  } catch (error) {
    console.error("Error setting up tables:", error)
    return NextResponse.json({ error: "Failed to set up tables" }, { status: 500 })
  }
}
