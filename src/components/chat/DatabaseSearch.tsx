import React from 'react';
import { Database, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DatabaseSearchProps {
  dbId: string;
  isLoading: boolean;
  onDbIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearDbId: () => void;
}

export function DatabaseSearch({ dbId, isLoading, onDbIdChange, onClearDbId }: DatabaseSearchProps) {
  return (
    <div className="relative">
      <Input value={dbId} onChange={onDbIdChange} placeholder="Database ID" className="w-32 pr-8 text-xs" disabled={isLoading} />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
        {dbId ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearDbId} className="h-4 w-4 p-0 hover:bg-transparent">
            <X className="w-3 h-3" />
          </Button>
        ) : (
          <Database className="w-3 h-3 text-gray-400" />
        )}
      </div>
    </div>
  );
}
