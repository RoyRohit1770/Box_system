import { Client } from 'imap';
import { MailParser } from 'mailparser';
import { elasticsearchService } from './elasticsearch-service';
import { Email } from '../types/email';

interface IMAPConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export class EmailSyncService {
  private imap: Client;
  private parser: MailParser;
  private account: string;
  private folders: string[];

  constructor(config: IMAPConfig, account: string, folders: string[] = ['INBOX']) {
    this.imap = new Client();
    this.parser = new MailParser();
    this.account = account;
    this.folders = folders;

    this.imap.connect(config);
  }

  private async processMessage(message: any, seqno: number) {
    const email: Email = {
      id: `${this.account}-${seqno}`,
      subject: '',
      from: '',
      to: '',
      body: '',
      date: '',
      account: this.account,
      folder: '',
      category: 'uncategorized',
      isRead: false,
    };

    this.parser.on('headers', (headers) => {
      email.subject = headers.get('subject') || '';
      email.from = headers.get('from') || '';
      email.to = headers.get('to') || '';
    });

    this.parser.on('data', (chunk) => {
      email.body += chunk.toString();
    });

    this.parser.on('end', () => {
      email.date = new Date().toISOString();
      elasticsearchService.indexEmail(email);
    });

    message.pipe(this.parser);
  }

  private async syncFolder(folder: string) {
    try {
      await this.imap.openBox(folder);
      const messages = await this.imap.search(['SINCE', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]);

      for (const seqno of messages) {
        const message = await this.imap.fetch(seqno, { bodies: '' });
        await this.processMessage(message, seqno);
      }
    } catch (error) {
      console.error(`Error syncing folder ${folder}:`, error);
    }
  }

  async start() {
    this.imap.once('ready', async () => {
      console.log('IMAP connection ready');
      
      // Initial sync of all folders
      for (const folder of this.folders) {
        await this.syncFolder(folder);
      }

      // Start IDLE mode for real-time updates
      this.imap.on('mail', async () => {
        console.log('New mail received');
        for (const folder of this.folders) {
          await this.syncFolder(folder);
        }
      });

      this.imap.idle();
    });

    this.imap.on('error', (err) => {
      console.error('IMAP error:', err);
    });

    this.imap.on('end', () => {
      console.log('IMAP connection ended');
    });
  }
}

export const emailSyncService = new EmailSyncService({
  user: process.env.IMAP_USER || '',
  password: process.env.IMAP_PASSWORD || '',
  host: process.env.IMAP_HOST || 'imap.gmail.com',
  port: parseInt(process.env.IMAP_PORT || '993'),
  tls: true,
}, 'primary', ['INBOX']);
