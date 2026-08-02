import { Star, X } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';

/** Quick-add bar for saved favorite foods. */
export function SavedFoodsQuickAdd({ savedFoods, onAdd, onDelete, loading }) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 w-36 shrink-0 rounded-xl bg-border/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!savedFoods.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Star size={14} className="text-warning fill-warning" />
        <h3 className="text-sm font-medium text-muted">My Saved Foods</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {savedFoods.map((food) => (
          <div
            key={food.id}
            className="relative shrink-0 w-44 rounded-xl border border-border bg-background/50 p-3 hover:border-accent/40 transition-colors group"
          >
            <button
              type="button"
              onClick={() => onAdd(food)}
              className="w-full text-left"
            >
              <p className="text-sm font-medium line-clamp-2 pr-4">{food.name}</p>
              <p className="text-xs text-muted mt-1">
                {food.calories} cal · {food.protein}p · {food.carbs}c · {food.fat}f
              </p>
            </button>
            <button
              type="button"
              onClick={() => onDelete(food.id)}
              className="absolute top-2 right-2 p-0.5 rounded-md text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
              aria-label={`Remove ${food.name}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact saved foods row inside the add-food modal. */
export function SavedFoodsModalRow({ savedFoods, onPick }) {
  if (!savedFoods.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">Quick add saved</p>
      <div className="flex flex-wrap gap-2">
        {savedFoods.map((food) => (
          <Button
            key={food.id}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPick(food)}
          >
            {food.name.length > 24 ? `${food.name.slice(0, 24)}…` : food.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
