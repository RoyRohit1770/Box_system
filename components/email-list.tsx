"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, MailOpen } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface EmailListProps {
  emails: Email[]
  selectedEmail: Email | null
  onSelectEmail: (email: Email) => void
}

const categoryColors = {
  interested: "bg-green-100 text-green-800",
  meeting_booked: "bg-blue-100 text-blue-800",
  not_interested: "bg-red-100 text-red-800",
  spam: "bg-orange-100 text-orange-800",
  out_of_office: "bg-purple-100 text-purple-800",
  uncategorized: "bg-gray-100 text-gray-800",
}

export function EmailList({ emails, selectedEmail, onSelectEmail }: EmailListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="h-[600px] overflow-hidden">
      <CardContent className="p-0">
        <div className="h-full overflow-y-auto">
          {emails.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails found</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className={cn(
                    "cursor-pointer px-4 py-3 border-b transition-colors",
                    selectedEmail?.id === email.id
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/70",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {email.isRead ? (
                        <MailOpen className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-600" />
                      )}
                      <span
                        title={email.from}
                        className={cn("font-medium text-sm", !email.isRead && "font-semibold")}
                      >
                        {email.from}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(email.date)}</span>
                  </div>

                  <h3
                    className={cn(
                      "text-sm mb-2 line-clamp-1",
                      !email.isRead ? "font-semibold text-gray-900" : "text-gray-700",
                    )}
                  >
                    {email.subject}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                    {email.body.replace(/<[^>]*>/g, "").substring(0, 100)}...
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={cn("text-xs", categoryColors[email.category])}>
                      {email.category.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-gray-500">{email.account}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
