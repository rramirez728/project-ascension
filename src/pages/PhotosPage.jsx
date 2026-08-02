import { PageHeader } from '../components/layout/PageHeader.jsx';
import { PhotosTracker } from '../components/features/photos/PhotosTracker.jsx';
import { usePhotos } from '../hooks/usePhotos.js';

export default function PhotosPage() {
  const { photos, loading, addPhoto, deletePhoto } = usePhotos();

  return (
    <div>
      <PageHeader title="Progress Photos" subtitle="Visual progress over time" />
      <PhotosTracker
        photos={photos}
        loading={loading}
        onAdd={addPhoto}
        onDelete={deletePhoto}
      />
    </div>
  );
}
