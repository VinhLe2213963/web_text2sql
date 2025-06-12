'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send, ImageIcon, FileText, X, Plus, MessageSquare, Trash2, Menu, Search } from 'lucide-react';
import { chatAPI } from '@/apis/chat';
import { chatStorage } from '@/lib/chat-storage';
import type { Message, ChatHistory } from '@/types/chat';

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      // Load all chat histories
      const histories = await chatStorage.getAllChatHistories();
      setChatHistories(histories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));

      // Create new chat or load the most recent one
      if (histories.length > 0) {
        const mostRecent = histories[0];
        setChatId(mostRecent.id);
        setMessages(mostRecent.messages);
      } else {
        createNewChat();
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Save chat history whenever messages change
    if (chatId && messages.length > 0) {
      const chatHistory: ChatHistory = {
        id: chatId,
        title: getConversationTitle(messages),
        messages,
        updatedAt: new Date(),
      };
      chatStorage.saveChatHistory(chatHistory);

      // Update local chat histories
      setChatHistories((prev) => {
        const updated = prev.filter((chat) => chat.id !== chatId);
        return [chatHistory, ...updated].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      });
    }
  }, [messages, chatId]);

  const getConversationTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    }
    return 'New Conversation';
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setChatId(newChatId);
    setMessages([]);
    setInput('');
    setAttachments([]);
  };

  const loadChat = async (selectedChatId: string) => {
    if (selectedChatId === chatId) return;

    const chatHistory = await chatStorage.getChatHistory(selectedChatId);
    if (chatHistory) {
      setChatId(selectedChatId);
      setMessages(chatHistory.messages);
      setInput('');
      setAttachments([]);
    }
  };

  const deleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();

    await chatStorage.deleteChatHistory(chatIdToDelete);
    setChatHistories((prev) => prev.filter((chat) => chat.id !== chatIdToDelete));

    // If we deleted the current chat, create a new one
    if (chatIdToDelete === chatId) {
      createNewChat();
    }
  };

  const filteredChatHistories = chatHistories.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() && attachments.length === 0) return;

    setIsLoading(true);

    // Create user message
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

    // Clear input and attachments
    setInput('');
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Get context (last 10 messages)
      const context = newMessages.slice(-10);

      // Send to API
      const response = await chatAPI.sendMessage({
        message: input,
        attachments,
        context,
      });

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="px-4 flex flex-col justify-center h-16 border-b border-gray-200">
          <Button onClick={createNewChat} className="w-full justify-start gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredChatHistories.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChatHistories.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                      chat.id === chatId ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="text-sm font-medium text-gray-900 truncate">{chat.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500">
                        {chat.updatedAt.toLocaleDateString()} • {chat.messages.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 flex flex-col justify-center border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-800">{messages.length > 0 ? getConversationTitle(messages) : 'AI Assistant'}</h1>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-medium mb-2">Start a conversation</h2>
                <p>Ask me anything or upload files to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {/* Message content */}
                      <div className="whitespace-pre-wrap">{message.content}</div>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              {attachment.type.startsWith('image/') ? (
                                <img
                                  src={attachment.url || '/placeholder.svg'}
                                  alt={attachment.name}
                                  className="max-w-xs max-h-48 rounded object-cover"
                                />
                              ) : (
                                <div className="flex items-center space-x-2 p-2 bg-white/20 rounded">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm">{attachment.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                    {getFileIcon(file)}
                    <span className="text-sm text-gray-600 max-w-32 truncate">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)} className="h-4 w-4 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
              <div className="flex-1">
                <div className="flex items-end space-x-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="mb-1">
                    <Paperclip className="w-4 h-4" />
                  </Button>

                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                  />

                  <Button type="submit" disabled={isLoading || (!input.trim() && attachments.length === 0)}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <input ref={fileInputRef} type="file" multiple accept="image/*,text/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
