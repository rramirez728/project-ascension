import { PageHeader } from '../components/layout/PageHeader.jsx';
import { FoodLogTracker } from '../components/features/food/FoodLogTracker.jsx';
import { useFoodLog } from '../hooks/useFoodLog.js';
import { useSavedFoods } from '../hooks/useSavedFoods.js';
import { useSettings } from '../hooks/useSettings.js';

export default function FoodLogPage() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useFoodLog();
  const { savedFoods, loading: savedFoodsLoading, saveFood, deleteSavedFood } = useSavedFoods();
  const { settings } = useSettings();

  return (
    <div>
      <PageHeader title="Food Log" subtitle="Search USDA foods, scan barcodes, and track macros" />
      <FoodLogTracker
        entries={entries}
        settings={settings}
        loading={loading}
        savedFoods={savedFoods}
        savedFoodsLoading={savedFoodsLoading}
        onAdd={addEntry}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
        onSaveFood={saveFood}
        onDeleteSavedFood={deleteSavedFood}
      />
    </div>
  );
}
