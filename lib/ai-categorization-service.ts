import OpenAI from 'openai';
import { Email } from '../types/email';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Category {
  label: string;
  description: string;
}

const CATEGORIES: Category[] = [
  {
    label: 'interested',
    description: 'The email shows clear interest in the candidate or opportunity',
  },
  {
    label: 'meeting_booked',
    description: 'The email confirms a scheduled meeting or interview',
  },
  {
    label: 'not_interested',
    description: 'The email indicates lack of interest or rejection',
  },
  {
    label: 'spam',
    description: 'The email is unsolicited or promotional',
  },
  {
    label: 'out_of_office',
    description: 'The email is an automatic out-of-office reply',
  },
];

export class AICategorizationService {
  async categorizeEmail(email: Email): Promise<string> {
    try {
      const prompt = `Categorize the following email into one of these categories: ${CATEGORIES.map(c => c.label).join(', ')}

      Email subject: ${email.subject}
      From: ${email.from}
      Content: ${email.body}

      Respond with just the category label (e.g., 'interested')`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an email categorization assistant. Categorize emails based on their content and context. Consider these categories: ${CATEGORIES.map(c => `${c.label}: ${c.description}`).join(', ')}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 50,
      });

      const category = response.data.choices[0].message.content.trim();
      return CATEGORIES.find(c => c.label === category)?.label || 'uncategorized';
    } catch (error) {
      console.error('Error categorizing email:', error);
      return 'uncategorized';
    }
  }
}

export const aiCategorizationService = new AICategorizationService();
