import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useCreatorId = () => {
  const [creatorId, setCreatorId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('creator_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('creator_id', id);
    }
    setCreatorId(id);
  }, []);

  return creatorId;
};
