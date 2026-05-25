import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rateLimit';

/**
 * Fix: removed top-level `import OpenAI` — OpenAI package is optional.
 * Now dynamically required only when OPENAI_API_KEY is present.
 */

const SYSTEM_PROMPT = `You are a knowledgeable Cape Town travel planning assistant for a luxury private-tour company.

Your role:
- Help travellers discover the best of Cape Town (Peninsula, Winelands, City, Garden Route)
- Ask smart clarifying questions about travel dates, group size, budget, and interests
- Give specific, opinionated recommendations — not generic lists
- When a request is complex or custom, warmly guide them to submit an enquiry
- Keep responses under 120 words unless the traveller asks for detail
- Never mention competitors or other booking platforms

Cape Town expertise:
- Best months: October–April (summer). May–September can be windy but uncrowded.
- Must-sees: Table Mountain, Cape Point, Boulders Beach penguins, Bo-Kaap, Winelands (Stellenbosch/Franschhoek)
- Hidden gems: Chapman's Peak drive at sunset, Kalk Bay harbour, Oranjezicht City Farm Market
- Private tour advantage: no shared-coach crowds, flexible timing, local guide relationships`;

function localReply(messages: Array<{ role: string; content: string }>): string {
  const latest = messages[messages.length - 1]?.content?.toLowerCase() ?? '';
  const history = messages.map((m) => m.content.toLowerCase()).join(' ');

  if (latest.includes('wine') || history.includes('winelands'))
    return "For wine lovers, I'd start with a full day in Stellenbosch and Franschhoek — they have very different characters. Stellenbosch is more robust and social; Franschhoek is intimate and food-forward. Want me to suggest a private route that covers both without the coach-tour crowds?";
  if (latest.includes('family') || latest.includes('kids'))
    return "Cape Town is brilliant for families. Boulders Beach (African penguins), Kirstenbosch gardens, and the Two Oceans Aquarium are the crowd-pleasers. How old are the kids? That changes the pace quite a bit.";
  if (latest.includes('day') || latest.includes('how long'))
    return "Most visitors need 5–7 days to feel like they've scratched the surface. Day 1: city and Table Mountain. Day 2: Cape Peninsula. Day 3: Winelands. Days 4–5: Garden Route or leisure. Want me to map that out properly?";
  return "I can help you plan something really specific to Cape Town — whether that's a single day trip or a full week. What are you most excited to experience: the scenery, the wine, the culture, or something else?";
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, 'ai_chat');
  if (limited) return limited;

  let body: { messages?: Array<{ role: string; content: string }>; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  const sessionId = body.sessionId ?? crypto.randomUUID();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ reply: localReply(messages), sessionId });
  }

  try {
    // Dynamic import — avoids build crash when openai package is absent
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 400,
      temperature: 0.8,
    });

    const reply = response.choices[0]?.message?.content ?? localReply(messages);
    return NextResponse.json({ reply, sessionId });
  } catch {
    return NextResponse.json({ reply: localReply(messages), sessionId });
  }
}
