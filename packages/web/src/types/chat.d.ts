export interface CreateChatRequest {
  message: string;
  technical_id: string;
}

export interface CreateChatResponse {
  message: string;
  technical_id: string;
}

export interface ChatResponse {
  chats: ChatData[];
  limit?: number;
  next_cursor?: string | null;
  has_more?: boolean;
  cached?: boolean;
}

export interface ChatData {
  chat_id: string;
  date: string;
  description: string;
  last_modified: string;
  name: string;
  technical_id: string;
  status?: 'open' | 'archived'; // Chat status - canvas only available for 'open' chats
}
