import { NextResponse }                        from 'next/server';
import { getCTWeather, getWeatherNarrative }   from '@/lib/weather';

export async function GET() {
  try {
    const weather   = await getCTWeather();
    const narrative = await getWeatherNarrative(weather);
    return NextResponse.json(
      { current: weather.current, forecast: weather.forecast, microclimate: weather.microclimate, localTime: weather.localTime, narrative, cachedAt: weather.fetchedAt },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Weather fetch failed';
    console.error('[weather/cape-town]', message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
