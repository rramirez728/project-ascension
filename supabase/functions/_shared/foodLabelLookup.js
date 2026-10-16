import { toGrams } from './foodScaling.js';

function responseText(payload) {
  const chunks = [];
  for (const item of payload?.output || []) {
    for (const part of item.content || []) {
      if (part.text) chunks.push(part.text);
    }
  }
  return chunks.join('\n');
}

function firstSource(payload) {
  for (const item of payload?.output || []) {
    for (const part of item.content || []) {
      const citation = (part.annotations || []).find((note) => note.url);
      if (citation) return { url: citation.url, name: citation.title || '' };
    }
  }
  return { url: '', name: '' };
}

function parseLabel(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function requestLabel(apiKey, model, query) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      tools: [{ type: 'web_search', search_context_size: 'medium' }],
      tool_choice: 'required',
      input: `Search the web for the published package nutrition label of this exact food: ${query}.
Use the manufacturer's label or a retailer page that prints that label.
Reply with JSON only, no markdown, using these keys:
found, name, brand, servingDescription, servingGrams, calories, protein, carbs, fat, sourceUrl, sourceName.
Numbers are for one labeled serving.
servingGrams is the gram weight of that serving, or null if the label does not give grams.
If a reliable label cannot be found, set found to false and leave the numbers null.
Do not guess or use a similar product.`,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

/** Look up one packaged food label. Returns null when search cannot be used. */
export async function lookupProductLabel(apiKey, query) {
  const name = String(query || '').trim();
  if (!apiKey || !name) return null;

  let result = await requestLabel(apiKey, 'gpt-4.1-mini', name);
  if (!result.ok && /model/i.test(JSON.stringify(result.payload))) {
    result = await requestLabel(apiKey, 'gpt-4o', name);
  }
  if (!result.ok) return null;

  const label = parseLabel(responseText(result.payload));
  const cited = firstSource(result.payload);
  if (!label?.found) return null;

  const calories = numberOrNull(label.calories);
  const protein = numberOrNull(label.protein);
  const carbs = numberOrNull(label.carbs);
  const fat = numberOrNull(label.fat);
  if (calories == null || protein == null) return null;

  const sourceUrl = label.sourceUrl || cited.url || '';
  const sourceName = label.sourceName || cited.name || 'the product label';
  return {
    found: true,
    name: label.name || name,
    brand: label.brand || '',
    servingDescription: label.servingDescription || '1 serving',
    servingGrams: numberOrNull(label.servingGrams),
    calories,
    protein,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
    sourceUrl,
    sourceNote: sourceUrl
      ? `Package label from ${sourceName}: ${sourceUrl}`
      : `Package label from ${sourceName}.`,
  };
}

/** Scale a per-serving label to the amount the user ate. */
export function scaleLabelServing(label, quantity, unit) {
  const qty = Number(quantity);
  const key = String(unit || '').trim().toLowerCase();
  let multiplier = null;
  if (['serving', 'servings', 'piece', 'pieces'].includes(key) && qty > 0) {
    multiplier = qty;
  } else if (label.servingGrams && qty > 0) {
    const grams = toGrams(qty, key);
    if (grams != null) multiplier = grams / label.servingGrams;
  }

  if (multiplier == null) {
    return {
      ok: true,
      mode: 'label',
      scaled: false,
      food: label.name,
      brand: label.brand,
      servingDescription: label.servingDescription,
      calories: label.calories,
      protein: label.protein,
      carbs: label.carbs,
      fat: label.fat,
      source: 'label',
      confidence: 'high',
      sourceNote: label.sourceNote,
      instruction: `These numbers are for one labeled serving (${label.servingDescription}). Ask if that is the amount eaten before saving. When saving that serving, set source to "label", confidence to "high", and sourceNote to the sourceNote above.`,
    };
  }

  const round = (value) => Math.round(value * multiplier * 10) / 10;
  return {
    ok: true,
    mode: 'label',
    scaled: true,
    food: label.name,
    brand: label.brand,
    servingDescription: label.servingDescription,
    calories: round(label.calories),
    protein: round(label.protein),
    carbs: round(label.carbs),
    fat: round(label.fat),
    source: 'label',
    confidence: 'high',
    sourceNote: label.sourceNote,
    instruction: 'These numbers come from the published package label for the amount requested. Tell the user that. When saving, set source to "label", confidence to "high", and sourceNote to the sourceNote above.',
  };
}
