import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '@/apis/chat';
import type { DatabaseItem } from '@/types/chat';

export function useDatabaseSearch() {
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbSearchResults, setDbSearchResults] = useState<DatabaseItem[]>([]);
  const [isDbSearching, setIsDbSearching] = useState(false);
  const [showDbSuggestions, setShowDbSuggestions] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseItem | null>(null);

  const isProgrammaticChange = useRef(false);
  const dbSearchRef = useRef<HTMLInputElement>(null);
  const dbSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dbSuggestionsRef.current &&
        !dbSuggestionsRef.current.contains(event.target as Node) &&
        dbSearchRef.current &&
        !dbSearchRef.current.contains(event.target as Node)
      ) {
        setShowDbSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isProgrammaticChange.current) {
      isProgrammaticChange.current = false;
      return;
    }

    const searchDatabases = async () => {
      if (dbSearchQuery.trim().length < 1) {
        setDbSearchResults([]);
        setShowDbSuggestions(false);
        return;
      }

      setIsDbSearching(true);
      try {
        const results = await chatAPI.searchDatabases(dbSearchQuery);
        setDbSearchResults(results);
        setShowDbSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error searching databases:', error);
        setDbSearchResults([]);
        setShowDbSuggestions(false);
      } finally {
        setIsDbSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchDatabases, 300);
    return () => clearTimeout(debounceTimer);
  }, [dbSearchQuery]);

  const handleDatabaseSelect = (database: DatabaseItem) => {
    isProgrammaticChange.current = true;
    setSelectedDatabase(database);
    setDbSearchQuery(database.name);
    setShowDbSuggestions(false);
    setDbSearchResults([]);
  };

  const clearDatabaseSelection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    isProgrammaticChange.current = true;
    setSelectedDatabase(null);
    setDbSearchQuery('');
    setDbSearchResults([]);
    setShowDbSuggestions(false);
  };

  const handleDbSearchFocus = () => {
    if (dbSearchResults.length > 0) {
      setShowDbSuggestions(true);
    }
  };

  const handleDbSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isProgrammaticChange.current = false;
    setDbSearchQuery(e.target.value);
  };

  const setDatabaseProgrammatically = (database: DatabaseItem | null) => {
    isProgrammaticChange.current = true;
    setSelectedDatabase(database);
    setDbSearchQuery(database?.name || '');
  };

  return {
    // State
    dbSearchQuery,
    dbSearchResults,
    isDbSearching,
    showDbSuggestions,
    selectedDatabase,
    dbSearchRef,
    dbSuggestionsRef,

    // Actions
    handleDatabaseSelect,
    clearDatabaseSelection,
    handleDbSearchFocus,
    handleDbSearchChange,
    setDatabaseProgrammatically,
  };
}
