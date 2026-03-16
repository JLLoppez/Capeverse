import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function localReply(input: string) {
  const lower = input.toLowerCase();
  const wantsWine = lower.includes('wine');
  const wantsScenic = lower.includes('scenic') || lower.includes('view') || lower.includes('nature');
  const wantsCulture = lower.includes('culture') || lower.includes('history') || lower.includes('city');
  const family = lower.includes('family') || lower.includes('kids') || lower.includes('children');

  const suggestions = [] as string[];
  if (wantsScenic) suggestions.push('Cape Point, Chapman’s Peak Drive, and Table Mountain');
  if (wantsWine) suggestions.push('a full-day Winelands route with Stellenbosch and Franschhoek');
  if (wantsCulture) suggestions.push('a city route including Bo-Kaap and central Cape Town highlights');
  if (family) suggestions.push('family-friendly stops like Boulders Beach and Kirstenbosch');
  if (!suggestions.length) suggestions.push('a balanced first-time visitor route with city, peninsula, and winelands options');

  return `Based on what you shared, I’d recommend ${suggestions.join('; ')}. If you want, you can now move to the enquiry form and a consultant can turn that into a final quote and itinerary.`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const latest = messages[messages.length - 1]?.content || '';

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ reply: localReply(latest) });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are a Cape Town travel planning assistant for a luxury tourism company. Keep answers concise, practical, and warm. If the user seems unsure or has a complex request, encourage them to submit an enquiry to a real consultant.'
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 400
    });

    const reply = response.choices[0]?.message?.content || localReply(latest);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: localReply(latest) });
  }
}
