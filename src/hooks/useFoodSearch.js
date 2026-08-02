import { useState, useEffect, useRef } from 'react';
import { searchFoods } from '../services/usda/usdaFoodService.js';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 450;

/** Debounced USDA food search with request cancellation. */
export function useFoodSearch(apiKey) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usedSimilarFallback, setUsedSimilarFallback] = useState(false);
  const [restaurantBrand, setRestaurantBrand] = useState(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      setError(null);
      setUsedSimilarFallback(false);
      setRestaurantBrand(null);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await searchFoods(trimmed, { apiKey, signal: controller.signal });
        if (!controller.signal.aborted) {
          setResults(data.foods);
          setUsedSimilarFallback(data.usedSimilarFallback);
          setRestaurantBrand(data.restaurantBrand);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(err.message || 'Search failed');
          setResults([]);
          setUsedSimilarFallback(false);
          setRestaurantBrand(null);
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, apiKey]);

  const clear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setUsedSimilarFallback(false);
    setRestaurantBrand(null);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    usedSimilarFallback,
    restaurantBrand,
    clear,
    minLength: MIN_QUERY_LENGTH,
  };
}
