import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ContextItem {
  id: string;
  content: string;
  contextType: string;
  metadata: any;
  embedding: number[];
}

export class VectorStore {
  // Using 'any' to accommodate different Pinecone client versions without strict typing issues.
  private client: any;
  private index: any;
  private indexName: string = 'email-context';

  constructor() {
    this.client = new Pinecone();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.client.init({
        environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
        apiKey: process.env.PINECONE_API_KEY,
      });

      // Create index if it doesn't exist
      const indexes = await this.client.listIndexes();
      if (!indexes.includes(this.indexName)) {
        await this.client.createIndex({
          name: this.indexName,
          metric: 'cosine',
          dimension: 1536, // Dimension of text-embedding-3-small
        });
      }

      this.index = await this.client.Index(this.indexName);
    } catch (error) {
      console.error('Error initializing vector store:', error);
    }
  }

  async findSimilarContext(query: string, limit = 3): Promise<ContextItem[]> {
    try {
      // Generate embedding for the query
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      const queryEmbedding = response.data[0].embedding;

      // Query Pinecone
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
      });

      return queryResponse.matches.map((match: any) => ({
        id: match.id,
        content: match.metadata.content,
        contextType: match.metadata.contextType,
        metadata: match.metadata,
        embedding: match.vector,
      }));
    } catch (error) {
      console.error('Error finding similar context:', error);
      throw error;
    }
  }

  async addContext(content: string, contextType: string, metadata: any = {}): Promise<void> {
    try {
      // Generate embedding for the content
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });
      const embedding = response.data[0].embedding;

      // Create unique ID
      const id = `${contextType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store in Pinecone
      await this.index.upsert({
        vectors: [
          {
            id,
            values: embedding,
            metadata: {
              content,
              contextType,
              ...metadata,
            },
          },
        ],
      });

      console.log('Context added to vector store:', id);
    } catch (error) {
      console.error('Error adding context:', error);
      throw error;
    }
  }

  async initializeWithProductAgenda(agenda: string[]) {
    try {
      for (const item of agenda) {
        await this.addContext(item, 'product_agenda', {
          type: 'product',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error initializing product agenda:', error);
      throw error;
    }
  }

  async initializeWithOutreachAgenda(agenda: string[]) {
    try {
      for (const item of agenda) {
        await this.addContext(item, 'outreach_agenda', {
          type: 'outreach',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error initializing outreach agenda:', error);
      throw error;
    }
  }
}

export const vectorStore = new VectorStore();
