import { PageHeader } from '../components/layout/PageHeader.jsx';
import { SettingsForm } from '../components/features/settings/SettingsForm.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure goals, macros, and preferences" />
      {loading ? (
        <div className="space-y-4 max-w-2xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <SettingsForm settings={settings} onSave={updateSettings} />
      )}
    </div>
  );
}
