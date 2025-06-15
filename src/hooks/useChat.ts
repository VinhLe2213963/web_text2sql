import { useState, useEffect, useRef } from 'react';
import { chatStorage } from '@/lib/chat-storage';
import { chatAPI } from '@/apis/chat';
import type { Message, ChatHistory, DatabaseItem } from '@/types/chat';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentChat) {
      saveChatHistory();
    }
  }, [messages, currentChat, selectedDatabase]);

  const saveChatHistory = async () => {
    const existingChat = chatHistories.find((chat) => chat.id === currentChat?.id);
    const titleToUse = existingChat?.title || 'AI Assistant';

    const chatHistoryToSave: ChatHistory = {
      id: currentChat?.id || Date.now().toString(),
      title: titleToUse,
      messages,
      selectedDatabase,
      updatedAt: new Date(),
    };

    await chatStorage.saveChatHistory(chatHistoryToSave);
    setChatHistories((prev) => {
      const updated = prev.filter((chat) => chat.id !== chatHistoryToSave.id);
      return [chatHistoryToSave, ...updated].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    });
  };

  const createNewChat = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: 'AI Assistant',
      messages: [],
      selectedDatabase: null,
      updatedAt: new Date(),
    };
    setCurrentChat(newChat);
    setMessages([]);
    setInput('');
    setAttachments([]);
    setSelectedDatabase(null);
  };

  const loadChat = async (selectedChatId: string) => {
    if (selectedChatId === currentChat?.id) return;

    if (currentChat) {
      await saveChatHistory();
    }

    const chatHistory = await chatStorage.getChatHistory(selectedChatId);
    if (chatHistory) {
      setCurrentChat(chatHistory);
      setMessages(chatHistory.messages);
      setInput('');
      setAttachments([]);
      setSelectedDatabase(chatHistory.selectedDatabase || null);

      setChatHistories((prev) => {
        const updated = prev.filter((chat) => chat.id !== selectedChatId);
        return [chatHistory, ...updated].sort((a, b) => {
          if (a.id === selectedChatId) return -1;
          if (b.id === selectedChatId) return 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      });
    }
  };

  const deleteChat = async (chatIdToDelete: string) => {
    await chatStorage.deleteChatHistory(chatIdToDelete);
    setChatHistories((prev) => prev.filter((chat) => chat.id !== chatIdToDelete));

    if (chatIdToDelete === currentChat?.id) {
      createNewChat();
    }
  };

  const sendMessage = async (options?: { maxContext?: number; maxLength?: number }) => {
    if (!input.trim() && attachments.length === 0) return;

    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: attachments.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      })),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachments([]);

    const defaultOptions = {
      maxContext: options?.maxContext || 0,
      maxLength: options?.maxLength || 50000,
    };

    try {
      const context = newMessages.slice(-10);
      const response = await chatAPI.sendMessage(
        {
          message: input,
          attachments,
          context,
          dbId: selectedDatabase?.id,
        },
        defaultOptions,
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeChat = async () => {
    const histories = await chatStorage.getAllChatHistories();
    setChatHistories(histories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));

    if (histories.length > 0) {
      const mostRecent = histories[0];
      setCurrentChat(mostRecent);
      setMessages(mostRecent.messages);
      setSelectedDatabase(mostRecent.selectedDatabase || null);
    } else {
      createNewChat();
    }
  };

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    attachments,
    setAttachments,
    currentChat,
    setCurrentChat,
    chatHistories,
    setChatHistories,
    selectedDatabase,
    setSelectedDatabase,
    messagesEndRef,

    // Actions
    createNewChat,
    loadChat,
    deleteChat,
    sendMessage,
    initializeChat,
  };
}
