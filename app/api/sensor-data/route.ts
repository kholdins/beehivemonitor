import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { sendSimpleAlertEmail as sendAlertEmail } from "@/lib/email"

const sql = neon(process.env.DATABASE_URL!)

async function getFarmerFromApiKey(apiKey: string) {
  try {
    const farmer = await sql`
      SELECT * FROM farmer_codes 
      WHERE api_key = ${apiKey} AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `
    return farmer[0] || null
  } catch (error) {
    console.error("Error getting farmer from API key:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const deviceId = request.headers.get("x-device-id")
    const apiKey = request.headers.get("x-api-key")

    const { beehive_id, inside_temp, inside_humidity, outside_temp, outside_humidity, light_level, system_active } =
      body

    // Validate required fields
    if (!beehive_id || inside_temp === undefined || inside_humidity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Authenticate using API key
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    const farmer = await getFarmerFromApiKey(apiKey)
    if (!farmer) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Verify that the beehive belongs to this farmer
    const beehive = await sql`
      SELECT id FROM beehives 
      WHERE id = ${beehive_id} AND farmer_id = ${farmer.id}
    `
    if (beehive.length === 0) {
      return NextResponse.json({ error: "Beehive not found or access denied" }, { status: 404 })
    }

    // Update ESP32 device last seen timestamp if device ID provided
    if (deviceId) {
      await sql`
        UPDATE esp32_devices 
        SET last_seen = NOW() 
        WHERE device_id = ${deviceId} AND farmer_id = ${farmer.id}
      `
    }

    // Insert sensor data
    const result = await sql`
      INSERT INTO sensor_data (
        beehive_id, 
        inside_temp, 
        inside_humidity, 
        outside_temp, 
        outside_humidity, 
        light_level, 
        system_active,
        timestamp
      )
      VALUES (
        ${beehive_id},
        ${inside_temp},
        ${inside_humidity},
        ${outside_temp || null},
        ${outside_humidity || null},
        ${light_level || null},
        ${system_active !== undefined ? system_active : true},
        NOW()
      )
      RETURNING id
    `

    // Check for alerts and send emails
    await checkAndCreateAlerts(beehive_id, {
      inside_temp,
      inside_humidity,
      outside_temp,
      outside_humidity,
      system_active,
    })

    return NextResponse.json({
      success: true,
      message: "Sensor data recorded successfully",
      id: result[0].id,
    })
  } catch (error) {
    console.error("Error recording sensor data:", error)
    return NextResponse.json({ error: "Failed to record sensor data" }, { status: 500 })
  }
}

async function checkAndCreateAlerts(beehiveId: number, data: any) {
  try {
    // Get beehive info and alert settings
    const beehiveInfo = await sql`
      SELECT b.name, b.location, a.*
      FROM beehives b
      LEFT JOIN alert_settings a ON b.id = a.beehive_id
      WHERE b.id = ${beehiveId}
    `

    if (beehiveInfo.length === 0) return

    const beehive = beehiveInfo[0]

    // If no settings exist, create default settings
    if (!beehive.alerts_enabled && beehive.alerts_enabled !== false) {
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
        VALUES (
          ${beehiveId},
          15,
          35,
          30,
          80,
          5,
          true,
          ''
        )
      `

      // Fetch the newly created settings
      const newBeehiveInfo = await sql`
        SELECT b.name, b.location, a.*
        FROM beehives b
        LEFT JOIN alert_settings a ON b.id = a.beehive_id
        WHERE b.id = ${beehiveId}
      `

      if (newBeehiveInfo.length > 0) {
        await processAlerts(newBeehiveInfo[0], data)
      }
    } else {
      // Only process alerts if they're enabled
      if (beehive.alerts_enabled) {
        await processAlerts(beehive, data)
      }
    }
  } catch (error) {
    console.error("Error checking alerts:", error)
  }
}

async function processAlerts(beehive: any, data: any) {
  const alerts = []

  // Check inside temperature alerts
  if (data.inside_temp < beehive.min_temp_threshold) {
    alerts.push({
      type: "low_temperature",
      message: `Inside temperature too low: ${data.inside_temp}°C (threshold: ${beehive.min_temp_threshold}°C)`,
    })
  }
  if (data.inside_temp > beehive.max_temp_threshold) {
    alerts.push({
      type: "high_temperature",
      message: `Inside temperature too high: ${data.inside_temp}°C (threshold: ${beehive.max_temp_threshold}°C)`,
    })
  }

  // Check outside temperature alerts (if available)
  if (data.outside_temp !== null && data.outside_temp !== undefined) {
    const tempDifference = Math.abs(data.inside_temp - data.outside_temp)
    if (tempDifference > 10) {
      alerts.push({
        type: "temp_difference",
        message: `Large temperature difference: Inside ${data.inside_temp}°C, Outside ${data.outside_temp}°C (diff: ${tempDifference.toFixed(1)}°C)`,
      })
    }
  }

  // Check humidity alerts
  if (data.inside_humidity < beehive.min_humidity_threshold) {
    alerts.push({
      type: "low_humidity",
      message: `Inside humidity too low: ${data.inside_humidity}% (threshold: ${beehive.min_humidity_threshold}%)`,
    })
  }
  if (data.inside_humidity > beehive.max_humidity_threshold) {
    alerts.push({
      type: "high_humidity",
      message: `Inside humidity too high: ${data.inside_humidity}% (threshold: ${beehive.max_humidity_threshold}%)`,
    })
  }

  // Check system status
  if (data.system_active === false) {
    alerts.push({
      type: "system_inactive",
      message: "Beehive monitoring system is inactive",
    })
  }

  // Insert alerts and send emails
  for (const alert of alerts) {
    // Insert alert into database
    await sql`
      INSERT INTO alert_history (beehive_id, alert_type, message, timestamp)
      VALUES (${beehive.id}, ${alert.type}, ${alert.message}, NOW())
    `

    // Send email if email is configured
    if (beehive.alert_email && beehive.alert_email.trim() !== "") {
      try {
        const emailData = {
          beehiveName: beehive.name,
          location: beehive.location,
          alertType: alert.type,
          message: alert.message,
          timestamp: new Date().toISOString(),
          alertEmail: beehive.alert_email,
        }

        // Use the new Resend implementation
        const emailResult = await sendAlertEmail(emailData)

        if (emailResult.success) {
          console.log(`✅ Alert email sent for ${beehive.name}: ${alert.type}`)
        } else {
          console.error(`❌ Failed to send alert email for ${beehive.name}:`, emailResult.error)
        }
      } catch (emailError) {
        console.error("Error sending alert email:", emailError)
      }
    }
  }

  return alerts
}

export async function GET() {
  try {
    const data = await sql`
      SELECT 
        sd.*,
        b.name as beehive_name,
        b.location
      FROM sensor_data sd
      JOIN beehives b ON sd.beehive_id = b.id
      ORDER BY sd.timestamp DESC
      LIMIT 100
    `

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
  }
}
