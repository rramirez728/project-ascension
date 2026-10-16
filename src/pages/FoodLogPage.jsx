import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { DateNavigator } from '../components/ui/DateNavigator.jsx';
import { FoodLogTracker } from '../components/features/food/FoodLogTracker.jsx';
import { useFoodLog } from '../hooks/useFoodLog.js';
import { useSavedFoods } from '../hooks/useSavedFoods.js';
import { useSettings } from '../hooks/useSettings.js';
import { todayISO } from '../utils/dates.js';

export default function FoodLogPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') || todayISO();
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useFoodLog(date);
  const { savedFoods, loading: savedFoodsLoading, saveFood, deleteSavedFood } = useSavedFoods();
  const { settings } = useSettings();

  return (
    <div>
      <PageHeader
        title="Food Diary"
        subtitle="Search USDA foods, scan barcodes, and track macros"
        action={<DateNavigator date={date} onChange={(next) => setParams({ date: next })} />}
      />
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
