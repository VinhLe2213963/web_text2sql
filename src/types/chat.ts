export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface DatabaseItem {
  id: string;
  name: string;
  description: string;
  type?: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  selectedDatabase?: DatabaseItem | null;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  attachments: File[];
  context: Message[];
  dbId?: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}
