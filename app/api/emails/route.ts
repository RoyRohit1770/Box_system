import { type NextRequest, NextResponse } from "next/server"

// Mock email data for demonstration
const mockEmails = [
  {
    id: "1",
    subject: "Re: Job Application - Software Engineer Position",
    from: "hr@techcorp.com",
    to: "candidate@email.com",
    body: "<p>Thank you for your application. We would like to schedule an interview with you. Are you available next week?</p>",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    account: "candidate@email.com",
    folder: "INBOX",
    category: "interested" as const,
    isRead: false,
  },
  {
    id: "2",
    subject: "Meeting Confirmation - Technical Interview",
    from: "scheduler@techcorp.com",
    to: "candidate@email.com",
    body: "<p>Your technical interview has been scheduled for tomorrow at 2 PM. Please join the meeting using the link below.</p>",
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    account: "candidate@email.com",
    folder: "INBOX",
    category: "meeting_booked" as const,
    isRead: true,
  },
  {
    id: "3",
    subject: "Thank you for your interest",
    from: "noreply@company.com",
    to: "candidate@email.com",
    body: "<p>Thank you for your interest in our company. Unfortunately, we have decided to move forward with other candidates.</p>",
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    account: "candidate@email.com",
    folder: "INBOX",
    category: "not_interested" as const,
    isRead: true,
  },
  {
    id: "4",
    subject: "Out of Office Auto-Reply",
    from: "manager@company.com",
    to: "candidate@email.com",
    body: "<p>I am currently out of office and will return on Monday. I will respond to your email upon my return.</p>",
    date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    account: "candidate@email.com",
    folder: "INBOX",
    category: "out_of_office" as const,
    isRead: true,
  },
  {
    id: "5",
    subject: "Congratulations! You have won $1,000,000",
    from: "spam@suspicious.com",
    to: "candidate@email.com",
    body: "<p>You have won our lottery! Click here to claim your prize now!</p>",
    date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    account: "candidate@email.com",
    folder: "INBOX",
    category: "spam" as const,
    isRead: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would:
    // 1. Connect to Elasticsearch
    // 2. Query emails based on filters
    // 3. Return paginated results

    const searchParams = request.nextUrl.searchParams
    const account = searchParams.get("account")
    const category = searchParams.get("category")
    const folder = searchParams.get("folder")

    let filteredEmails = mockEmails

    if (account && account !== "all") {
      filteredEmails = filteredEmails.filter((email) => email.account === account)
    }

    if (category && category !== "all") {
      filteredEmails = filteredEmails.filter((email) => email.category === category)
    }

    if (folder && folder !== "all") {
      filteredEmails = filteredEmails.filter((email) => email.folder === folder)
    }

    return NextResponse.json({
      success: true,
      emails: filteredEmails,
      total: filteredEmails.length,
    })
  } catch (error) {
    console.error("Error fetching emails:", error)
    // Return empty array on error to prevent UI crashes
    return NextResponse.json({
      success: false,
      emails: [],
      total: 0,
      error: "Failed to fetch emails",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, emailId, data } = body

    // Handle different email actions
    switch (action) {
      case "mark_read":
        // Mark email as read
        break
      case "categorize":
        // Update email category
        // Trigger webhook if category is 'interested'
        if (data.category === "interested") {
          await triggerWebhook(emailId, data)
          await sendSlackNotification(emailId, data)
        }
        break
      case "archive":
        // Archive email
        break
      case "delete":
        // Delete email
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing email action:", error)
    return NextResponse.json({ success: false })
  }
}

async function triggerWebhook(emailId: string, data: any) {
  try {
    // Use webhook.site for demonstration
    const webhookUrl = "https://webhook.site/mock-url"

    // Mock the webhook call without actually making the request
    console.log(`[MOCK] Webhook triggered for email ${emailId}`)
    return true
  } catch (error) {
    console.error("Webhook trigger failed:", error)
    return false
  }
}

async function sendSlackNotification(emailId: string, data: any) {
  try {
    // Mock the Slack notification without actually making the request
    console.log(`[MOCK] Slack notification sent for email ${emailId}`)
    return true
  } catch (error) {
    console.error("Slack notification failed:", error)
    return false
  }
}
