import { Client, IndexRequest, SearchRequest, SearchResponse } from '@elastic/elasticsearch';
import { Email } from '../types/email';

const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'changeme',
  },
});

export class ElasticsearchService {
  async initialize() {
    try {
      await client.indices.create({
        index: 'emails',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          },
          mappings: {
            dynamic: 'strict',
            properties: {
              id: { type: 'keyword' },
              subject: { type: 'text' },
              from: { type: 'text' },
              to: { type: 'text' },
              body: { type: 'text' },
              date: { type: 'date' },
              account: { type: 'keyword' },
              folder: { type: 'keyword' },
              category: { type: 'keyword' },
              isRead: { type: 'boolean' }
            }
          }
          },
          mappings: {
            dynamic: 'strict',
            properties: {
              id: { type: 'keyword' },
              subject: { type: 'text' },
              from: { type: 'text' },
              to: { type: 'text' },
              body: { type: 'text' },
              date: { type: 'date' },
              account: { type: 'keyword' },
              folder: { type: 'keyword' },
              category: { type: 'keyword' },
              isRead: { type: 'boolean' }
            }
          }
        }
      },
      {
        ignore: [400]
      })
      .then(() => {
        console.log('Elasticsearch index created successfully');
      })
      .catch((error) => {
        console.error('Error creating Elasticsearch index:', error);
      });
              id: { type: 'keyword' },
              subject: { type: 'text' },
              from: { type: 'text' },
              to: { type: 'text' },
              body: { type: 'text' },
              date: { type: 'date' },
              account: { type: 'keyword' },
              folder: { type: 'keyword' },
              category: { type: 'keyword' },
              isRead: { type: 'boolean' }
            }
          }
        }
      },
      {
        ignore: [400]
      }
    );
    console.log('Elasticsearch index created successfully');
    } catch (error) {
      console.error('Error initializing Elasticsearch:', error);
    }
  }

  async indexEmail(email: Email) {
    try {
      await client.index({
        index: 'emails',
        id: email.id,
        body: email as IndexRequest<Email>['body'],
      });
      console.log(`Email indexed successfully: ${email.id}`);
    } catch (error) {
      console.error('Error indexing email:', error);
    }
  }

  async searchEmails(query: string, filters: any = {}) {
    try {
      const response = await client.search<Email>({
        index: 'emails',
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['subject', 'from', 'to', 'body'],
                    type: 'best_fields',
                  },
                },
              ],
              filter: Object.entries(filters).map(([field, value]) => ({
                term: { [field]: value },
              })),
            },
          },
          size: 100,
        },
      });
      return response.hits.hits.map((hit) => hit._source);
      return body.hits.hits.map((hit) => hit._source);
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }
}

export const elasticsearchService = new ElasticsearchService();
