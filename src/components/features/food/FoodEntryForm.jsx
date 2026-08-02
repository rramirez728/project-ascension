import { useRef, useState } from 'react';
import { Barcode, BookmarkPlus, Loader2 } from 'lucide-react';
import { isImageFile } from '../../../utils/image.js';
import { Button } from '../../ui/Button.jsx';
import { Input, Select } from '../../ui/Input.jsx';
import { FoodSearchInput } from './FoodSearchInput.jsx';
import { SavedFoodsModalRow } from './SavedFoodsQuickAdd.jsx';
import { MealPhotoPreview } from './MealPhotoPreview.jsx';
import { lookupByBarcode } from '../../../services/usda/usdaFoodService.js';

const MEALS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

/** Add / edit food form with USDA search, barcode lookup, and save-to-favorites. */
export function FoodEntryForm({
  initial,
  defaultMeal,
  apiKey,
  savedFoods,
  onSubmit,
  onCancel,
  onSaveFood,
  mealPhoto,
  onPhotoCapture,
  onRemovePhoto,
}) {
  const retakeInputRef = useRef(null);
  const [mealType, setMealType] = useState(initial?.mealType ?? defaultMeal);
  const [name, setName] = useState(initial?.name ?? '');
  const [calories, setCalories] = useState(initial?.calories?.toString() ?? '');
  const [protein, setProtein] = useState(initial?.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(initial?.carbs?.toString() ?? '');
  const [fat, setFat] = useState(initial?.fat?.toString() ?? '');
  const [servingDescription, setServingDescription] = useState('');
  const [macroSource, setMacroSource] = useState('');
  const [fdcId, setFdcId] = useState(initial?.fdcId ?? null);
  const [barcode, setBarcode] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const isEditing = Boolean(initial?.id);

  const applyFoodData = (food) => {
    setName(food.name);
    setCalories(String(food.calories ?? 0));
    setProtein(String(food.protein ?? 0));
    setCarbs(String(food.carbs ?? 0));
    setFat(String(food.fat ?? 0));
    setServingDescription(food.servingDescription ?? '');
    setMacroSource(food.source ?? '');
    setFdcId(food.fdcId ?? null);
    setBarcodeError('');
  };

  const handleBarcodeLookup = async () => {
    setBarcodeLoading(true);
    setBarcodeError('');
    try {
      const food = await lookupByBarcode(barcode, apiKey);
      if (!food) {
        setBarcodeError('No branded food found for this barcode.');
        return;
      }
      applyFoodData({
        name: food.label,
        fdcId: food.fdcId,
        ...food.macros,
      });
    } catch (err) {
      setBarcodeError(err.message || 'Barcode lookup failed.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleSaveFood = async () => {
    if (!name.trim()) return;
    await onSaveFood({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fdcId,
      servingDescription,
    });
    setSaveMessage('Saved to My Foods!');
    setTimeout(() => setSaveMessage(''), 2500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      mealType,
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fdcId,
    });
  };

  const handleRetakeChange = (e) => {
    const file = e.target.files?.[0];
    if (file && isImageFile(file)) onPhotoCapture?.(file);
    e.target.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        ref={retakeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden
        onChange={handleRetakeChange}
      />
      {mealPhoto && !isEditing && (
        <MealPhotoPreview
          photo={mealPhoto}
          onRetake={() => retakeInputRef.current?.click()}
          onRemove={onRemovePhoto}
        />
      )}

      <Select label="Meal" options={MEALS} value={mealType} onChange={(e) => setMealType(e.target.value)} />

      {!isEditing && (
        <SavedFoodsModalRow
          savedFoods={savedFoods}
          onPick={(food) =>
            applyFoodData({
              name: food.name,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              fdcId: food.fdcId,
              servingDescription: food.servingDescription,
            })
          }
        />
      )}

      {isEditing ? (
        <Input label="Food name" value={name} onChange={(e) => setName(e.target.value)} required />
      ) : (
        <FoodSearchInput
          value={name}
          onChange={setName}
          onSelect={applyFoodData}
          apiKey={apiKey}
        />
      )}

      <div>
        <label className="text-sm font-medium text-muted block mb-1.5">Barcode (optional)</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or enter UPC/EAN"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <Button type="button" variant="secondary" onClick={handleBarcodeLookup} disabled={barcodeLoading || !barcode.trim()}>
            {barcodeLoading ? <Loader2 size={16} className="animate-spin" /> : <Barcode size={16} />}
            Lookup
          </Button>
        </div>
        {barcodeError && <p className="text-xs text-danger mt-1">{barcodeError}</p>}
      </div>

      {servingDescription && (
        <p className="text-xs text-muted -mt-2">
          Per serving: {servingDescription}
          {macroSource === 'label' && ' · from nutrition label'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
        <Input label="Protein (g)" type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} />
        <Input label="Carbs (g)" type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        <Input label="Fat (g)" type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} />
      </div>

      {!isEditing && (
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={handleSaveFood} disabled={!name.trim()}>
            <BookmarkPlus size={16} /> Save to My Foods
          </Button>
          {saveMessage && <span className="text-sm text-success">{saveMessage}</span>}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Save' : 'Add to Log'}</Button>
      </div>
    </form>
  );
}
