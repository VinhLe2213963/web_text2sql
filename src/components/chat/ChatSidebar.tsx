import React from 'react';
import { Plus, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChatHistoryItem } from '@/components/chat/ChatHistoryItem';
import type { ChatHistory } from '@/types/chat';

interface ChatSidebarProps {
  isOpen: boolean;
  chatHistories: ChatHistory[];
  currentChatId: string;
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateTitle: (chatId: string, title: string) => void;
}

export function ChatSidebar({ isOpen, chatHistories, currentChatId, onNewChat, onLoadChat, onDeleteChat, onUpdateTitle }: ChatSidebarProps) {
  return (
    <div className={`${isOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex flex-col`}>
      <div className="px-4 flex flex-col justify-center h-16 border-b border-gray-200">
        <Button onClick={onNewChat} className="w-full justify-start gap-2" variant="outline">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-2">
          {chatHistories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chatHistories.map((chat) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onLoad={() => onLoadChat(chat.id)}
                  onDelete={() => onDeleteChat(chat.id)}
                  onUpdateTitle={(title) => onUpdateTitle(chat.id, title)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
