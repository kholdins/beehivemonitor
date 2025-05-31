interface AlertEmailData {
  beehiveName: string
  location: string
  alertType: string
  message: string
  timestamp: string
  alertEmail: string
}

export async function sendAlertEmail(data: AlertEmailData) {
  try {
    // If no email service is configured, just log the alert
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 Alert Email (No service configured):", {
        to: data.alertEmail,
        subject: `🐝 Beehive Alert: ${data.beehiveName}`,
        message: data.message,
        timestamp: data.timestamp,
      })
      return { success: true, message: "Alert logged (no email service)" }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Beehive Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐝 Beehive Alert</h1>
              <p>Alert from ${data.beehiveName}</p>
            </div>
            <div class="content">
              <h2>Alert Details</h2>
              <div class="alert-box">
                <strong>Alert Type:</strong> ${getAlertTypeDisplay(data.alertType)}<br>
                <strong>Message:</strong> ${data.message}<br>
                <strong>Location:</strong> ${data.location}<br>
                <strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}
              </div>
              <p>Please check your beehive dashboard for more details and take appropriate action if needed.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/dashboard" 
                     style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Dashboard
              </a></p>
            </div>
            <div class="footer">
              <p>This is an automated alert from your Smart Beehive Monitoring System</p>
            </div>
          </div>
        </body>
      </html>
    `

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "alerts@yourdomain.com",
        to: [data.alertEmail],
        subject: `🐝 Beehive Alert: ${data.beehiveName} - ${getAlertTypeDisplay(data.alertType)}`,
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Failed to send email:", error)
      return { success: false, error: "Failed to send email" }
    }

    const result = await response.json()
    console.log("✅ Alert email sent successfully:", result.id)
    return { success: true, emailId: result.id }
  } catch (error) {
    console.error("Error sending alert email:", error)
    return { success: false, error: "Email service error" }
  }
}

function getAlertTypeDisplay(alertType: string): string {
  const types: Record<string, string> = {
    low_temperature: "🌡️ Low Temperature",
    high_temperature: "🌡️ High Temperature",
    low_humidity: "💧 Low Humidity",
    high_humidity: "💧 High Humidity",
    low_bee_count: "🐝 Low Bee Activity",
    system_inactive: "⚠️ System Inactive",
    temp_difference: "🌡️ Temperature Difference",
  }
  return types[alertType] || "⚠️ Alert"
}

// Alternative: Simple email using a webhook service
export async function sendSimpleAlertEmail(data: AlertEmailData) {
  try {
    // Using a simple webhook service like EmailJS or similar
    const emailData = {
      to_email: data.alertEmail,
      subject: `🐝 Beehive Alert: ${data.beehiveName}`,
      message: `
Alert from ${data.beehiveName} (${data.location})

Alert Type: ${getAlertTypeDisplay(data.alertType)}
Message: ${data.message}
Time: ${new Date(data.timestamp).toLocaleString()}

Please check your dashboard for more details.
      `,
    }

    console.log("📧 Alert Email Data:", emailData)

    // For now, we'll just log the email. You can integrate with any email service here
    return { success: true, message: "Alert email logged" }
  } catch (error) {
    console.error("Error sending simple alert email:", error)
    return { success: false, error: "Simple email service error" }
  }
}
