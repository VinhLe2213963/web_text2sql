import React from 'react';
import { Database, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DatabaseItem } from '@/types/chat';

interface DatabaseSearchProps {
  searchQuery: string;
  searchResults: DatabaseItem[];
  selectedDatabase: DatabaseItem | null;
  isSearching: boolean;
  showSuggestions: boolean;
  isLoading: boolean;
  searchRef: React.RefObject<HTMLInputElement | null>;
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onDatabaseSelect: (database: DatabaseItem) => void;
  onClearSelection: (e?: React.MouseEvent) => void;
}

export function DatabaseSearch({
  searchQuery,
  searchResults,
  selectedDatabase,
  isSearching,
  showSuggestions,
  isLoading,
  searchRef,
  suggestionsRef,
  onSearchChange,
  onSearchFocus,
  onDatabaseSelect,
  onClearSelection,
}: DatabaseSearchProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={searchRef}
          value={searchQuery}
          onChange={onSearchChange}
          onFocus={onSearchFocus}
          placeholder="Search DB..."
          className="w-32 pr-8 text-xs"
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
          {isSearching ? (
            <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
          ) : selectedDatabase ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelection} className="h-4 w-4 p-0 hover:bg-transparent">
              <X className="w-3 h-3" />
            </Button>
          ) : (
            <Database className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && searchResults.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bottom-full mb-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto"
        >
          {searchResults.map((db) => (
            <div key={db.id} onClick={() => onDatabaseSelect(db)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium">{db.name}</span>
                <span className="text-xs text-gray-500">{db.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
