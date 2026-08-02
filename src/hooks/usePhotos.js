import { useState, useEffect, useCallback } from 'react';
import { photoRepository } from '../database/index.js';

/** Hook for progress photo CRUD. */
export function usePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await photoRepository.getAll();
    setPhotos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPhoto = async (photo) => {
    await photoRepository.create(photo);
    await refresh();
  };

  const deletePhoto = async (id) => {
    await photoRepository.delete(id);
    await refresh();
  };

  return { photos, loading, addPhoto, deletePhoto, refresh };
}
