import type { ChatRequest, ChatResponse } from '@/types/chat';

class ChatAPI {
  private baseURL = '/api';

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Prepare form data for file uploads
      const formData = new FormData();

      // Add text message
      formData.append('message', request.message);

      // Add context (previous messages)
      const contextMessages = request.context.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));
      formData.append('context', JSON.stringify(contextMessages));

      // Add attachments
      request.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chat API error:', error);
      throw new Error('Failed to send message');
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload file');
    }
  }
}

export const chatAPI = new ChatAPI();
