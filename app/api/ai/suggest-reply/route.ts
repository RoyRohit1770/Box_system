import { type NextRequest, NextResponse } from "next/server"

import { ragService } from "@/lib/rag-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      category = "uncategorized",
      emailSubject = "",
      emailFrom = "",
      emailContent = ""
    } = body

    const openaiApiKey = process.env.OPENAI_API_KEY
    let suggestedReply: string
    let method = "template-based"
    let confidence = 0.8

    if (openaiApiKey) {
      try {
        suggestedReply = await ragService.generateContextualReply(
          emailContent,
          emailSubject,
          emailFrom,
          category
        )
        method = "rag-ai"
        confidence = 0.95
      } catch (ragError) {
        console.error("RAGService failed, falling back to template reply:", ragError)
        suggestedReply = generateTemplateReply(category, emailSubject, emailFrom)
        method = "template-fallback"
        confidence = 0.8
      }
    } else {
      suggestedReply = generateTemplateReply(category, emailSubject, emailFrom)
      method = "template-no-key"
      confidence = 0.8
    }

    return NextResponse.json({
      success: true,
      suggestedReply,
      confidence,
      method,
    })
  } catch (error) {
    console.error("Reply suggestion error:", error)
    // Return a safe default reply even on error
    const fallbackReply = "Thank you for your email. I will review it and get back to you soon."
    return NextResponse.json({
      success: true,
      suggestedReply: fallbackReply,
      confidence: 0.6,
      method: "error-fallback",
    })
  }
}

function generateTemplateReply(category: string, subject: string, from: string): string {
  try {
    // Simple heuristic-based suggestions for the common "interview invitation" flow.
    // In production this should reference a richer templating system or RAG/LLM service.
    const templates = [
      `Thank you for shortlisting my profile! I'm excited to proceed with the interview process. You can book a convenient slot for the technical round here: https://cal.com/example`,
      `I appreciate the opportunity and would be happy to attend the technical interview. Feel free to choose a time that works for you using this link: https://cal.com/example`,
      `Glad to hear from you! I'm available for the technical interview and you can reserve a slot that suits you best at: https://cal.com/example`,
      `Thank you for considering my application. I'm ready for the technical interview and you can schedule it at your convenience via: https://cal.com/example`,
    ]

    const randomIndex = Math.floor(Math.random() * templates.length)
    return templates[randomIndex]
  } catch (error) {
    console.error("Template reply generation error:", error)
    return "Thank you for shortlisting my profile! I'm available for a technical interview. You can book a slot here: https://cal.com/example"
  }
}
