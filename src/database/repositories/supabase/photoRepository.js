import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

const BUCKET = 'progress-photos';

/** @param {Record<string, unknown>} row @param {Blob} blob */
function toEntry(row, blob) {
  return {
    id: row.id,
    date: row.date,
    blob,
    caption: row.caption ?? undefined,
  };
}

/** Download blob from storage path. */
async function downloadBlob(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  throwIfError(error, 'Failed to download photo');
  return data;
}

/** @returns {Promise<import('../../../types/index.js').PhotoEntry[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('photo_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  throwIfError(error, 'Failed to load photos');

  const entries = await Promise.all(
    (data ?? []).map(async (row) => {
      const blob = await downloadBlob(row.storage_path);
      return toEntry(row, blob);
    })
  );
  return entries;
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('photo_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load photo');
  if (!data) return null;
  const blob = await downloadBlob(data.storage_path);
  return toEntry(data, blob);
}

/** @param {Omit<import('../../../types/index.js').PhotoEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const ext = item.blob.type?.split('/')[1] || 'jpg';
  const storagePath = `${userId}/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, item.blob, { upsert: true, contentType: item.blob.type || 'image/jpeg' });
  throwIfError(uploadError, 'Failed to upload photo');

  const { error } = await supabase.from('photo_entries').insert({
    id,
    user_id: userId,
    date: item.date,
    storage_path: storagePath,
    caption: item.caption ?? null,
  });
  throwIfError(error, 'Failed to save photo metadata');
  return id;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').PhotoEntry>} updates */
async function update(id, updates) {
  const existing = await supabase.from('photo_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(existing.error, 'Failed to load photo');

  if (updates.blob && existing.data) {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(existing.data.storage_path, updates.blob, { upsert: true });
    throwIfError(uploadError, 'Failed to update photo file');
  }

  if (updates.caption !== undefined || updates.date !== undefined) {
    const { error } = await supabase.from('photo_entries').update({
      ...(updates.caption !== undefined && { caption: updates.caption ?? null }),
      ...(updates.date !== undefined && { date: updates.date }),
    }).eq('id', id);
    throwIfError(error, 'Failed to update photo');
  }
}

/** @param {string} id */
async function remove(id) {
  const { data, error: fetchError } = await supabase
    .from('photo_entries')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  throwIfError(fetchError, 'Failed to load photo');

  if (data?.storage_path) {
    await supabase.storage.from(BUCKET).remove([data.storage_path]);
  }

  const { error } = await supabase.from('photo_entries').delete().eq('id', id);
  throwIfError(error, 'Failed to delete photo');
}

export const photoRepository = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
