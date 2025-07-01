"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Mail, Filter, Settings, Zap, MessageSquare } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { EmailList } from "@/components/email-list"
import { EmailViewer } from "@/components/email-viewer"
import { AccountSetup } from "@/components/account-setup"
import { AIInsights } from "@/components/ai-insights"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator } from "@/components/ui/select"

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

// Utility to coerce and validate raw email objects coming back from the API so that they
// satisfy our strongly-typed `Email` interface. This prevents TypeScript errors when the
// `category` field is typed as a plain string in the response payload.
const normalizeEmails = (rawEmails: any[] = []): Email[] => {
  const allowed: Email["category"][] = [
    "interested",
    "meeting_booked",
    "not_interested",
    "spam",
    "out_of_office",
    "uncategorized",
  ]
  return rawEmails.map((email) => {
    const category = allowed.includes(email.category) ? email.category : "uncategorized"
    return {
      ...email,
      category: category as Email["category"],
    }
  })
}

interface Account {
  id: string
  email: string
  provider: string
  status: "connected" | "syncing" | "error"
  lastSync: string
}

export default function EmailOnebox() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch emails on component mount
  useEffect(() => {
    fetchEmails()
    fetchAccounts()

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchEmails()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchEmails = async () => {
    try {
      setError(null)
      const response = await fetch("/api/emails")
      if (response.ok) {
        const data = await response.json()
        setEmails(normalizeEmails(data.emails))
      } else {
        console.error("Failed to fetch emails: API returned error")
        setError("Failed to load emails. Please try again.")
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error)
      setError("Failed to load emails. Please check your connection.")
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts")
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      // Don't set error state here to avoid UI disruption
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchEmails()
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/emails/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setEmails(normalizeEmails(data.emails))
      } else {
        console.error("Search failed: API returned error")
        setError("Search failed. Please try again.")
      }
    } catch (error) {
      console.error("Search failed:", error)
      setError("Search failed. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEmails = emails.filter((email) => {
    const categoryMatch = selectedCategory === "all" || email.category === selectedCategory
    const accountMatch = selectedAccount === "all" || email.account === selectedAccount
    return categoryMatch && accountMatch
  })

  const categoryStats = {
    interested: emails.filter((e) => e.category === "interested").length,
    meeting_booked: emails.filter((e) => e.category === "meeting_booked").length,
    not_interested: emails.filter((e) => e.category === "not_interested").length,
    spam: emails.filter((e) => e.category === "spam").length,
    out_of_office: emails.filter((e) => e.category === "out_of_office").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Onebox</h1>
          <p className="text-gray-600">AI-powered email management and synchronization</p>
            <ThemeToggle />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <p>{error}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={fetchEmails}>
              Retry
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Interested</p>
                  <p className="text-2xl font-bold text-green-600">{categoryStats.interested}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Meetings</p>
                  <p className="text-2xl font-bold text-blue-600">{categoryStats.meeting_booked}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Not Interested</p>
                  <p className="text-2xl font-bold text-red-600">{categoryStats.not_interested}</p>
                </div>
                <Mail className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Spam</p>
                  <p className="text-2xl font-bold text-orange-600">{categoryStats.spam}</p>
                </div>
                <Filter className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Out of Office</p>
                  <p className="text-2xl font-bold text-purple-600">{categoryStats.out_of_office}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="emails" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="emails" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isLoading}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40" aria-label="Filter by category" title="Filter by category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectSeparator />
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
                        <SelectItem value="not_interested">Not Interested</SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="out_of_office">Out of Office</SelectItem>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger className="w-44" aria-label="Filter by account" title="Filter by account">
                        <SelectValue placeholder="All Accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        <SelectSeparator />
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.email}>
                            {account.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmailList emails={filteredEmails} selectedEmail={selectedEmail} onSelectEmail={setSelectedEmail} />

              <EmailViewer
                email={selectedEmail}
                onCategoryChange={(emailId, category) => {
                  setEmails(emails.map((email) => (email.id === emailId ? { ...email, category } : email)))
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="accounts">
            <AccountSetup accounts={accounts} onAccountsChange={setAccounts} />
          </TabsContent>

          <TabsContent value="ai-insights">
            <AIInsights emails={emails} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Sync Settings</h3>
                  <p className="text-sm text-gray-600 mb-2">Configure email synchronization preferences</p>
                  <Button variant="outline">Configure Sync</Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">AI Configuration</h3>
                  <p className="text-sm text-gray-600 mb-2">Manage AI categorization and reply suggestions</p>
                  <Button variant="outline">AI Settings</Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Integrations</h3>
                  <p className="text-sm text-gray-600 mb-2">Configure Slack and webhook integrations</p>
                  <Button variant="outline">Manage Integrations</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
