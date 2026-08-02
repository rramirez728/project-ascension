import { useState, useEffect } from 'react';
import { Upload, Trash2, Columns2 } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { formatDate, todayISO } from '../../../utils/dates.js';
import { blobToUrl, revokeBlobUrl, isImageFile } from '../../../utils/image.js';

/** Single photo thumbnail. */
function PhotoThumb({ photo, selected, onSelect, onDelete }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const objectUrl = blobToUrl(photo.blob);
    setUrl(objectUrl);
    return () => revokeBlobUrl(objectUrl);
  }, [photo.blob]);

  return (
    <div
      className={`relative group rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
        selected ? 'border-accent' : 'border-transparent hover:border-border'
      }`}
      onClick={() => onSelect(photo)}
    >
      {url && (
        <img src={url} alt={photo.caption || 'Progress photo'} className="w-full aspect-[3/4] object-cover" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-xs text-white font-medium">{formatDate(photo.date)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete photo"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/** Side-by-side photo comparison. */
function PhotoComparison({ photoA, photoB, onClose }) {
  const [urlA, setUrlA] = useState(null);
  const [urlB, setUrlB] = useState(null);

  useEffect(() => {
    if (!photoA || !photoB) return;
    const a = blobToUrl(photoA.blob);
    const b = blobToUrl(photoB.blob);
    setUrlA(a);
    setUrlB(b);
    return () => {
      revokeBlobUrl(a);
      revokeBlobUrl(b);
    };
  }, [photoA, photoB]);

  if (!photoA || !photoB) return null;

  return (
    <Modal open onClose={onClose} title="Photo Comparison" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[photoA, photoB].map((photo, i) => (
          <div key={photo.id}>
            <p className="text-sm text-muted mb-2">{formatDate(photo.date)}</p>
            <img
              src={i === 0 ? urlA : urlB}
              alt={`Progress ${formatDate(photo.date)}`}
              className="w-full rounded-xl object-cover aspect-[3/4]"
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

/** Progress photo gallery with upload and comparison. */
export function PhotosTracker({ photos, loading, onAdd, onDelete }) {
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isImageFile(file)) return;
    await onAdd({ date: todayISO(), blob: file });
    e.target.value = '';
  };

  const handleSelect = (photo) => {
    if (!compareMode) return;
    setSelected((prev) => {
      if (prev.find((p) => p.id === photo.id)) {
        return prev.filter((p) => p.id !== photo.id);
      }
      if (prev.length >= 2) return [prev[1], photo];
      return [...prev, photo];
    });
  };

  if (loading) return <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          variant={compareMode ? 'primary' : 'secondary'}
          onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
        >
          <Columns2 size={16} />
          {compareMode ? 'Cancel Compare' : 'Compare Photos'}
        </Button>
        {compareMode && selected.length === 2 && (
          <Button onClick={() => setShowComparison(true)}>View Comparison</Button>
        )}
        <label>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer">
            <Upload size={16} /> Upload Photo
          </span>
        </label>
      </div>

      {compareMode && (
        <p className="text-sm text-muted">Select two photos to compare side by side.</p>
      )}

      {photos.length === 0 ? (
        <EmptyState
          title="No progress photos yet"
          description="Upload photos to track visual progress over time."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <PhotoThumb
              key={photo.id}
              photo={photo}
              selected={selected.some((p) => p.id === photo.id)}
              onSelect={handleSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {showComparison && selected.length === 2 && (
        <PhotoComparison
          photoA={selected[0]}
          photoB={selected[1]}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
