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

const ANGLES = new Set(['incline', 'decline']);
const IMPLEMENTS = new Set(['dumbbell', 'barbell', 'cable']);

/** Lowercase tokens, with inclined/incline unified and filler "bench" dropped on angled presses. */
export function exerciseTokens(input) {
  const text = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\binclined\b/g, 'incline');
  let tokens = text.split(/\s+/).filter(Boolean);
  const dropBench = tokens.includes('press')
    && tokens.some((token) => ANGLES.has(token))
    && tokens.some((token) => IMPLEMENTS.has(token));
  if (dropBench) tokens = tokens.filter((token) => token !== 'bench');
  return [...new Set(tokens)].sort();
}

function tokenKey(input) {
  return exerciseTokens(input).join(' ');
}

/** Stable key shared by a name, its aliases, and close variants such as "inclined dumbbell bench press". */
export function exerciseMatchKey(input, catalog = EXERCISE_CATALOG) {
  const key = tokenKey(input);
  if (!key) return '';
  const item = catalog.find((entry) => (
    [entry.name, ...(entry.aliases ?? [])].some((name) => tokenKey(name) === key)
  ));
  return item ? tokenKey(item.name) : key;
}

export function sameExercise(a, b, catalog = EXERCISE_CATALOG) {
  const left = exerciseMatchKey(a, catalog);
  const right = exerciseMatchKey(b, catalog);
  return Boolean(left) && left === right;
}

/** Catalog display name when the input matches a name or alias. */
export function canonicalExerciseName(input, catalog = EXERCISE_CATALOG) {
  const key = exerciseMatchKey(input, catalog);
  if (!key) return null;
  return catalog.find((entry) => tokenKey(entry.name) === key)?.name ?? null;
}

/** Resolve a spoken or typed exercise name to the catalog entry. */
export function resolveExerciseName(input, catalog = EXERCISE_CATALOG) {
  const key = exerciseMatchKey(input, catalog);
  if (!key) return null;
  return catalog.find((entry) => tokenKey(entry.name) === key) ?? null;
}
