export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
  account: string;
  folder: string;
  category: 'interested' | 'meeting_booked' | 'not_interested' | 'spam' | 'out_of_office' | 'uncategorized';
  isRead: boolean;
}
