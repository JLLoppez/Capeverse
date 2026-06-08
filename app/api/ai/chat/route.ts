import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { rateLimitResponse } from '@/lib/rateLimit';
import { getActiveDestination } from '@/lib/destinations';

async function buildSystemPrompt(): Promise<string> {
  const destination = getActiveDestination();

  const attractions = await prisma.attraction.findMany({
    where: { isActive: true },
    select: { name: true, region: true, tags: true, estimatedVisitMinutes: true, shortDescription: true },
    orderBy: { name: 'asc' },
  });

  const inventoryBlock = attractions
    .map((a) => {
      const tags = (a.tags as string[]).join(', ');
      const mins = a.estimatedVisitMinutes ? ` (${a.estimatedVisitMinutes} min)` : '';
      return `- ${a.name} [${a.region}]${mins} — tags: ${tags} — ${a.shortDescription}`;
    })
    .join('\n');

  return `You are a knowledgeable ${destination.name} travel planning assistant for a luxury private-tour company.

Your role:
- Help travellers discover the best of ${destination.name} using ONLY attractions listed in <inventory> below
- Ask smart clarifying questions about travel dates, group size, budget, and interests
- Give specific, opinionated recommendations — not generic lists
- When a request is complex or custom, warmly guide them to submit an enquiry
- Keep responses under 120 words unless the traveller asks for detail
- Never mention competitors or other booking platforms
- Only recommend attractions that appear in <inventory> — never invent places

${destination.systemPromptContext}

<inventory>
${inventoryBlock}
</inventory>`;
}

function localReply(messages: Array<{ role: string; content: string }>): string {
  const latest  = messages[messages.length - 1]?.content?.toLowerCase() ?? '';
  const history = messages.map((m) => m.content.toLowerCase()).join(' ');
  const has = (...words: string[]) => words.some((w) => latest.includes(w) || history.includes(w));

  if (has('wine', 'winelands', 'stellenbosch', 'franschhoek'))
    return "For wine lovers, I'd start with a full day in Stellenbosch and Franschhoek — very different characters. Stellenbosch is robust and social; Franschhoek is intimate and food-forward. Want me to suggest a private route that covers both without the coach-tour crowds?";
  if (has('family', 'kids', 'children'))
    return "Cape Town is brilliant for families. Boulders Beach (African penguins), Kirstenbosch gardens, and Table Mountain are the crowd-pleasers. How old are the kids? That changes the pace quite a bit.";
  if (has('penguin', 'boulders'))
    return "Boulders Beach near Simon's Town is where you'll find Cape Town's African penguin colony. It pairs perfectly with Cape Point on the same day — a classic Peninsula loop.";
  if (has('table mountain'))
    return "Table Mountain is typically Day 1 material — iconic views and it sets the scene for everything else. The aerial cableway is weather-dependent, so mornings on clear days are best. Want to pair it with Bo-Kaap or the waterfront?";
  if (has('solo', 'alone', 'by myself'))
    return "Solo travel in Cape Town works really well — full flexibility on pace. What draws you most: big scenery, wine country, culture, or a bit of everything?";
  if (has('couple', 'honeymoon', 'romantic'))
    return "Cape Town is one of the best honeymoon destinations in the world. Franschhoek for wine and food, Chapman's Peak at sunset, and a private guide who knows the quiet spots. What time of year are you visiting?";
  if (has('budget', 'cheap', 'affordable'))
    return "Cape Town can be done well on a tighter budget — especially if you self-drive. Bo-Kaap, Kirstenbosch, and the V&A Waterfront have great free or low-cost options. What's most important to you to include?";
  if (has('day', 'how long', 'how many'))
    return "Most visitors need 5–7 days to feel like they've scratched the surface. Day 1: city and Table Mountain. Day 2: Cape Peninsula. Day 3: Winelands. Days 4–5: leisure or Garden Route. Want me to map that out properly?";

  return "I can help you plan something specific to Cape Town — whether that's a single day trip or a full week. What are you most excited to experience: the scenery, the wine, the culture, or something else?";
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, 'ai_chat');
  if (limited) return limited;

  let body: { messages?: Array<{ role: string; content: string }>; sessionId?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      reply: localReply(messages),
      sessionId: body.sessionId ?? crypto.randomUUID(),
    });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemPrompt = await buildSystemPrompt();

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 400,
      temperature: 0.8,
    });

    const reply = response.choices[0]?.message?.content ?? localReply(messages);
    return NextResponse.json({ reply, sessionId: body.sessionId ?? crypto.randomUUID() });
  } catch {
    return NextResponse.json({
      reply: localReply(messages),
      sessionId: body.sessionId ?? crypto.randomUUID(),
    });
  }
}
