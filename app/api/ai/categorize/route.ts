import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailContent, emailSubject, emailFrom } = body

    // Use rule-based categorization (no API key needed)
    const category = categorizeEmailRuleBased(emailContent, emailSubject, emailFrom)

    return NextResponse.json({
      success: true,
      category,
      confidence: 0.75,
      method: "rule-based",
    })
  } catch (error) {
    console.error("Email categorization error:", error)
    // Return a safe default even on error
    return NextResponse.json({
      success: true,
      category: "uncategorized",
      confidence: 0.5,
      method: "error-fallback",
    })
  }
}

function categorizeEmailRuleBased(content: string, subject: string, from: string): string {
  try {
    const text = `${subject || ""} ${content || ""} ${from || ""}`.toLowerCase()

    // Rule-based categorization logic
    if (text.includes("out of office") || text.includes("auto-reply") || text.includes("automatic reply")) {
      return "out_of_office"
    }

    if (
      text.includes("meeting") &&
      (text.includes("scheduled") || text.includes("confirmed") || text.includes("booked"))
    ) {
      return "meeting_booked"
    }

    if (
      text.includes("interested") ||
      text.includes("would like to") ||
      text.includes("schedule") ||
      text.includes("interview")
    ) {
      return "interested"
    }

    if (
      text.includes("not interested") ||
      text.includes("no longer") ||
      text.includes("declined") ||
      text.includes("pass")
    ) {
      return "not_interested"
    }

    if (
      text.includes("unsubscribe") ||
      text.includes("promotion") ||
      text.includes("offer") ||
      (from && from.includes("noreply"))
    ) {
      return "spam"
    }

    return "uncategorized"
  } catch (error) {
    console.error("Rule-based categorization error:", error)
    return "uncategorized"
  }
}
