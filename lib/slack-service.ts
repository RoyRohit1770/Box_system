import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export class SlackService {
  async sendNotification(email: any) {
    try {
      const response = await slack.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID || '#emails',
        text: `New Interested Email Received!

Subject: ${email.subject}
From: ${email.from}
Content: ${email.body.slice(0, 200)}...`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*New Interested Email Received!*

Subject: *${email.subject}*
From: *${email.from}*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Content: ${email.body.slice(0, 200)}...`,
            },
          },
        ],
      });
      return response;
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      return null;
    }
  }
}

export const slackService = new SlackService();
