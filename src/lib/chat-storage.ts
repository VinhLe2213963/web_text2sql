import type { ChatHistory } from '@/types/chat';

class ChatStorage {
  private dbName = 'ChatApp';
  private dbVersion = 1;
  private storeName = 'chatHistory';
  private db: IDBDatabase | null = null;

  async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  async saveChatHistory(chatHistory: ChatHistory): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Convert dates to strings for storage
      const dataToStore = {
        ...chatHistory,
        updatedAt: chatHistory.updatedAt.toISOString(),
        messages: chatHistory.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      };

      await store.put(dataToStore);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  async getChatHistory(chatId: string): Promise<ChatHistory | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(chatId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Convert strings back to dates
            const chatHistory: ChatHistory = {
              ...result,
              title: result.title || 'Untitled Conversation',
              updatedAt: new Date(result.updatedAt),
              messages: result.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            };
            resolve(chatHistory);
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      return null;
    }
  }

  async getAllChatHistories(): Promise<ChatHistory[]> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const results = request.result.map((item: any) => ({
            ...item,
            title: item.title || 'Untitled Conversation',
            updatedAt: new Date(item.updatedAt),
            messages: item.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
          resolve(results);
        };
      });
    } catch (error) {
      console.error('Error getting all chat histories:', error);
      return [];
    }
  }

  async deleteChatHistory(chatId: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await store.delete(chatId);
    } catch (error) {
      console.error('Error deleting chat history:', error);
    }
  }

  async clearAllHistory(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await store.clear();
    } catch (error) {
      console.error('Error clearing all history:', error);
    }
  }
}

export const chatStorage = new ChatStorage();
