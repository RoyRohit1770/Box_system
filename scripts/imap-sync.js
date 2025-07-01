// IMAP synchronization script
// This demonstrates the real-time email sync implementation

const Imap = require("imap")
const { simpleParser } = require("mailparser")
const { Client } = require("@elastic/elasticsearch")

class IMAPSync {
  constructor(config) {
    this.config = config
    this.imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.imapServer || this.getImapServer(config.provider),
      port: config.imapPort || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    this.elasticsearch = new Client({
      node: "http://localhost:9200",
    })
  }

  getImapServer(provider) {
    const servers = {
      gmail: "imap.gmail.com",
      outlook: "outlook.office365.com",
      yahoo: "imap.mail.yahoo.com",
    }
    return servers[provider] || "imap.gmail.com"
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        console.log(`IMAP connected for ${this.config.email}`)
        resolve()
      })

      this.imap.once("error", (err) => {
        console.error("IMAP connection error:", err)
        reject(err)
      })

      this.imap.connect()
    })
  }

  async syncFolder(folderName = "INBOX") {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folderName, false, (err, box) => {
        if (err) {
          reject(err)
          return
        }

        // Fetch emails from the last 30 days
        const since = new Date()
        since.setDate(since.getDate() - 30)

        const searchCriteria = ["SINCE", since]

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err)
            return
          }

          if (results.length === 0) {
            console.log("No new emails found")
            resolve([])
            return
          }

          const fetch = this.imap.fetch(results, {
            bodies: "",
            struct: true,
          })

          const emails = []

          fetch.on("message", (msg, seqno) => {
            let buffer = ""

            msg.on("body", (stream, info) => {
              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8")
              })
            })

            msg.once("end", async () => {
              try {
                const parsed = await simpleParser(buffer)
                const email = {
                  id: `${this.config.email}-${seqno}-${Date.now()}`,
                  subject: parsed.subject || "No Subject",
                  from: parsed.from?.text || "Unknown",
                  to: parsed.to?.text || this.config.email,
                  body: parsed.html || parsed.text || "",
                  date: parsed.date?.toISOString() || new Date().toISOString(),
                  account: this.config.email,
                  folder: folderName,
                  category: "uncategorized",
                  isRead: false,
                }

                // Categorize email using AI
                const category = await this.categorizeEmail(email)
                email.category = category

                // Index in Elasticsearch
                await this.indexEmail(email)

                // Send notifications if interested
                if (category === "interested") {
                  await this.sendNotifications(email)
                }

                emails.push(email)
              } catch (parseError) {
                console.error("Email parsing error:", parseError)
              }
            })
          })

          fetch.once("end", () => {
            console.log(`Synced ${emails.length} emails from ${folderName}`)
            resolve(emails)
          })

          fetch.once("error", (err) => {
            reject(err)
          })
        })
      })
    })
  }

  async categorizeEmail(email) {
    try {
      const response = await fetch("http://localhost:3000/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailContent: email.body,
          emailSubject: email.subject,
          emailFrom: email.from,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.category
      }
    } catch (error) {
      console.error("Categorization failed:", error)
    }

    return "uncategorized"
  }

  async indexEmail(email) {
    try {
      await this.elasticsearch.index({
        index: "emails",
        id: email.id,
        body: email,
      })
    } catch (error) {
      console.error("Elasticsearch indexing failed:", error)
    }
  }

  async sendNotifications(email) {
    try {
      // Send Slack notification
      const slackWebhook = process.env.SLACK_WEBHOOK_URL
      if (slackWebhook) {
        await fetch(slackWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🎯 New Interested Email from ${email.from}`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Subject:* ${email.subject}\n*From:* ${email.from}`,
                },
              },
            ],
          }),
        })
      }

      // Trigger webhook
      const webhookUrl = "https://webhook.site/your-unique-url"
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "email_interested",
          email: email,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Notification failed:", error)
    }
  }

  startIdleMode() {
    this.imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        console.error("Failed to open INBOX for IDLE:", err)
        return
      }

      console.log("Starting IDLE mode for real-time sync...")

      this.imap.on("mail", async (numNewMsgs) => {
        console.log(`${numNewMsgs} new emails received`)
        try {
          await this.syncFolder("INBOX")
        } catch (error) {
          console.error("Real-time sync failed:", error)
        }
      })

      // Start IDLE
      this.imap.idle()
    })
  }

  disconnect() {
    this.imap.end()
  }
}

// Example usage
async function startSync() {
  const accounts = [
    {
      email: "user@gmail.com",
      password: "app-password",
      provider: "gmail",
    },
    {
      email: "user@outlook.com",
      password: "password",
      provider: "outlook",
    },
  ]

  for (const account of accounts) {
    try {
      const sync = new IMAPSync(account)
      await sync.connect()
      await sync.syncFolder("INBOX")
      sync.startIdleMode()

      console.log(`Started real-time sync for ${account.email}`)
    } catch (error) {
      console.error(`Failed to start sync for ${account.email}:`, error)
    }
  }
}

// Start the sync process
startSync()
