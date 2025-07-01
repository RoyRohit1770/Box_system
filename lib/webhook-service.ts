import axios from 'axios';

interface WebhookPayload {
  email: any;
  event: string;
  timestamp: string;
}

export class WebhookService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendWebhook(email: any) {
    try {
      const payload: WebhookPayload = {
        email,
        event: 'interested_email_received',
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error sending webhook:', error);
      return null;
    }
  }
}

// Initialize with webhook.site URL
export const webhookService = new WebhookService(process.env.WEBHOOK_URL || 'https://webhook.site/your-webhook-url');
