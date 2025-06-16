import type { ChatRequest, ChatResponse } from '@/types/chat';

class ChatAPI {
  private baseURL = 'https://legendary-space-tribble-x5r7rw5696q7h97wv-5000.app.github.dev';

  async sendMessage(request: ChatRequest, options: { maxContext?: number; maxLength?: number }): Promise<ChatResponse> {
    try {
      // Prepare form data for file uploads
      const formData = new FormData();

      // Add text message
      formData.append('message', request.message);
      let totalSize = request.message.length;

      // Add database ID if present (excluded from size calculation)
      if (request.dbId) {
        formData.append('dbId', request.dbId);
      }

      // Add context only if maxContext > 0
      let contextMessages: any[] = [];
      if (options.maxContext && options.maxContext > 0) {
        // Limit context to maxContext number of messages
        const limitedContext = request.context.slice(-options.maxContext);

        contextMessages = limitedContext.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }));

        // Calculate context size
        const contextSize = contextMessages.reduce((sum, msg) => sum + msg.content.length, 0);
        totalSize += contextSize;

        // Check if we exceed maxLength with context
        if (options.maxLength && totalSize > options.maxLength) {
          // Remove context messages until we're under the limit
          while (contextMessages.length > 0 && totalSize > options.maxLength) {
            const removedMsg = contextMessages.shift();
            if (removedMsg) {
              totalSize -= removedMsg.content.length;
            }
          }
        }

        if (contextMessages.length > 0) {
          formData.append('context', JSON.stringify(contextMessages));
        }
      }

      // Add attachments if they fit within maxLength
      const attachmentsToSend: File[] = [];
      if (request.attachments && request.attachments.length > 0) {
        for (const file of request.attachments) {
          // Estimate attachment size (use file size as approximation)
          if (!options.maxLength || totalSize + file.size <= options.maxLength) {
            attachmentsToSend.push(file);
            totalSize += file.size;
          } else {
            break; // Stop adding attachments if we exceed maxLength
          }
        }

        attachmentsToSend.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      console.log('Sending message to chat API:', {
        message: request.message,
        dbId: request.dbId,
        context: contextMessages.length > 0 ? contextMessages.map((msg) => ({ role: msg.role, content: msg.content })) : 'Not sent',
        attachments: attachmentsToSend.map((file) => file.name),
        totalSize,
        maxLength: options.maxLength,
        maxContext: options.maxContext,
      });

      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.response || '',
        error: data.error || '',
      };
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
