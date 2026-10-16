/** Shared exercise catalog. Custom exercises are stored per user. */
export const EXERCISE_CATALOG = [
  { name: 'Bench Press', muscleGroup: 'chest', aliases: ['barbell bench', 'flat bench'] },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', aliases: ['incline press'] },
  { name: 'Lat Pulldown', muscleGroup: 'back', aliases: ['lat pull down', 'pulldown'] },
  { name: 'Cable Row', muscleGroup: 'back', aliases: ['seated row', 'seated cable row'] },
  { name: 'Barbell Row', muscleGroup: 'back', aliases: ['bent over row'] },
  { name: 'Pull Up', muscleGroup: 'back', aliases: ['pullup', 'chin up'] },
  { name: 'Overhead Press', muscleGroup: 'shoulders', aliases: ['ohp', 'shoulder press', 'military press'] },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', aliases: ['side raise'] },
  { name: 'Squat', muscleGroup: 'legs', aliases: ['back squat', 'barbell squat'] },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', aliases: ['rdl'] },
  { name: 'Leg Press', muscleGroup: 'legs', aliases: [] },
  { name: 'Leg Curl', muscleGroup: 'legs', aliases: ['hamstring curl'] },
  { name: 'Leg Extension', muscleGroup: 'legs', aliases: [] },
  { name: 'Walking Lunge', muscleGroup: 'legs', aliases: ['lunges'] },
  { name: 'Calf Raise', muscleGroup: 'legs', aliases: [] },
  { name: 'Bicep Curl', muscleGroup: 'biceps', aliases: ['dumbbell curl', 'barbell curl'] },
  { name: 'Hammer Curl', muscleGroup: 'biceps', aliases: [] },
  { name: 'Tricep Pushdown', muscleGroup: 'triceps', aliases: ['cable pushdown'] },
  { name: 'Skull Crusher', muscleGroup: 'triceps', aliases: ['lying tricep extension'] },
  { name: 'Plank', muscleGroup: 'abs', aliases: [] },
  { name: 'Hanging Leg Raise', muscleGroup: 'abs', aliases: [] },
];

/** Resolve a spoken or typed exercise name to the catalog entry. */
export function resolveExerciseName(input, catalog = EXERCISE_CATALOG) {
  const query = String(input || '').trim().toLowerCase();
  if (!query) return null;
  const exact = catalog.find((item) => item.name.toLowerCase() === query);
  if (exact) return exact;
  const alias = catalog.find((item) => item.aliases?.some((name) => name.toLowerCase() === query));
  if (alias) return alias;
  const partial = catalog.find((item) => (
    item.name.toLowerCase().includes(query) || query.includes(item.name.toLowerCase())
  ));
  return partial ?? null;
}
