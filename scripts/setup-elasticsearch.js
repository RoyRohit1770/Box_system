// Elasticsearch setup script for local development
// This script would set up the Elasticsearch instance and create necessary indices

const { Client } = require("@elastic/elasticsearch")

async function setupElasticsearch() {
  const client = new Client({
    node: "http://localhost:9200",
  })

  try {
    // Check if Elasticsearch is running
    const health = await client.cluster.health()
    console.log("Elasticsearch cluster health:", health.status)

    // Create emails index if it doesn't exist
    const indexExists = await client.indices.exists({
      index: "emails",
    })

    if (!indexExists) {
      await client.indices.create({
        index: "emails",
        body: {
          mappings: {
            properties: {
              id: { type: "keyword" },
              subject: {
                type: "text",
                analyzer: "standard",
              },
              from: { type: "keyword" },
              to: { type: "keyword" },
              body: {
                type: "text",
                analyzer: "standard",
              },
              date: { type: "date" },
              account: { type: "keyword" },
              folder: { type: "keyword" },
              category: { type: "keyword" },
              isRead: { type: "boolean" },
              attachments: {
                type: "nested",
                properties: {
                  filename: { type: "keyword" },
                  contentType: { type: "keyword" },
                  size: { type: "long" },
                },
              },
            },
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                email_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "stop"],
                },
              },
            },
          },
        },
      })
      console.log("Created emails index")
    } else {
      console.log("Emails index already exists")
    }

    // Index sample emails for testing
    const sampleEmails = [
      {
        id: "sample-1",
        subject: "Welcome to our platform",
        from: "welcome@platform.com",
        to: "user@email.com",
        body: "Thank you for joining our platform. We are excited to have you!",
        date: new Date().toISOString(),
        account: "user@email.com",
        folder: "INBOX",
        category: "interested",
        isRead: false,
      },
    ]

    for (const email of sampleEmails) {
      await client.index({
        index: "emails",
        id: email.id,
        body: email,
      })
    }

    console.log("Elasticsearch setup completed successfully")
  } catch (error) {
    console.error("Elasticsearch setup failed:", error)
  }
}

setupElasticsearch()
