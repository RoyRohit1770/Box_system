import { type NextRequest, NextResponse } from "next/server"

// Mock account data
const mockAccounts = [
  {
    id: "1",
    email: "user@gmail.com",
    provider: "gmail",
    status: "connected" as const,
    lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    email: "user@outlook.com",
    provider: "outlook",
    status: "syncing" as const,
    lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      accounts: mockAccounts,
    })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    // Return empty array on error to prevent UI crashes
    return NextResponse.json({
      success: false,
      accounts: [],
      error: "Failed to fetch accounts",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, imapServer, imapPort, provider } = body

    // In a real implementation, this would:
    // 1. Validate IMAP credentials
    // 2. Test connection
    // 3. Store encrypted credentials
    // 4. Start IMAP IDLE connection
    // 5. Begin initial sync

    const newAccount = {
      id: Date.now().toString(),
      email,
      provider,
      status: "syncing" as const,
      lastSync: new Date().toISOString(),
    }

    // Simulate account setup
    setTimeout(() => {
      // This would trigger the IMAP sync process
      console.log(`Starting IMAP sync for ${email}`)
    }, 1000)

    return NextResponse.json({
      success: true,
      account: newAccount,
    })
  } catch (error) {
    console.error("Error adding account:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to add account",
    })
  }
}
