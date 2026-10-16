import { scaleFoodMacros, preparationMatches } from './foodScaling.js';
import { lookupProductLabel, scaleLabelServing } from './foodLabelLookup.js';
import { findFoodCorrectionTarget, findSetCorrectionTarget } from './toolValidation.js';

const NUTRIENT_IDS = { calories: [1008, 2047], protein: [1003], carbs: [1005], fat: [1004, 1007] };

function round(value) {
  return Math.round(Number(value) * 10) / 10;
}

function nutrientAmount(food, ids) {
  for (const row of food.foodNutrients ?? []) {
    const id = row.nutrientId ?? row.nutrient?.id;
    if (ids.includes(id) && (row.value != null || row.amount != null)) {
      return round(row.value ?? row.amount);
    }
  }
  return null;
}

/** Read USDA food macros without inventing missing values. */
export function macrosFromUsdaFood(food) {
  const label = food.labelNutrients;
  if (label?.calories?.value != null) {
    return {
      calories: round(label.calories.value),
      protein: round(label.protein?.value ?? 0),
      carbs: round(label.carbohydrates?.value ?? 0),
      fat: round(label.fat?.value ?? 0),
      basis: 'per_serving',
      servingGrams: food.servingSize && /g/i.test(food.servingSizeUnit || '') ? Number(food.servingSize) : null,
      servingDescription: food.householdServingFullText || (food.servingSize ? `${food.servingSize} ${food.servingSizeUnit}` : '1 serving'),
      source: 'label',
    };
  }
  const calories = nutrientAmount(food, NUTRIENT_IDS.calories);
  if (calories == null) return null;
  return {
    calories,
    protein: nutrientAmount(food, NUTRIENT_IDS.protein) ?? 0,
    carbs: nutrientAmount(food, NUTRIENT_IDS.carbs) ?? 0,
    fat: nutrientAmount(food, [1007]) ?? 0,
    basis: 'per_100g',
    servingGrams: 100,
    servingDescription: '100 g',
    source: 'usda',
  };
}

function estimateFallback() {
  return {
    ok: true,
    mode: 'estimate',
    foods: [],
    instruction: 'No package label was found. Estimate the macros, tell the user they are estimates, and save with source "estimate", confidence "medium", and sourceNote "AI estimate, not a verified database value."',
  };
}

async function lookupFood(context, query, brandedOnly) {
  if (context.usdaKey) return searchUsda(context.usdaKey, query, brandedOnly);
  const label = await lookupProductLabel(context.openaiKey, query);
  if (!label) return estimateFallback();
  return {
    ok: true,
    mode: 'label',
    foods: [{
      description: label.name,
      brandOwner: label.brand,
      servingDescription: label.servingDescription,
    }],
    label,
    instruction: 'A package label was found. Use calculate_food_macros for the amount eaten, then tell the user the numbers come from that label.',
  };
}

async function searchUsda(usdaKey, query, brandedOnly) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(usdaKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      pageSize: 5,
      dataType: brandedOnly ? ['Branded'] : ['Branded', 'Foundation', 'SR Legacy', 'Survey (FNDDS)'],
    }),
  });
  if (!response.ok) return { ok: false, error: `USDA search failed (${response.status})` };
  const payload = await response.json();
  const foods = (payload.foods ?? []).map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner || food.brandName || null,
    dataType: food.dataType,
    macros: macrosFromUsdaFood(food),
  })).filter((food) => food.macros);
  return { ok: true, foods };
}

async function insertFood(db, userId, item) {
  const id = crypto.randomUUID();
  const { error } = await db.from('food_entries').insert({
    id,
    user_id: userId,
    date: item.date,
    meal_type: item.mealType || 'snacks',
    name: item.name,
    brand: item.brand ?? null,
    quantity: item.quantity,
    unit: item.unit,
    preparation_state: item.preparationState || 'unknown',
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fdc_id: item.fdcId ?? null,
    source: item.source,
    confidence: item.confidence,
    source_note: item.sourceNote ?? null,
    client_request_id: item.clientRequestId,
  });
  if (error?.code === '23505') {
    const { data } = await db.from('food_entries').select('id').eq('user_id', userId).eq('client_request_id', item.clientRequestId).maybeSingle();
    return { id: data?.id, duplicate: true };
  }
  if (error) throw new Error(error.message);
  return { id, duplicate: false };
}

function foodItemFromArgs(item, date) {
  return {
    date: item.date || date,
    mealType: item.mealType || 'snacks',
    name: item.name,
    brand: item.brand ?? null,
    quantity: Number(item.quantity),
    unit: item.unit,
    preparationState: item.preparationState || 'unknown',
    calories: Number(item.calories),
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    fdcId: item.fdcId ?? null,
    source: item.source || 'estimate',
    confidence: item.confidence || (item.source === 'estimate' ? 'medium' : 'high'),
    sourceNote: item.sourceNote ?? null,
  };
}

async function queueOrInsert(db, userId, conversationId, toolName, payload, trusted) {
  const id = crypto.randomUUID();
  if (!trusted) {
    const { error } = await db.from('ai_action_logs').insert({
      id,
      user_id: userId,
      conversation_id: conversationId,
      tool_name: toolName,
      args: payload,
      result: { status: 'pending_confirmation' },
      status: 'pending',
      idempotency_key: id,
    });
    if (error) throw new Error(error.message);
    return {
      ok: true,
      saved: false,
      status: 'pending_confirmation',
      pendingAction: { id, type: toolName, summary: payload.summary, payload },
    };
  }
  return null;
}

export async function executeTool(db, userId, name, args, context) {
  const today = context.today;
  switch (name) {
    case 'get_user_profile':
    case 'get_nutrition_goals': {
      const { data, error } = await db.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw new Error(error.message);
      return { ok: true, settings: data };
    }
    case 'get_daily_nutrition': {
      const date = args.date || today;
      const [{ data: entries, error }, { data: settings, error: settingsError }] = await Promise.all([
        db.from('food_entries').select('*').eq('user_id', userId).eq('date', date),
        db.from('user_settings').select('daily_calories, protein_goal, carb_goal, fat_goal').eq('user_id', userId).maybeSingle(),
      ]);
      if (error || settingsError) throw new Error(error?.message || settingsError.message);
      const totals = (entries ?? []).reduce((sum, entry) => ({
        calories: sum.calories + Number(entry.calories),
        protein: sum.protein + Number(entry.protein),
        carbs: sum.carbs + Number(entry.carbs),
        fat: sum.fat + Number(entry.fat),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      return {
        ok: true,
        date,
        entries,
        totals,
        targets: settings,
        remaining: {
          calories: Math.max(0, Number(settings?.daily_calories ?? 0) - totals.calories),
          protein: Math.max(0, Number(settings?.protein_goal ?? 0) - totals.protein),
          carbs: Math.max(0, Number(settings?.carb_goal ?? 0) - totals.carbs),
          fat: Math.max(0, Number(settings?.fat_goal ?? 0) - totals.fat),
        },
      };
    }
    case 'search_foods':
      return lookupFood(context, args.brand ? `${args.brand} ${args.query || args.foodName}` : (args.query || args.foodName), Boolean(args.brand));
    case 'calculate_food_macros': {
      const query = args.brand ? `${args.brand} ${args.foodName || args.query}` : (args.foodName || args.query);
      if (!context.usdaKey) {
        const label = await lookupProductLabel(context.openaiKey, query);
        if (!label) return estimateFallback();
        return scaleLabelServing(label, args.quantity, args.unit);
      }
      const searched = await searchUsda(context.usdaKey, query, Boolean(args.brand));
      if (!searched.ok || searched.mode === 'estimate') return searched;
      const match = searched.foods[0];
      if (!match) return { ok: false, error: 'no_food_match', clarification: 'No nutrition reference was found. Do not invent values.' };
      const branded = match.dataType === 'Branded';
      const substitution = Boolean(args.brand) && !branded;
      const preparation = preparationMatches(args.preparationState, /cooked/i.test(match.description) ? 'cooked' : /raw/i.test(match.description) ? 'raw' : 'unknown');
      const scaled = scaleFoodMacros(match.macros, { quantity: args.quantity, unit: args.unit });
      if (!scaled.ok) return { ok: false, error: scaled.reason, clarification: 'Ask for a weight in grams or a serving count.' };
      return {
        ok: true,
        food: match.description,
        brand: match.brandOwner,
        fdcId: match.fdcId,
        dataType: match.dataType,
        ...scaled,
        source: substitution || preparation.uncertain ? 'estimate' : match.macros.source === 'label' ? 'label' : 'usda',
        confidence: substitution || preparation.uncertain ? 'medium' : 'high',
        sourceNote: [
          substitution ? `No verified ${args.brand} match. Generic substitute: ${match.description}.` : null,
          preparation.reason === 'raw_cooked_mismatch' ? 'Raw and cooked weights differ. This is an estimate.' : null,
          preparation.uncertain && !preparation.reason ? 'Preparation state was not confirmed against the reference.' : null,
        ].filter(Boolean).join(' ') || null,
      };
    }
    case 'add_food_entry': {
      const items = (Array.isArray(args.items) ? args.items : [args]).map((item) => foodItemFromArgs(item, today));
      const queued = await queueOrInsert(db, userId, context.conversationId, name, {
        items,
        summary: items.map((item) => `${item.quantity} ${item.unit} ${item.name}`).join(', '),
      }, context.trusted);
      if (queued) return queued;
      const saved = [];
      for (const [index, item] of items.entries()) {
        const row = await insertFood(db, userId, { ...item, clientRequestId: `${context.requestKey}:${index}` });
        saved.push(row);
      }
      return { ok: true, saved: true, ids: saved.map((row) => row.id) };
    }
    case 'update_food_entry': {
      let entryId = args.entryId;
      if (!entryId) {
        const { data, error } = await db.from('food_entries').select('id, name, meal_type').eq('user_id', userId).eq('date', args.date || today);
        if (error) throw new Error(error.message);
        const target = findFoodCorrectionTarget((data ?? []).map((row) => ({ id: row.id, name: row.name, mealType: row.meal_type })), { name: args.name, mealType: args.mealType });
        if (target.status !== 'found') return { ok: false, error: target.status, clarification: 'Ask which food to change.' };
        entryId = target.entry.id;
      }
      const updates = {
        ...(args.quantity != null && { quantity: args.quantity }),
        ...(args.unit && { unit: args.unit }),
        ...(args.calories != null && { calories: args.calories }),
        ...(args.protein != null && { protein: args.protein }),
        ...(args.carbs != null && { carbs: args.carbs }),
        ...(args.fat != null && { fat: args.fat }),
        ...(args.name && { name: args.name }),
        ...(args.preparationState && { preparation_state: args.preparationState }),
        ...(args.sourceNote && { source_note: args.sourceNote }),
      };
      const { data, error } = await db.from('food_entries').update(updates).eq('id', entryId).eq('user_id', userId).select('id').maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return { ok: false, error: 'not_found' };
      return { ok: true, saved: true, id: data.id };
    }
    case 'delete_food_entry': {
      const { error, count } = await db.from('food_entries').delete({ count: 'exact' }).eq('id', args.entryId).eq('user_id', userId);
      if (error) throw new Error(error.message);
      if (!count) return { ok: false, error: 'not_found' };
      return { ok: true, saved: true };
    }
    case 'log_body_weight': {
      const queued = await queueOrInsert(db, userId, context.conversationId, name, {
        date: args.date || today,
        weight: Number(args.weight),
        unit: args.unit,
        summary: `${args.weight} ${args.unit || 'lb'} on ${args.date || today}`,
      }, context.trusted);
      if (queued) return queued;
      const id = crypto.randomUUID();
      const { error } = await db.from('weight_entries').insert({
        id,
        user_id: userId,
        date: args.date || today,
        weight: Number(args.weight),
        note: args.note ?? null,
      });
      if (error) throw new Error(error.message);
      return { ok: true, saved: true, id };
    }
    case 'get_weight_history': {
      const { data, error } = await db.from('weight_entries').select('date, weight, note').eq('user_id', userId).order('date', { ascending: false }).limit(args.limit || 30);
      if (error) throw new Error(error.message);
      return { ok: true, entries: data };
    }
    case 'get_workout_plan': {
      const { data: plans, error } = await db.from('workout_plans').select('id, name').eq('user_id', userId).eq('is_active', true).limit(1);
      if (error) throw new Error(error.message);
      if (!plans?.length) return { ok: true, plan: null };
      const { data: days, error: dayError } = await db.from('planned_workouts').select('id, weekday, focus, status').eq('plan_id', plans[0].id).order('weekday');
      if (dayError) throw new Error(dayError.message);
      return { ok: true, plan: { ...plans[0], days } };
    }
    case 'log_exercise_sets': {
      const payload = {
        date: args.date || today,
        exerciseName: args.exerciseName,
        unit: args.unit || 'lb',
        sets: args.sets,
        summary: `${args.sets.length} sets of ${args.exerciseName}`,
      };
      const queued = await queueOrInsert(db, userId, context.conversationId, name, payload, context.trusted);
      if (queued) return queued;
      return insertSets(db, userId, payload, context.requestKey);
    }
    case 'update_exercise_set': {
      let setId = args.setId;
      if (!setId) {
        const { data: sessions, error } = await db.from('workout_sessions').select('id').eq('user_id', userId).eq('date', args.date || today);
        if (error) throw new Error(error.message);
        const ids = (sessions ?? []).map((session) => session.id);
        if (!ids.length) return { ok: false, error: 'missing' };
        const { data: sets, error: setError } = await db.from('exercise_sets').select('*').in('session_id', ids);
        if (setError) throw new Error(setError.message);
        const target = findSetCorrectionTarget((sets ?? []).map((set) => ({
          id: set.id,
          exerciseName: set.exercise_name,
          setIndex: set.set_index,
        })), { exerciseName: args.exerciseName, setIndex: args.setIndex, lastSet: Boolean(args.lastSet) });
        if (target.status !== 'found') return { ok: false, error: target.status, clarification: 'Ask which set to change.' };
        setId = target.set.id;
      }
      const { data, error } = await db.from('exercise_sets').update({
        ...(args.reps != null && { reps: args.reps }),
        ...(args.weight != null && { weight: args.weight }),
      }).eq('id', setId).eq('user_id', userId).select('id').maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return { ok: false, error: 'not_found' };
      return { ok: true, saved: true, id: data.id };
    }
    case 'skip_planned_workout': {
      const id = crypto.randomUUID();
      const { error } = await db.from('workout_sessions').insert({
        id,
        user_id: userId,
        date: args.date || today,
        status: 'skipped',
        notes: args.reason || 'Skipped',
        planned_workout_id: args.plannedWorkoutId ?? null,
      });
      if (error) throw new Error(error.message);
      if (args.plannedWorkoutId) {
        await db.from('planned_workouts').update({ status: 'skipped' }).eq('id', args.plannedWorkoutId).eq('user_id', userId);
      }
      return { ok: true, saved: true, id, status: 'skipped' };
    }
    case 'get_exercise_history': {
      const { data, error } = await db.from('exercise_sets').select('exercise_name, set_index, weight, reps, unit, is_warmup, workout_sessions!inner(date, status)').eq('user_id', userId).ilike('exercise_name', args.exerciseName || '%').limit(40);
      if (error) throw new Error(error.message);
      return { ok: true, sets: data };
    }
    case 'get_personal_records': {
      const { data, error } = await db.from('personal_records').select('*').eq('user_id', userId).order('achieved_on', { ascending: false }).limit(20);
      if (error) throw new Error(error.message);
      return { ok: true, records: data };
    }
    case 'get_training_analytics': {
      const { data, error } = await db.from('workout_sessions').select('id, date, status').eq('user_id', userId).order('date', { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      const completed = (data ?? []).filter((session) => session.status === 'completed' || session.status === 'partial');
      return { ok: true, recentSessions: data, completedCount: completed.length };
    }
    default:
      return { ok: false, error: 'unknown_tool' };
  }
}

async function insertSets(db, userId, payload, requestKey) {
  const { data: existing, error: existingError } = await db.from('workout_sessions').select('id, status').eq('user_id', userId).eq('date', payload.date);
  if (existingError) throw new Error(existingError.message);
  let sessionId = (existing ?? []).find((session) => session.status !== 'skipped')?.id;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    const { error } = await db.from('workout_sessions').insert({
      id: sessionId,
      user_id: userId,
      date: payload.date,
      status: 'completed',
    });
    if (error) throw new Error(error.message);
  }
  const rows = payload.sets.map((set, index) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    session_id: sessionId,
    exercise_name: payload.exerciseName,
    set_index: set.setIndex ?? index + 1,
    weight: Number(set.weight) || 0,
    reps: Number(set.reps) || 0,
    unit: payload.unit === 'kg' ? 'kg' : 'lb',
    is_warmup: Boolean(set.isWarmup),
    is_failure: Boolean(set.isFailure),
    source: 'user',
    client_request_id: `${requestKey}:${index + 1}`,
  }));
  const { error } = await db.from('exercise_sets').insert(rows);
  if (error?.code === '23505') return { ok: true, saved: true, duplicate: true, sessionId };
  if (error) throw new Error(error.message);
  return { ok: true, saved: true, sessionId, setIds: rows.map((row) => row.id) };
}

export async function confirmAction(db, userId, actionId) {
  const { data: action, error } = await db.from('ai_action_logs').select('*').eq('id', actionId).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!action) return { ok: false, error: 'not_found' };
  if (action.status === 'applied') return { ok: true, saved: true, duplicate: true, result: action.result };

  let result;
  if (action.tool_name === 'add_food_entry') {
    const ids = [];
    for (const [index, item] of action.args.items.entries()) {
      const saved = await insertFood(db, userId, { ...item, clientRequestId: `${actionId}:${index}` });
      ids.push(saved.id);
    }
    result = { ok: true, saved: true, ids };
  } else if (action.tool_name === 'log_body_weight') {
    const id = crypto.randomUUID();
    const { error: insertError } = await db.from('weight_entries').insert({
      id,
      user_id: userId,
      date: action.args.date,
      weight: action.args.weight,
    });
    if (insertError) throw new Error(insertError.message);
    result = { ok: true, saved: true, id };
  } else if (action.tool_name === 'log_exercise_sets') {
    result = await insertSets(db, userId, action.args, actionId);
  } else {
    return { ok: false, error: 'unsupported_action' };
  }

  const { error: updateError } = await db.from('ai_action_logs').update({ status: 'applied', result }).eq('id', actionId).eq('user_id', userId);
  if (updateError) throw new Error(updateError.message);
  return result;
}
