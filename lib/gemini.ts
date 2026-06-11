/**
 * lib/gemini.ts
 *
 * Gemini AI client — single entry point for all AI calls in Capiverse.
 * Replaces the previous openai dependency.
 *
 * Model: gemini-2.0-flash
 *   - Fast, low-latency, strong instruction-following
 *   - JSON mode via responseMimeType: 'application/json'
 *   - Multi-turn chat via startChat()
 *
 * Three public helpers cover every use case in the codebase:
 *   generateText  — single-turn prose
 *   generateJSON  — single-turn structured output (typed)
 *   chat          — multi-turn conversation
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';

// ── Singleton ──────────────────────────────────────────────────────────────────

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(key);
}

const MODEL = 'gemini-2.0-flash';

// ── Public types ───────────────────────────────────────────────────────────────

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Single-turn text generation. */
export async function generateText(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Single-turn JSON generation.
 * Uses Gemini's native JSON mode (responseMimeType).
 * Strip any accidental markdown fences before parsing.
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean) as T;
}

/**
 * Multi-turn chat.
 * Pass the full message history on every call — Gemini is stateless.
 *
 * NOTE: Gemini requires history to start with a user turn.
 * Leading assistant messages (e.g. the welcome message) are stripped
 * from history automatically so they don't cause API errors.
 */
export async function chat(
  messages: ChatMessage[],
  systemInstruction?: string
): Promise<string> {
  if (messages.length === 0) throw new Error('messages array is empty');

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user') {
    throw new Error('Last message must be from the user');
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
  });

  // Build history — everything except the last message.
  // Gemini requires alternating user/model turns starting with user,
  // so we skip any leading assistant messages (e.g. the WELCOME message).
  const historyRaw = messages.slice(0, -1);
  let start = 0;
  while (start < historyRaw.length && historyRaw[start]?.role !== 'user') {
    start++;
  }

  const history: Content[] = historyRaw.slice(start).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const session = model.startChat({ history });
  const result  = await session.sendMessage(lastMsg.content);
  return result.response.text();
}

/** Feature flag — callers degrade gracefully when false. */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
