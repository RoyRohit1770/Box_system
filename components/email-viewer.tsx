"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Reply, Forward, Archive, Trash2, Brain, Sparkles } from "lucide-react"
import { useState } from "react"

interface Email {
  id: string
  subject: string
  from: string
  to: string
  body: string
  date: string
  account: string
  folder: string
  category: "interested" | "meeting_booked" | "not_interested" | "spam" | "out_of_office" | "uncategorized"
  isRead: boolean
}

interface EmailViewerProps {
  email: Email | null
  onCategoryChange: (emailId: string, category: Email['category']) => void
}

const categoryOptions = [
  { value: "interested", label: "Interested", color: "bg-green-100 text-green-800" },
  { value: "meeting_booked", label: "Meeting Booked", color: "bg-blue-100 text-blue-800" },
  { value: "not_interested", label: "Not Interested", color: "bg-red-100 text-red-800" },
  { value: "spam", label: "Spam", color: "bg-orange-100 text-orange-800" },
  { value: "out_of_office", label: "Out of Office", color: "bg-purple-100 text-purple-800" },
  { value: "uncategorized", label: "Uncategorized", color: "bg-gray-100 text-gray-800" },
]

export function EmailViewer({ email, onCategoryChange }: EmailViewerProps) {
  const [suggestedReply, setSuggestedReply] = useState("")
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)
  const [replyText, setReplyText] = useState("")

  const generateSuggestedReply = async () => {
    if (!email) return

    setIsGeneratingReply(true)
    try {
      const response = await fetch("/api/ai/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailContent: email.body,
          emailSubject: email.subject,
          emailFrom: email.from,
          category: email.category,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestedReply(data.suggestedReply)
        setReplyText(data.suggestedReply)
      } else {
        // Fallback reply when API fails
        const fallbackReply = "Thank you for your email. I will review it and get back to you soon."
        setSuggestedReply(fallbackReply)
        setReplyText(fallbackReply)
      }
    } catch (error) {
      console.error("Failed to generate reply:", error)
      // Provide a basic fallback reply
      const fallbackReply = "Thank you for your email. I appreciate your time and will respond shortly."
      setSuggestedReply(fallbackReply)
      setReplyText(fallbackReply)
    } finally {
      setIsGeneratingReply(false)
    }
  }

  if (!email) {
    return (
      <Card className="w-full max-h-[85vh] overflow-y-auto">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select an email to view</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-h-[85vh] overflow-y-auto">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{email.subject}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                <strong>From:</strong> {email.from}
              </span>
              <span>
                <strong>To:</strong> {email.to}
              </span>
              <span>{new Date(email.date).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={email.category} onValueChange={(val) => onCategoryChange(email.id, val as Email['category'])}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-full">
        {/* Action Buttons at Top */}
        <div className="border-b bg-gray-50 p-4 rounded-t-lg shadow-sm">
          <div className="flex flex-wrap gap-3 justify-start items-center">
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg shadow transition-all hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 px-4 py-2"
            >
              <Reply className="h-4 w-4 mr-2 text-blue-500" />
              Reply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg shadow transition-all hover:bg-green-50 focus:ring-2 focus:ring-green-200 px-4 py-2"
            >
              <Forward className="h-4 w-4 mr-2 text-green-600" />
              Forward
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg shadow transition-all hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-200 px-4 py-2"
            >
              <Archive className="h-4 w-4 mr-2 text-yellow-600" />
              Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg shadow transition-all hover:bg-red-50 focus:ring-2 focus:ring-red-200 px-4 py-2"
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
              Delete
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={generateSuggestedReply}
              disabled={isGeneratingReply}
              className="rounded-lg shadow transition-all border-purple-300 hover:bg-purple-100 focus:ring-2 focus:ring-purple-300 px-4 py-2 text-purple-800 font-semibold"
            >
              <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
              {isGeneratingReply ? "Generating..." : "AI Suggestion"}
            </Button>
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.body }} />
        </div>

        {/* AI Suggested Reply */}
        {(isGeneratingReply || suggestedReply) && (
          <div className="border-t p-8 bg-gradient-to-br from-white to-purple-50">
            <div className="bg-white border-l-8 border-purple-600 rounded-2xl shadow-xl p-8 mb-4 flex flex-col gap-4 max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <Sparkles className="h-8 w-8 text-purple-700" />
                <span className="text-2xl font-extrabold text-purple-800 tracking-tight">AI Suggested Reply</span>
              </div>
              <div className="px-6 py-5 text-lg font-semibold text-gray-900 rounded-lg bg-purple-50 border border-purple-200 shadow-inner whitespace-pre-line break-words">
                {isGeneratingReply ? "Generating reply..." : suggestedReply}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
