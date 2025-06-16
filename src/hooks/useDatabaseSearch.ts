import { useState } from 'react';

export function useDatabaseSearch() {
  const [dbId, setDbId] = useState('');

  const handleDbIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDbId(e.target.value);
  };

  const clearDbId = () => {
    setDbId('');
  };

  return {
    dbId,
    handleDbIdChange,
    clearDbId,
  };
}
