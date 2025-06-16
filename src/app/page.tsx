'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, ImageIcon, FileText, X, Menu, Database } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { DatabaseSearch } from '@/components/chat/DatabaseSearch';
import { useChat } from '@/hooks/useChat';
import { useDatabaseSearch } from '@/hooks/useDatabaseSearch';
import { chatStorage } from '@/lib/chat-storage';
import type { Message } from '@/types/chat';

export default function ChatBox() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
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
    createNewChat,
    loadChat,
    deleteChat,
    sendMessage,
    initializeChat,
  } = useChat();

  const { dbId, handleDbIdChange, clearDbId, setDbId } = useDatabaseSearch();

  // Update selected database based on dbId
  useEffect(() => {
    if (dbId.trim()) {
      setSelectedDatabase({ id: dbId, name: dbId, description: '' });
    } else {
      setSelectedDatabase(null);
    }
  }, [dbId, setSelectedDatabase]);

  // Auto-fill dbId when chat is loaded
  useEffect(() => {
    if (currentChat && currentChat.selectedDatabase) {
      setDbId(currentChat.selectedDatabase.id);
    }
  }, [currentChat, setDbId]);

  useEffect(() => {
    initializeChat();
  }, []);

  const handleUpdateTitle = async (chatId: string, title: string) => {
    const chatHistory = await chatStorage.getChatHistory(chatId);
    if (chatHistory) {
      const titleToUse = title.length > 25 ? title.slice(0, 25) + '...' : title;
      const updatedHistory = {
        ...chatHistory,
        title: titleToUse,
        updatedAt: new Date(),
      };
      await chatStorage.saveChatHistory(updatedHistory);
      setChatHistories((prev) => prev.map((chat) => (chat.id === chatId ? updatedHistory : chat)));
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedHistory);
      }
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
    if (!dbId.trim()) {
      setValidationMessage('Database ID is required to send messages');
      setTimeout(() => setValidationMessage(''), 3000);
      return;
    }
    setValidationMessage('');

    try {
      await sendMessage();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Validation Toast Notification */}
      {validationMessage && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 fade-in-0 duration-300">
          {/* <X className="w-4 h-4" /> */}
          <span className="text-sm">{validationMessage}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValidationMessage('')}
            className="h-6 w-6 p-0 hover:bg-amber-600 text-white"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-16 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 fade-in-0 duration-300">
          <X className="w-4 h-4" />
          <span className="text-sm">{errorMessage}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setErrorMessage('')} className="h-6 w-6 p-0 hover:bg-red-600 text-white">
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <ChatSidebar
        isOpen={sidebarOpen}
        chatHistories={filteredChatHistories}
        currentChatId={currentChat?.id || ''}
        onNewChat={createNewChat}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
        onUpdateTitle={handleUpdateTitle}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 flex flex-col justify-center border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-800">{currentChat?.title || 'AI Assistant'}</h1>
            </div>
            {dbId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="w-4 h-4" />
                <span>Using: {dbId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-medium mb-2">Start a conversation</h2>
                <p>Ask me anything or upload files to get started!</p>
                {dbId && (
                  <p className="mt-2 text-sm">
                    Using: <span className="font-medium">{dbId}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="h-[calc(100vh-178px)] overflow-y-scroll no-scrollbar">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isLoading && <LoadingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

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

            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
              <div className="flex-1">
                <div className="flex items-end space-x-2">
                  <DatabaseSearch dbId={dbId} isLoading={isLoading} onDbIdChange={handleDbIdChange} onClearDbId={clearDbId} />

                  <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
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

// Helper components
function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        {message.role === 'assistant' ? (
          <pre className="whitespace-pre overflow-x-auto max-w-full text-sm no-scrollbar">{message.content}</pre>
        ) : (
          <pre className="whitespace-pre-wrap overflow-x-auto max-w-full text-sm no-scrollbar">{message.content}</pre>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center space-x-2">
                {attachment.type.startsWith('image/') ? (
                  <img src={attachment.url || '/placeholder.svg'} alt={attachment.name} className="max-w-xs max-h-48 rounded object-cover" />
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
        <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>{message.timestamp.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
