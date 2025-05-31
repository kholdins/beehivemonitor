import { type NextRequest, NextResponse } from "next/server"
import { sendSimpleAlertEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, beehiveName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const testEmailData = {
      beehiveName: beehiveName || "Test Beehive",
      location: "Test Location",
      alertType: "test",
      message: "This is a test alert to verify your email configuration is working correctly.",
      timestamp: new Date().toISOString(),
      alertEmail: email,
    }

    const result = await sendSimpleAlertEmail(testEmailData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully! Check your inbox.",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send test email",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      {
        error: "Failed to send test email",
      },
      { status: 500 },
    )
  }
}
