import { useEffect, useState } from 'react';
import { Camera, Sparkles, X } from 'lucide-react';
import { blobToUrl, revokeBlobUrl } from '../../../utils/image.js';
import { Button } from '../../ui/Button.jsx';

/** Preview of a captured meal photo with AI placeholder messaging. */
export function MealPhotoPreview({ photo, onRetake, onRemove }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!photo) {
      setUrl(null);
      return;
    }
    const objectUrl = blobToUrl(photo);
    setUrl(objectUrl);
    return () => revokeBlobUrl(objectUrl);
  }, [photo]);

  if (!photo || !url) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background/50">
      <div className="relative">
        <img
          src={url}
          alt="Meal photo"
          className="w-full max-h-48 object-cover"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
          aria-label="Remove photo"
        >
          <X size={16} />
        </button>
      </div>
      <div className="px-4 py-3 space-y-2 border-t border-border">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-muted">
            Photo captured. AI meal analysis is coming soon — search USDA or enter macros below for now.
          </p>
        </div>
        {onRetake && (
          <Button type="button" variant="ghost" size="sm" onClick={onRetake}>
            <Camera size={14} /> Retake photo
          </Button>
        )}
      </div>
    </div>
  );
}
