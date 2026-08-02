import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { sumMacros, calculateRemaining } from '../../../services/calculations/macroCalculations.js';
import { FoodEntryForm } from './FoodEntryForm.jsx';
import { SavedFoodsQuickAdd } from './SavedFoodsQuickAdd.jsx';
import { FoodPhotoCaptureButton } from './FoodPhotoCapture.jsx';

const MEALS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

/** Macro summary bar showing consumed vs remaining. */
export function MacroSummaryBar({ entries, settings }) {
  const consumed = sumMacros(entries);
  const remaining = calculateRemaining(consumed, settings);

  const items = [
    { label: 'Calories', consumed: consumed.calories, goal: settings.dailyCalories, remaining: remaining.calories, unit: '' },
    { label: 'Protein', consumed: consumed.protein, goal: settings.proteinGoal, remaining: remaining.protein, unit: 'g' },
    { label: 'Carbs', consumed: consumed.carbs, goal: settings.carbGoal, remaining: remaining.carbs, unit: 'g' },
    { label: 'Fat', consumed: consumed.fat, goal: settings.fatGoal, remaining: remaining.fat, unit: 'g' },
  ];

  return (
    <Card>
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Daily Macros</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ label, consumed: c, goal, remaining: r, unit }) => {
          const pct = goal > 0 ? Math.min(100, (c / goal) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">{label}</span>
                <span className="font-medium">{r}{unit} left</span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">{c}{unit} / {goal}{unit}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Food log with USDA search, saved foods, and meal tabs. */
export function FoodLogTracker({
  entries,
  settings,
  loading,
  savedFoods,
  savedFoodsLoading,
  onAdd,
  onUpdate,
  onDelete,
  onSaveFood,
  onDeleteSavedFood,
}) {
  const [activeMeal, setActiveMeal] = useState('breakfast');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mealPhoto, setMealPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const mealEntries = entries.filter((e) => e.mealType === activeMeal);
  const apiKey = settings?.usdaApiKey ?? '';

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setMealPhoto(null);
  };

  const openAddModal = () => {
    setEditing(null);
    setMealPhoto(null);
    setModalOpen(true);
  };

  const handlePhotoCapture = (file) => {
    setEditing(null);
    setMealPhoto(file);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editing) await onUpdate(editing.id, data);
    else await onAdd(data);
    closeModal();
  };

  const handleQuickAddSaved = async (food) => {
    await onAdd({
      mealType: activeMeal,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fdcId: food.fdcId,
    });
  };

  if (loading || !settings) {
    return <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <MacroSummaryBar entries={entries} settings={settings} />

      <SavedFoodsQuickAdd
        savedFoods={savedFoods}
        loading={savedFoodsLoading}
        onAdd={handleQuickAddSaved}
        onDelete={onDeleteSavedFood}
      />

      <div className="flex flex-wrap gap-2">
        {MEALS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveMeal(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeMeal === value ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <FoodPhotoCaptureButton inputRef={photoInputRef} onCapture={handlePhotoCapture} />
        <Button onClick={openAddModal}>
          <Plus size={16} /> Add Food
        </Button>
      </div>

      {mealEntries.length === 0 ? (
        <EmptyState
          title={`No ${activeMeal} entries`}
          description="Tap Photo Log to snap a meal, search USDA, or pick from your saved foods."
          actionLabel="Add food"
          onAction={openAddModal}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-border">
            {mealEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-sm text-muted">
                    {entry.calories} cal · P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(entry); setModalOpen(true); }}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)}>
                    <Trash2 size={16} className="text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Food' : mealPhoto ? 'Log Meal from Photo' : 'Add Food'}
        size="lg"
      >
        <FoodEntryForm
          initial={editing}
          defaultMeal={activeMeal}
          apiKey={apiKey}
          savedFoods={savedFoods}
          mealPhoto={mealPhoto}
          onPhotoCapture={setMealPhoto}
          onRemovePhoto={() => setMealPhoto(null)}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          onSaveFood={onSaveFood}
        />
      </Modal>
    </div>
  );
}
