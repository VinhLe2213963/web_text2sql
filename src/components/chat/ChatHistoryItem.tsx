import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Edit2, Check, Trash2, Database } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatHistory } from '@/types/chat';

interface ChatHistoryItemProps {
  chat: ChatHistory;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
}

export function ChatHistoryItem({ chat, isActive, onLoad, onDelete, onUpdateTitle }: ChatHistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(chat.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingTitle(chat.title);
  };

  const saveTitle = () => {
    if (editingTitle.trim()) {
      onUpdateTitle(editingTitle.trim());
    }
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTitle(chat.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={() => !isEditing && onLoad()}
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-50 border border-blue-200' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {isEditing ? (
            <Input
              ref={titleInputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveTitle}
              className="text-sm font-medium h-6 px-1 py-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="text-sm font-medium text-gray-900 truncate">{chat.title}</h3>
          )}
        </div>
        <div className="flex items-center gap-12">
          <p className="text-xs text-gray-500">{chat.updatedAt.toLocaleDateString()}</p>
          {chat.selectedDatabase && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Database className="w-3 h-3" />
              <span className="truncate max-w-20">{chat.selectedDatabase.name}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              saveTitle();
            }}
            className="opacity-100 p-1 h-auto"
          >
            <Check className="w-4 h-4 text-green-500" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={startEditing} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto">
            <Edit2 className="w-4 h-4 text-gray-500" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
