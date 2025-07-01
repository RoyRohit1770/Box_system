import { type NextRequest, NextResponse } from "next/server"

// Mock OpenAI function that doesn't require API key
const mockGenerateInsights = (emails: any[]) => {
  // Simulate AI processing delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const insights = generateFallbackInsights(emails)
      resolve(insights)
    }, 500)
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails } = body

    // Use mock insights generation (no API key needed)
    const insights = await mockGenerateInsights(emails)

    return NextResponse.json({
      success: true,
      insights,
      method: "mock-ai",
    })
  } catch (error) {
    console.error("AI insights error:", error)
    // Always return valid data even on error
    return NextResponse.json({
      success: true,
      insights: generateFallbackInsights([]),
      method: "error-fallback",
    })
  }
}

function generateFallbackInsights(emails: any[]) {
  const interestedEmails = emails.filter((e) => e.category === "interested")
  const meetingEmails = emails.filter((e) => e.category === "meeting_booked")
  const spamEmails = emails.filter((e) => e.category === "spam")
  const recentEmails = emails.filter((e) => {
    const emailDate = new Date(e.date)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return emailDate > dayAgo
  })

  const conversionRate =
    interestedEmails.length > 0 ? Math.round((meetingEmails.length / interestedEmails.length) * 100) : 0

  return [
    {
      type: "trend",
      title: "Email Activity",
      description: `You have ${emails.length} total emails with ${recentEmails.length} received in the last 24 hours`,
      value: `${emails.length}`,
      change: recentEmails.length > 0 ? `+${recentEmails.length} today` : "No new emails",
    },
    {
      type: "opportunity",
      title: "Interested Leads",
      description: `${interestedEmails.length} emails show interest and may need follow-up`,
      value: `${interestedEmails.length}`,
    },
    {
      type: "alert",
      title: "Meeting Conversion",
      description: `${meetingEmails.length} meetings booked from ${interestedEmails.length} interested leads`,
      value: `${conversionRate}%`,
    },
    {
      type: "suggestion",
      title: "Email Management",
      description: `${spamEmails.length} spam emails detected. Consider setting up better filters.`,
      value: `${spamEmails.length} spam`,
    },
  ]
}
