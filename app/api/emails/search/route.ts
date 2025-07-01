import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    // Mock search implementation
    const mockSearchResults = [
      {
        id: "search-1",
        subject: `Search result for: ${query}`,
        from: "search@example.com",
        to: "user@email.com",
        body: `<p>This email contains the search term: <strong>${query}</strong></p>`,
        date: new Date().toISOString(),
        account: "user@email.com",
        folder: "INBOX",
        category: "uncategorized" as const,
        isRead: false,
        relevanceScore: 0.95,
      },
    ]

    return NextResponse.json({
      success: true,
      emails: mockSearchResults,
      query,
      total: mockSearchResults.length,
    })
  } catch (error) {
    console.error("Search error:", error)
    // Return empty array on error to prevent UI crashes
    return NextResponse.json({
      success: true,
      emails: [],
      query: "",
      total: 0,
    })
  }
}
