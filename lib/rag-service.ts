import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { vectorStore } from "./vector-store"

export class RAGService {
  async generateContextualReply(
    emailContent: string,
    emailSubject: string,
    emailFrom: string,
    category: string,
  ): Promise<string> {
    try {
      // Find relevant context using vector search
      const relevantContexts = await vectorStore.findSimilarContext(`${emailSubject} ${emailContent}`, 3)

      // Build context string
      const contextString = relevantContexts.map((ctx) => `Context: ${ctx.content}`).join("\n\n")

      // Generate reply using AI SDK with RAG context[^1]
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `You are an AI assistant helping to draft professional email replies for a job seeker.

Use the following context to inform your response:
${contextString}

Guidelines:
- Be professional and concise
- If the email shows interest in scheduling, include the booking link: https://cal.com/candidate
- Match the tone of the original email
- Express appropriate enthusiasm for opportunities
- Keep responses under 150 words`,
        prompt: `Generate a professional reply to this email:

Subject: ${emailSubject}
From: ${emailFrom}
Content: ${emailContent}
Category: ${category}

Reply:`,
      })

      return text
    } catch (error) {
      console.error("RAG reply generation failed:", error)
      return this.getFallbackReply(category)
    }
  }

  private getFallbackReply(category: string): string {
    return "Thank you for shortlisting my profile! I'm available for a technical interview. You can book a slot here: https://cal.com/example"
  }
}

export const ragService = new RAGService()
