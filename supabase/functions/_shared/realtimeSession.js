const number = { type: 'number' };
const string = { type: 'string' };

const foodItem = {
  type: 'object',
  properties: {
    name: string,
    quantity: number,
    unit: { type: 'string', enum: ['g', 'kg', 'oz', 'lb', 'ml', 'cup', 'cups', 'tbsp', 'tsp', 'piece', 'pieces', 'slice', 'slices', 'serving', 'servings'] },
    preparationState: { type: 'string', enum: ['raw', 'cooked', 'unknown'] },
    mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snacks'] },
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    source: { type: 'string', enum: ['estimate', 'label'] },
    confidence: { type: 'string', enum: ['medium', 'high'] },
    sourceNote: string,
    date: string,
  },
  required: ['name', 'quantity', 'unit', 'calories', 'protein', 'carbs', 'fat', 'sourceNote'],
};

const setItem = {
  type: 'object',
  properties: {
    reps: number,
    weight: number,
    isWarmup: { type: 'boolean' },
  },
  required: ['reps', 'weight'],
};

function tool(name, description, parameters, required = []) {
  return {
    type: 'function',
    name,
    description,
    parameters: { type: 'object', properties: parameters, required },
  };
}

export const realtimeTools = [
  tool('get_daily_nutrition', 'Read foods already saved for a date and the daily targets.', { date: string }),
  tool('get_nutrition_goals', 'Read the user calorie and macro targets.', {}),
  tool('get_weight_history', 'Read recent weigh-ins.', { limit: number }),
  tool('get_exercise_history', 'Read saved sets for one exercise.', { exerciseName: string }, ['exerciseName']),
  tool('get_personal_records', 'Read saved personal records.', {}),
  tool('calculate_food_macros', 'Look up a packaged food on the web and return the package label. Call this for brand names before saving. For one bag or one package, use quantity 1 and unit serving.', {
    foodName: string,
    quantity: number,
    unit: string,
    preparationState: string,
  }, ['foodName', 'quantity', 'unit']),
  tool('add_food_entry', 'Prepare a food log. Set confirmed true only after the user has said what they ate. This does not finish saving until confirm_pending_action returns saved true.', {
    confirmed: { type: 'boolean' },
    date: string,
    items: { type: 'array', items: foodItem },
  }, ['confirmed', 'items']),
  tool('update_food_entry', 'Correct a saved food. Do not add a second copy.', {
    entryId: string,
    name: string,
    quantity: number,
    unit: string,
    preparationState: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
  }),
  tool('delete_food_entry', 'Delete one saved food.', { entryId: string }, ['entryId']),
  tool('log_body_weight', 'Prepare a weigh-in. Set confirmed true only after the user states a weight.', {
    weight: number,
    unit: { type: 'string', enum: ['lb', 'kg'] },
    date: string,
    confirmed: { type: 'boolean' },
  }, ['weight', 'date', 'confirmed']),
  tool('log_exercise_sets', 'Prepare workout sets. Set confirmed true only after the user states the sets they did. Warm-ups should set isWarmup true.', {
    exerciseName: string,
    unit: { type: 'string', enum: ['lb', 'kg'] },
    date: string,
    confirmed: { type: 'boolean' },
    sets: { type: 'array', items: setItem },
  }, ['exerciseName', 'sets', 'confirmed']),
  tool('update_exercise_set', 'Correct one saved set. Do not log a duplicate set.', {
    setId: string,
    exerciseName: string,
    setIndex: number,
    lastSet: { type: 'boolean' },
    reps: number,
    weight: number,
    date: string,
  }),
  tool('confirm_pending_action', 'Save the entry the user just agreed to. Call this only after they say yes.', {
    actionId: string,
  }),
];

export function realtimeInstructions(today) {
  return `You are the Project Ascension voice assistant. Today is ${today}.
Speak in short sentences. The user can interrupt you.
Greet them once and ask what they ate or trained.
For a branded or packaged food, call calculate_food_macros before you choose numbers. It searches the web for the package label.
If the tool returns a label, speak those numbers and say they come from the product label. Save with source "label", confidence "high", and the tool's sourceNote.
If the tool says to estimate, calculate the numbers yourself, say they are estimates, and save with source "estimate", confidence "medium", and sourceNote "AI estimate, not a verified database value."
Ask for a missing amount, unit, or raw versus cooked state. Do not invent those.
Only say an entry was saved when a tool result has saved true.
If a tool returns pending_confirmation, it is not saved. Ask the user to say yes, then call confirm_pending_action.
Do not log hypothetical food or workouts.
Corrections update the existing entry. Do not add a second copy.
There is no steps tool. You may acknowledge steps, but do not say they were saved.
User-set calorie and macro goals stay as they are unless the user explicitly asks to change them.`;
}

/** Open a WebRTC call with the full realtime voice. Returns the SDP answer. */
export async function createRealtimeCall(apiKey, sdp, userId, today) {
  const session = {
    type: 'realtime',
    model: 'gpt-realtime-2.1',
    instructions: realtimeInstructions(today),
    audio: {
      input: {
        noise_reduction: { type: 'near_field' },
        turn_detection: { type: 'semantic_vad', eagerness: 'low', create_response: true, interrupt_response: true },
        transcription: { model: 'gpt-4o-mini-transcribe', language: 'en' },
      },
      output: { voice: 'marin' },
    },
    tools: realtimeTools,
    tool_choice: 'auto',
    reasoning: { effort: 'low' },
  };
  const body = new FormData();
  body.set('sdp', sdp);
  body.set('session', JSON.stringify(session));
  const response = await fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'OpenAI-Safety-Identifier': userId,
    },
    body,
  });
  const answer = await response.text();
  if (!response.ok) {
    throw new Error(answer.slice(0, 280) || `Voice connection failed (${response.status})`);
  }
  return answer;
}
