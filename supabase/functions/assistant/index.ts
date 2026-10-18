import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { validateToolCall } from '../_shared/toolValidation.js';
import { confirmAction, executeTool } from '../_shared/executeTools.js';
import { createRealtimeCall } from '../_shared/realtimeSession.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

const number = { type: 'number' };
const string = { type: 'string' };

const tools = [
  { type: 'function', function: { name: 'get_user_profile', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_nutrition_goals', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_daily_nutrition', parameters: { type: 'object', properties: { date: string } } } },
  { type: 'function', function: { name: 'get_weight_history', parameters: { type: 'object', properties: { limit: number } } } },
  { type: 'function', function: { name: 'get_workout_plan', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_exercise_history', parameters: { type: 'object', properties: { exerciseName: string } } } },
  { type: 'function', function: { name: 'get_personal_records', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_training_analytics', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'search_foods', parameters: { type: 'object', properties: { query: string, brand: string }, required: ['query'] } } },
  { type: 'function', function: { name: 'calculate_food_macros', parameters: { type: 'object', properties: { foodName: string, brand: string, quantity: number, unit: string, preparationState: string }, required: ['foodName', 'quantity', 'unit'] } } },
  { type: 'function', function: { name: 'add_food_entry', parameters: { type: 'object', properties: { confirmed: { type: 'boolean' }, items: { type: 'array' } }, required: ['confirmed'] } } },
  { type: 'function', function: { name: 'update_food_entry', parameters: { type: 'object', properties: { entryId: string, name: string, date: string, mealType: string, quantity: number, unit: string, calories: number, protein: number, carbs: number, fat: number, preparationState: string } } } },
  { type: 'function', function: { name: 'delete_food_entry', parameters: { type: 'object', properties: { entryId: string }, required: ['entryId'] } } },
  { type: 'function', function: { name: 'log_body_weight', parameters: { type: 'object', properties: { weight: number, unit: string, date: string, confirmed: { type: 'boolean' } }, required: ['weight', 'date', 'confirmed'] } } },
  { type: 'function', function: { name: 'log_exercise_sets', parameters: { type: 'object', properties: { exerciseName: string, unit: string, date: string, confirmed: { type: 'boolean' }, sets: { type: 'array' } }, required: ['exerciseName', 'sets', 'confirmed'] } } },
  { type: 'function', function: { name: 'update_exercise_set', parameters: { type: 'object', properties: { setId: string, exerciseName: string, setIndex: number, lastSet: { type: 'boolean' }, reps: number, weight: number, date: string } } } },
  { type: 'function', function: { name: 'skip_planned_workout', parameters: { type: 'object', properties: { date: string, plannedWorkoutId: string, reason: string }, required: ['date'] } } },
  { type: 'function', function: { name: 'confirm_pending_action', description: 'Save the meal, weigh-in, or workout the user just agreed to. Call this after any clear agreement, not only the word yes.', parameters: { type: 'object', properties: { actionId: string } } } },
];

function systemPrompt(today) {
  return `You are the Project Ascension assistant. Today is ${today}.
Use tools to read and write the user's Supabase records. Never invent saved records or past history.
For a branded or packaged food, call calculate_food_macros before choosing numbers. That tool searches the web for the package label.
If the tool returns a label, use those numbers and say they come from the product label.
If the tool says to estimate, calculate from the food name and amount, say the numbers are estimates, and save with source "estimate", confidence "medium", and sourceNote "AI estimate, not a verified database value."
When saving a found label, set source to "label", confidence to "high", and sourceNote to the tool's sourceNote.
Before saving food, a weigh-in, or a workout, ask a short question if the product, amount, serving size, or unit is unclear. Do not guess pounds versus kilograms, grams versus ounces, or how much was eaten.
Once those details are clear, say what will be saved.
Any clear agreement is enough. Yes, yeah, save it, go ahead, log it, confirm, do it, sounds good, and other ordinary agreements all count. Do not ask for one special phrase.
When the user agrees, call confirm_pending_action. If a save is already waiting, do not create a second copy.
Only say an entry was saved when a tool result has saved: true.
If a tool returns pending_confirmation, it is not saved yet. Call confirm_pending_action as soon as the user agrees.
Do not log hypothetical food or workouts. Do not call add_food_entry or log_exercise_sets for those.
Corrections must use update_food_entry or update_exercise_set, never a second add.
Distinguish raw and cooked weights. If a branded food has no verified match, say the generic substitute out loud.
Missing quantity, unit, or preparation should be a question, not a guessed exact value.
Skipped workouts are not completed workouts.
Estimated one-rep maxes must be called estimates.
User-set calorie and macro goals are authoritative. Do not change them unless the user explicitly asks.`;
}

const PENDING_NOTE = 'Not saved yet. When the user clearly agrees, in any ordinary wording, call confirm_pending_action. Do not ask for a specific phrase.';

async function openAiKeyFor(db, userId) {
  const { data, error } = await db.from('user_settings').select('openai_api_key').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  const personal = String(data?.openai_api_key || '').trim();
  if (personal) return personal;
  return Deno.env.get('OPENAI_API_KEY') || '';
}

async function confirmPending(db, userId, args) {
  let actionId = args?.actionId;
  if (!actionId) {
    const { data } = await db.from('ai_action_logs').select('id').eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle();
    actionId = data?.id;
  }
  if (!actionId) return { ok: false, saved: false, error: 'nothing_pending', message: 'There is nothing waiting to save.' };
  return confirmAction(db, userId, actionId);
}

async function openai(apiKey, body) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.slice(0, 300) || `OpenAI request failed (${response.status})`);
  }
  return response.json();
}

async function transcribe(apiKey, audioBase64) {
  const bytes = Uint8Array.from(atob(audioBase64), (char) => char.charCodeAt(0));
  const file = new Blob([bytes], { type: 'audio/webm' });
  const form = new FormData();
  form.append('file', file, 'speech.webm');
  form.append('model', 'whisper-1');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) throw new Error('Transcription failed');
  const payload = await response.json();
  return payload.text || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized', message: 'Sign in to use the assistant.' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'unauthorized', message: 'Sign in to use the assistant.' }, 401);
    const userId = userData.user.id;
    const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const openaiKey = await openAiKeyFor(db, userId);
    if (!openaiKey) {
      return json({
        error: 'ASSISTANT_UNAVAILABLE',
        message: 'Add your OpenAI API key in Settings. That OpenAI account also needs credits. Manual logging still works.',
      }, 503);
    }

    const body = await req.json();
    const today = body.today || new Date().toISOString().slice(0, 10);

    if (typeof body.realtimeSdp === 'string') {
      if (!body.realtimeSdp.trim()) {
        return json({ error: 'sdp_required', message: 'Could not start the voice connection.' }, 400);
      }
      try {
        const sdp = await createRealtimeCall(openaiKey, body.realtimeSdp, userId, today);
        return json({ sdp });
      } catch (error) {
        const detail = String(error.message || '');
        const billing = /quota|billing|credit|insufficient/i.test(detail);
        return json({
          error: billing ? 'credits_required' : 'realtime_unavailable',
          message: billing
            ? 'Add OpenAI credits, then click Talk again.'
            : 'The voice connection could not start. Try Talk again.',
        }, 502);
      }
    }

    if (body.toolCall?.name) {
      let conversationId = body.conversationId;
      if (!conversationId) {
        conversationId = crypto.randomUUID();
        const { error } = await db.from('ai_conversations').insert({
          id: conversationId,
          user_id: userId,
          title: 'Voice',
        });
        if (error) throw new Error(error.message);
      }
      const args = typeof body.toolCall.arguments === 'string'
        ? JSON.parse(body.toolCall.arguments || '{}')
        : (body.toolCall.arguments || {});
      if (body.toolCall.name === 'confirm_pending_action') {
        const result = await confirmPending(db, userId, args);
        return json({ ...result, conversationId });
      }
      const { data: settings } = await db.from('user_settings').select('trusted_auto_logging').eq('user_id', userId).maybeSingle();
      const validation = validateToolCall(body.toolCall.name, args, { userText: String(body.userText || '') });
      const requestKey = crypto.randomUUID();
      const result = validation.ok
        ? await executeTool(db, userId, body.toolCall.name, args, {
          usdaKey: Deno.env.get('USDA_API_KEY'),
          openaiKey,
          trusted: Boolean(settings?.trusted_auto_logging),
          conversationId,
          today,
          requestKey,
        })
        : { ok: false, error: validation.error, saved: false };
      if (result.pendingAction) {
        return json({
          ...result,
          conversationId,
          pending: [result.pendingAction],
          message: PENDING_NOTE,
        });
      }
      await db.from('ai_action_logs').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        conversation_id: conversationId,
        tool_name: body.toolCall.name,
        args,
        result,
        status: result.saved ? 'applied' : 'failed',
        idempotency_key: requestKey,
      });
      return json({ ...result, conversationId, pending: [] });
    }

    if (body.confirmActionId) {
      const result = await confirmAction(db, userId, body.confirmActionId);
      return json({ ...result, conversationId: body.conversationId ?? null });
    }

    let message = String(body.message || '').trim();
    if (body.audioBase64 && !message) message = await transcribe(openaiKey, body.audioBase64);
    if (!message && !body.imageDataUrl) return json({ error: 'message_required', message: 'Say or type what to log.' }, 400);

    let conversationId = body.conversationId;
    if (!conversationId) {
      conversationId = crypto.randomUUID();
      const { error } = await db.from('ai_conversations').insert({
        id: conversationId,
        user_id: userId,
        title: message.slice(0, 80) || 'Photo',
      });
      if (error) throw new Error(error.message);
    }

    await db.from('ai_messages').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      conversation_id: conversationId,
      role: 'user',
      content: message || 'Photo',
    });

    const { data: history } = await db.from('ai_messages').select('role, content').eq('conversation_id', conversationId).order('created_at');
    const messages = [
      { role: 'system', content: systemPrompt(today) },
      ...(history ?? []).map((row) => ({ role: row.role, content: row.content })),
    ];
    if (body.imageDataUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message || 'Identify the food. If this is a meal photo, ask for portion weights before saving.' },
          { type: 'image_url', image_url: { url: body.imageDataUrl } },
        ],
      });
    }

    const { data: settings } = await db.from('user_settings').select('trusted_auto_logging').eq('user_id', userId).maybeSingle();
    const pending = [];
    let reply = '';

    for (let turn = 0; turn < 5; turn += 1) {
      const completion = await openai(openaiKey, {
        model: body.imageDataUrl ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
      });
      const choice = completion.choices?.[0]?.message;
      if (!choice) break;
      messages.push(choice);
      if (!choice.tool_calls?.length) {
        reply = choice.content || '';
        break;
      }
      for (const call of choice.tool_calls) {
        const args = JSON.parse(call.function.arguments || '{}');
        if (call.function.name === 'confirm_pending_action') {
          const result = await confirmPending(db, userId, args);
          if (result.saved) pending.splice(0, pending.length);
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
          continue;
        }
        const validation = validateToolCall(call.function.name, args, { userText: message });
        const requestKey = crypto.randomUUID();
        const result = validation.ok
          ? await executeTool(db, userId, call.function.name, args, {
            usdaKey: Deno.env.get('USDA_API_KEY'),
            openaiKey,
            trusted: Boolean(settings?.trusted_auto_logging),
            conversationId,
            today,
            requestKey,
          })
          : { ok: false, error: validation.error, saved: false };
        if (result.pendingAction) {
          pending.push(result.pendingAction);
          result.message = PENDING_NOTE;
        }
        if (!result.pendingAction) {
          await db.from('ai_action_logs').insert({
            id: crypto.randomUUID(),
            user_id: userId,
            conversation_id: conversationId,
            tool_name: call.function.name,
            args,
            result,
            status: result.saved ? 'applied' : 'failed',
            idempotency_key: requestKey,
          });
        }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    if (reply) {
      await db.from('ai_messages').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        conversation_id: conversationId,
        role: 'assistant',
        content: reply,
      });
    }

    return json({
      message: reply,
      conversationId,
      pending,
      transcript: body.audioBase64 ? message : undefined,
    });
  } catch (error) {
    return json({ error: 'assistant_failed', message: error.message, saved: false }, 500);
  }
});
