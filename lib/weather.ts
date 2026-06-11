/**
 * lib/weather.ts
 *
 * Cape Town weather layer (ATMOS integration).
 * - Fetches OpenWeatherMap /forecast for Cape Town
 * - 30-minute in-memory cache
 * - Microclimate interpreter: Cape Doctor, cold front, berg wind, ideal
 * - Gemini-powered one-line narrative
 */

import { generateText, isGeminiConfigured } from '@/lib/gemini';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WeatherCurrent {
  temp: number; feelsLike: number; humidity: number;
  visibility: number; clouds: number;
  description: string; icon: string;
  windSpeed: number; windDeg: number;
}

export interface ForecastDay {
  date: string; dayLabel: string; icon: string;
  description: string; tempMin: number; tempMax: number;
}

export interface MicroclimateContext {
  condition:        'cape-doctor' | 'cold-front' | 'berg-wind' | 'ideal' | 'standard';
  tableMountain:    { open: boolean;     note: string };
  atlanticSeaboard: { suitable: boolean; note: string };
  falseBay:         { suitable: boolean; note: string };
  chapmansPeak:     { suitable: boolean; note: string };
  outdoorDining:    { suitable: boolean; note: string };
  headline:         string;
  promptContext:    string; // injected into itinerary generation prompt
}

export interface CapeWeather {
  current:      WeatherCurrent;
  forecast:     ForecastDay[];
  microclimate: MicroclimateContext;
  localTime:    string;
  fetchedAt:    number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const kToC     = (k: number) => Math.round(k - 273.15);
const mpsToKmh = (s: number) => Math.round(s * 3.6);
const DAYS_    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const;
const DIRS     = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'] as const;
export const windDir = (deg: number) => DIRS[Math.round(deg / 22.5) % 16] ?? 'N';

function fmtUnix(ts: number, tz: number): string {
  const d = new Date((ts + tz) * 1000);
  return `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`;
}

// ── Microclimate Interpreter ───────────────────────────────────────────────────

export function interpretMicroclimate(c: WeatherCurrent): MicroclimateContext {
  const speed  = mpsToKmh(c.windSpeed);
  const deg    = c.windDeg;
  const code   = c.icon.slice(0, 2);
  const isRain = ['09','10','11'].includes(code);

  const isCapeDoctor = deg >= 130 && deg <= 230 && speed >= 25;
  const isColdFront  = deg >= 220 && deg <= 285 && isRain;
  const isBergWind   = (deg >= 315 || deg <= 60) && !isRain && speed < 30;

  const condition: MicroclimateContext['condition'] =
    isCapeDoctor ? 'cape-doctor' :
    isColdFront  ? 'cold-front'  :
    isBergWind   ? 'berg-wind'   :
    (speed < 15 && !isRain && c.clouds < 50) ? 'ideal' : 'standard';

  switch (condition) {
    case 'cape-doctor': return {
      condition,
      tableMountain:    { open: false,         note: 'Tablecloth cloud likely — cable car closed or suspended' },
      atlanticSeaboard: { suitable: false,     note: `SE wind at ${speed} km/h — Clifton and Camps Bay will be very windy` },
      falseBay:         { suitable: true,      note: "Sheltered from the Cape Doctor — Muizenberg and Boulders Beach are calm" },
      chapmansPeak:     { suitable: speed < 40, note: speed >= 40 ? 'Strong SE wind — check road status before driving' : 'Manageable — go early before gusts increase' },
      outdoorDining:    { suitable: false,     note: 'Wind makes open terraces uncomfortable — recommend sheltered venues' },
      headline:         `Cape Doctor active (${speed} km/h SE) — route guests to False Bay today`,
      promptContext:    [
        `WEATHER: Cape Doctor SE wind (${speed} km/h). Table Mountain tablecloth cloud likely.`,
        `- Avoid: Clifton, Camps Bay, Sea Point, Table Mountain cable car`,
        `- Prefer: Muizenberg, Boulders Beach, Simon's Town, Kalk Bay (sheltered False Bay)`,
        `- Chapman's Peak: ${speed >= 40 ? 'check road status' : 'viable, go early'}`,
        `- Outdoor dining: move to sheltered venues`,
      ].join('\n'),
    };
    case 'cold-front': return {
      condition,
      tableMountain:    { open: false,  note: 'Rain and SW wind — cable car closed' },
      atlanticSeaboard: { suitable: false, note: 'Cold and wet — beach activities not viable' },
      falseBay:         { suitable: false, note: 'Rain affecting both sides — False Bay also impacted' },
      chapmansPeak:     { suitable: false, note: 'Check Sanral status — road sometimes closes in severe SW conditions' },
      outdoorDining:    { suitable: false, note: 'Recommend indoor restaurants: V&A Waterfront, Bree Street, Constantia cellars' },
      headline:         'Cold front moving through — prioritise indoor and morning activities',
      promptContext:    [
        `WEATHER: Cold front, rain, SW wind (${speed} km/h). Most outdoor activities compromised.`,
        `- Move outdoor activities to morning if front arrives afternoon`,
        `- Indoor alternatives: V&A Waterfront, District Six Museum, Zeitz MOCAA, wine cellar tastings`,
        `- Constantia wine estates viable (sheltered cellars)`,
        `- Table Mountain, beaches, Chapman's Peak: defer to another day`,
      ].join('\n'),
    };
    case 'berg-wind': return {
      condition,
      tableMountain:    { open: true,  note: 'Clear and still — excellent cable car day, book early' },
      atlanticSeaboard: { suitable: true, note: 'Warm and calm — ideal for Clifton, Camps Bay, Sea Point' },
      falseBay:         { suitable: true, note: 'Warm berg wind — Muizenberg and Boulders Beach excellent' },
      chapmansPeak:     { suitable: true, note: 'Perfect conditions — clear views, no wind' },
      outdoorDining:    { suitable: true, note: 'Warm and still — ideal for sunset terrace dining in Camps Bay or Constantia' },
      headline:         `Berg wind — warm, clear, still. Premium day for all outdoor activity`,
      promptContext:    [
        `WEATHER: Berg wind (N/NE, ${speed} km/h), ${kToC(c.temp)}°C, clear skies. Outstanding conditions.`,
        `- Table Mountain cable car: open, high demand — book first thing`,
        `- Chapman's Peak Drive: perfect visibility`,
        `- All beaches: warm and calm — Clifton, Camps Bay, Muizenberg, Boulders all ideal`,
        `- Sunset: Camps Bay and Signal Hill terrace dining will be exceptional`,
      ].join('\n'),
    };
    case 'ideal': return {
      condition,
      tableMountain:    { open: true,  note: 'Good conditions — cable car likely operating' },
      atlanticSeaboard: { suitable: true, note: 'Light wind, pleasant — comfortable conditions' },
      falseBay:         { suitable: true, note: 'Good conditions across the peninsula' },
      chapmansPeak:     { suitable: true, note: 'Clear conditions — great drive today' },
      outdoorDining:    { suitable: true, note: 'Good weather for outdoor dining' },
      headline:         `${kToC(c.temp)}°C with light winds — solid day for any Cape Town itinerary`,
      promptContext:    [
        `WEATHER: ${kToC(c.temp)}°C, ${c.description}, light wind (${speed} km/h). Good conditions.`,
        `- All major outdoor attractions viable today`,
        `- Table Mountain: favourable conditions — confirm cable car status`,
        `- No weather-driven routing restrictions`,
      ].join('\n'),
    };
    default: return {
      condition: 'standard',
      tableMountain:    { open: c.clouds < 70 && !isRain, note: c.clouds >= 70 || isRain ? 'Cloudy/wet — check live cable car status' : 'Adequate — confirm before visiting' },
      atlanticSeaboard: { suitable: !isRain && speed < 35, note: isRain ? 'Wet — beaches not practical' : `${speed} km/h — brisk but manageable` },
      falseBay:         { suitable: !isRain, note: isRain ? 'Wet — indoor alternatives preferred' : 'Adequate conditions' },
      chapmansPeak:     { suitable: !isRain && speed < 50, note: 'Standard conditions — drive is open' },
      outdoorDining:    { suitable: !isRain && speed < 30, note: isRain ? 'Rain — indoor dining recommended' : 'Outdoor dining viable' },
      headline:         `${kToC(c.temp)}°C, ${c.description} — standard Cape Town day`,
      promptContext:    [
        `WEATHER: ${kToC(c.temp)}°C, ${c.description}, ${windDir(deg)} wind at ${speed} km/h.`,
        `- Check live Table Mountain cable car status`,
        `- Route stops by geography as usual`,
      ].join('\n'),
    };
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL = 30 * 60 * 1000;
let _cache: CapeWeather | null = null;

// ── OWM Fetch ─────────────────────────────────────────────────────────────────

async function fetchOWM(): Promise<CapeWeather> {
  const key = process.env.OWM_API_KEY;
  if (!key) throw new Error('OWM_API_KEY is not set');

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=Cape+Town,ZA&appid=${key}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`OpenWeatherMap ${res.status}`);

  const d = await res.json() as {
    list: Array<{
      dt: number; dt_txt: string;
      main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
      weather: Array<{ description: string; icon: string }>;
      wind: { speed: number; deg?: number };
      visibility?: number;
      clouds?: { all: number };
    }>;
    city: { sunrise: number; sunset: number; timezone: number };
  };

  const raw = d.list[0]!;
  const current: WeatherCurrent = {
    temp: raw.main.temp, feelsLike: raw.main.feels_like, humidity: raw.main.humidity,
    visibility: raw.visibility ?? 10000, clouds: raw.clouds?.all ?? 0,
    description: raw.weather[0]!.description, icon: raw.weather[0]!.icon,
    windSpeed: raw.wind.speed, windDeg: raw.wind.deg ?? 0,
  };

  const todayStr = raw.dt_txt.slice(0, 10);
  const seen = new Set([todayStr]);
  const forecast: ForecastDay[] = [];

  for (const item of d.list) {
    const date = item.dt_txt.slice(0, 10);
    const hour = item.dt_txt.slice(11, 13);
    if (!seen.has(date) && hour === '12') {
      seen.add(date);
      forecast.push({
        date, dayLabel: DAYS_[new Date(item.dt * 1000).getUTCDay()] ?? '',
        icon: item.weather[0]!.icon, description: item.weather[0]!.description,
        tempMin: item.main.temp_min, tempMax: item.main.temp_max,
      });
      if (forecast.length === 4) break;
    }
  }
  // Fill gaps with first occurrence of unseen days
  if (forecast.length < 4) {
    const ex = new Set([todayStr, ...forecast.map((f) => f.date)]);
    for (const item of d.list) {
      const date = item.dt_txt.slice(0, 10);
      if (!ex.has(date)) {
        ex.add(date);
        forecast.push({
          date, dayLabel: DAYS_[new Date(item.dt * 1000).getUTCDay()] ?? '',
          icon: item.weather[0]!.icon, description: item.weather[0]!.description,
          tempMin: item.main.temp_min, tempMax: item.main.temp_max,
        });
        if (forecast.length === 4) break;
      }
    }
  }

  return {
    current, forecast,
    microclimate: interpretMicroclimate(current),
    localTime:    fmtUnix(Math.floor(Date.now() / 1000), d.city.timezone),
    fetchedAt:    Date.now(),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getCTWeather(): Promise<CapeWeather> {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) return _cache;
  const fresh = await fetchOWM();
  _cache = fresh;
  return fresh;
}

/** Gemini-powered narrative — returns '' on any failure, never throws. */
export async function getWeatherNarrative(weather: CapeWeather): Promise<string> {
  if (!isGeminiConfigured()) return '';
  const { current, microclimate } = weather;
  const prompt = `You are a Cape Town weather narrator for a luxury tourism platform. Write ONE conversational sentence (max 22 words) telling a visitor what stepping outside in Cape Town feels like right now. Be specific, human, practical.

Conditions: ${kToC(current.temp)}°C (feels ${kToC(current.feelsLike)}°C), ${current.description}, ${windDir(current.windDeg)} wind ${mpsToKmh(current.windSpeed)} km/h, humidity ${current.humidity}%
Microclimate: ${microclimate.headline}

Respond with ONLY the sentence. No quotes.`;
  try { return (await generateText(prompt)).trim(); }
  catch { return ''; }
}
