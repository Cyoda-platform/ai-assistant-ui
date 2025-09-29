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
}

export interface ChatData {
  chat_id: string;
  date: string;
  description: string;
  last_modified: string;
  name: string;
  technical_id: string;
}
