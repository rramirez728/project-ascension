import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Info } from 'lucide-react';
import { useFoodSearch } from '../../../hooks/useFoodSearch.js';
import { resolveFoodSelection, getRestaurantSearchTips } from '../../../services/usda/usdaFoodService.js';

/** Autocomplete food name input powered by USDA Food Data Central. */
export function FoodSearchInput({
  value,
  onChange,
  onSelect,
  apiKey,
  disabled = false,
  placeholder = 'Search foods (e.g. grilled chicken sandwich, big mac…)',
}) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectError, setSelectError] = useState('');
  const skipSearchRef = useRef(false);
  const containerRef = useRef(null);
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    usedSimilarFallback,
    restaurantBrand,
    minLength,
  } = useFoodSearch(apiKey);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (value !== query) setQuery(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < minLength;
  const noResults = !loading && !error && trimmed.length >= minLength && results.length === 0;
  const tips = noResults ? getRestaurantSearchTips(trimmed) : [];
  const showRestaurantNotice = restaurantBrand && results.length > 0;

  const handleInputChange = (e) => {
    const next = e.target.value;
    onChange(next);
    setQuery(next);
    setSelectError('');
    setOpen(true);
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handlePick = async (food) => {
    setSelecting(true);
    setSelectError('');
    setOpen(false);
    try {
      const resolved = await resolveFoodSelection({ ...food, needsDetail: true }, apiKey);
      skipSearchRef.current = true;
      onSelect(resolved);
      onChange(resolved.name);
      setQuery(resolved.name);
    } catch (err) {
      setSelectError(err.message || 'Could not load food details.');
      setOpen(true);
    } finally {
      setSelecting(false);
    }
  };

  const displayError = selectError || error;
  const showDropdown = open && (tooShort || loading || displayError || results.length > 0 || noResults);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium text-muted block mb-1.5">Food name</label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled || selecting}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        {(loading || selecting) && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-border bg-surface shadow-card">
          {tooShort && (
            <p className="px-4 py-3 text-sm text-muted">
              Type at least {minLength} characters to search…
            </p>
          )}

          {showRestaurantNotice && (
            <div className="px-4 py-3 bg-accent/10 border-b border-border/50 flex gap-2 items-start">
              <Info size={14} className="text-accent shrink-0 mt-0.5" />
              <div className="text-xs text-muted space-y-1">
                <p className="font-medium text-foreground">
                  {restaurantBrand} menu items aren&apos;t in USDA
                </p>
                <p>
                  USDA only has packaged grocery foods — not restaurant counter orders.
                  Pick the closest match below, or enter exact macros from{' '}
                  <span className="text-foreground">{restaurantBrand}&apos;s nutrition page</span> and
                  Save to My Foods.
                </p>
              </div>
            </div>
          )}

          {displayError && (
            <p className="px-4 py-3 text-sm text-danger">{displayError}</p>
          )}

          {!displayError && !tooShort && loading && (
            <p className="px-4 py-3 text-sm text-muted">Searching USDA database…</p>
          )}

          {noResults && (
            <div className="px-4 py-3 space-y-2">
              <p className="text-sm font-medium">No results for &ldquo;{trimmed}&rdquo;</p>
              <ul className="text-xs text-muted space-y-1 list-disc pl-4">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {!tooShort && results.map((food) => (
            <button
              key={food.fdcId}
              type="button"
              onClick={() => handlePick(food)}
              className="w-full text-left px-4 py-3 hover:bg-border/30 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-start gap-2">
                <p className="text-sm font-medium line-clamp-2 flex-1">{food.label}</p>
                {food.isBestMatch && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                    Best match
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{food.subtitle}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
