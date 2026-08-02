import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { isImageFile } from '../../../utils/image.js';

/**
 * Opens the device camera on mobile (or file picker on desktop).
 * Uses capture="environment" for rear camera on phones.
 */
export function FoodPhotoCaptureButton({ onCapture, inputRef, variant = 'secondary', size = 'md', className = '' }) {
  const internalRef = useRef(null);
  const fileRef = inputRef || internalRef;

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !isImageFile(file)) return;
    onCapture(file);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden
        onChange={handleChange}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => fileRef.current?.click()}
      >
        <Camera size={16} />
        Photo Log
      </Button>
    </>
  );
}
