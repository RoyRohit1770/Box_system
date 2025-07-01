"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, CheckCircle, AlertCircle, Loader } from "lucide-react"
import { useState } from "react"

interface Account {
  id: string
  email: string
  provider: string
  status: "connected" | "syncing" | "error"
  lastSync: string
}

interface AccountSetupProps {
  accounts: Account[]
  onAccountsChange: (accounts: Account[]) => void
}

export function AccountSetup({ accounts, onAccountsChange }: AccountSetupProps) {
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({
    email: "",
    password: "",
    imapServer: "",
    imapPort: "993",
    provider: "gmail",
  })

  const handleAddAccount = async () => {
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      })

      if (response.ok) {
        const data = await response.json()
        onAccountsChange([...accounts, data.account])
        setNewAccount({
          email: "",
          password: "",
          imapServer: "",
          imapPort: "993",
          provider: "gmail",
        })
        setIsAddingAccount(false)
      }
    } catch (error) {
      console.error("Failed to add account:", error)
    }
  }

  const handleSyncAccount = async (accountId: string) => {
    try {
      await fetch(`/api/accounts/${accountId}/sync`, {
        method: "POST",
      })

      // Update account status to syncing
      onAccountsChange(
        accounts.map((account) => (account.id === accountId ? { ...account, status: "syncing" as const } : account)),
      )
    } catch (error) {
      console.error("Failed to sync account:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "syncing":
        return <Loader className="h-4 w-4 text-blue-600 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "syncing":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connected Email Accounts</CardTitle>
            <Button onClick={() => setIsAddingAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email accounts connected</p>
              <p className="text-sm">Add your first account to start syncing emails</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(account.status)}
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <p className="text-sm text-gray-600">
                        {account.provider} • Last sync: {new Date(account.lastSync).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncAccount(account.id)}
                      disabled={account.status === "syncing"}
                    >
                      Sync Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Form */}
      {isAddingAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Email Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <select
                  value={newAccount.provider}
                  onChange={(e) => setNewAccount({ ...newAccount, provider: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook</option>
                  <option value="yahoo">Yahoo</option>
                  <option value="custom">Custom IMAP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password / App Password</label>
                <Input
                  type="password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                  placeholder="Your email password"
                />
              </div>

              {newAccount.provider === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">IMAP Server</label>
                    <Input
                      value={newAccount.imapServer}
                      onChange={(e) => setNewAccount({ ...newAccount, imapServer: e.target.value })}
                      placeholder="imap.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">IMAP Port</label>
                    <Input
                      value={newAccount.imapPort}
                      onChange={(e) => setNewAccount({ ...newAccount, imapPort: e.target.value })}
                      placeholder="993"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAccount}>Add Account</Button>
              <Button variant="outline" onClick={() => setIsAddingAccount(false)}>
                Cancel
              </Button>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p>
                <strong>Note:</strong> For Gmail, you'll need to use an App Password instead of your regular password.
              </p>
              <p>Enable 2-factor authentication and generate an App Password in your Google Account settings.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
