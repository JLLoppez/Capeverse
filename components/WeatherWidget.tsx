'use client';

/**
 * components/WeatherWidget.tsx
 *
 * Live Cape Town conditions strip — ATMOS integration.
 *
 * Usage:
 *   <WeatherWidget />          — full panel (homepage, below hero)
 *   <WeatherWidget compact />  — narrative + badge only (TripPlanner, above form)
 */

import { useEffect, useState } from 'react';

// Mirror types from lib/weather.ts — no server import in client bundle
interface WeatherCurrent {
  temp: number; feelsLike: number; humidity: number;
  description: string; icon: string; windSpeed: number; windDeg: number; clouds: number;
}
interface ForecastDay {
  dayLabel: string; icon: string; description: string; tempMin: number; tempMax: number; date: string;
}
interface MicroclimateContext {
  condition: 'cape-doctor' | 'cold-front' | 'berg-wind' | 'ideal' | 'standard';
  tableMountain:    { open: boolean;     note: string };
  atlanticSeaboard: { suitable: boolean; note: string };
  falseBay:         { suitable: boolean; note: string };
  chapmansPeak:     { suitable: boolean; note: string };
  outdoorDining:    { suitable: boolean; note: string };
  headline:         string;
}
interface WeatherData {
  current: WeatherCurrent; forecast: ForecastDay[]; microclimate: MicroclimateContext;
  localTime: string; narrative: string;
}

const kToC = (k: number) => Math.round(k - 273.15);
const kmh  = (s: number) => Math.round(s * 3.6);

const ICONS: Record<string, string> = {
  '01d':'☀️','01n':'🌙','02d':'🌤','02n':'☁️','03d':'☁️','03n':'☁️','04d':'🌥','04n':'☁️',
  '09d':'🌧','09n':'🌧','10d':'🌦','10n':'🌧','11d':'⛈','11n':'⛈','13d':'❄️','13n':'❄️','50d':'🌫','50n':'🌫',
};
const wi = (code: string) => ICONS[code] ?? '🌤';

const CONDITION_BADGES: Record<string, { label: string; color: string }> = {
  'cape-doctor': { label: 'Cape Doctor',  color: '#b45309' },
  'cold-front':  { label: 'Cold Front',   color: '#1d4ed8' },
  'berg-wind':   { label: 'Berg Wind',    color: '#c2410c' },
  'ideal':       { label: 'Ideal Day',    color: '#15803d' },
  'standard':    { label: 'Clear Day',    color: '#4b5563' },
};

const LOCATIONS = [
  { key: 'tableMountain'    as const, label: 'Table Mountain',   icon: '🏔' },
  { key: 'atlanticSeaboard' as const, label: 'Atlantic Seaboard', icon: '🌊' },
  { key: 'falseBay'         as const, label: 'False Bay',         icon: '🐧' },
  { key: 'chapmansPeak'     as const, label: "Chapman's Peak",    icon: '🛣' },
  { key: 'outdoorDining'    as const, label: 'Outdoor Dining',    icon: '🍽' },
];

export function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const [data,    setData]    = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/weather/cape-town')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: WeatherData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ height: compact ? 58 : 220, background: 'var(--bg, #f9fafb)', borderRadius: 12, animation: 'pulse 1.5s ease infinite' }} />;
  if (!data)   return null;

  const { current, forecast, microclimate, localTime, narrative } = data;
  const badge = CONDITION_BADGES[microclimate.condition] ?? CONDITION_BADGES['standard']!;

  if (compact) return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg,#f9fafb)', border:'1px solid var(--line,#e5e7eb)', borderRadius:12, padding:'12px 18px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:28 }}>{wi(current.icon)}</span>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--ink,#111827)' }}>{kToC(current.temp)}°C</div>
          <div style={{ fontSize:12, color:'var(--muted,#6b7280)', textTransform:'capitalize' }}>{current.description}</div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
        {narrative && <p style={{ fontSize:13, fontStyle:'italic', color:'var(--muted,#4b5563)', textAlign:'right', maxWidth:300, margin:0, lineHeight:1.4 }}>{narrative}</p>}
        <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:100, fontSize:11, fontWeight:600, background:`${badge.color}18`, color:badge.color, border:`1px solid ${badge.color}30` }}>{badge.label}</span>
      </div>
    </div>
  );

  return (
    <div style={{ background:'var(--bg,#fff)', border:'1px solid var(--line,#e5e7eb)', borderRadius:16, padding:'24px 28px', marginBottom:32 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted,#6b7280)' }}>Live conditions · Cape Town</span>
          {localTime && <span style={{ fontSize:11, color:'var(--muted,#9ca3af)' }}>{localTime} local</span>}
        </div>
        <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:100, fontSize:11, fontWeight:600, background:`${badge.color}14`, color:badge.color, border:`1px solid ${badge.color}28` }}>{badge.label}</span>
      </div>

      {/* Main row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:48 }}>{wi(current.icon)}</span>
          <div>
            <div style={{ fontSize:44, fontWeight:700, lineHeight:1, color:'var(--ink,#111827)', fontFamily:'Georgia,serif' }}>{kToC(current.temp)}<sup style={{ fontSize:'0.4em', verticalAlign:'super', fontWeight:400 }}>°C</sup></div>
            <div style={{ fontSize:13, color:'var(--muted,#6b7280)', textTransform:'capitalize', marginTop:3 }}>{current.description}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          {[{l:'Feels like',v:`${kToC(current.feelsLike)}°C`},{l:'Humidity',v:`${current.humidity}%`},{l:'Wind',v:`${kmh(current.windSpeed)} km/h`}].map((s) => (
            <div key={s.l} style={{ display:'flex', flexDirection:'column', gap:3, textAlign:'right' }}>
              <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted,#9ca3af)' }}>{s.l}</span>
              <span style={{ fontSize:15, fontWeight:600, color:'var(--ink,#374151)' }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Narrative */}
      {narrative && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'var(--bg,#f9fafb)', border:'1px solid var(--line,#f3f4f6)', borderLeft:'2px solid #c2410c', borderRadius:'0 8px 8px 0', padding:'10px 14px', marginBottom:20 }}>
          <span style={{ color:'#c2410c', fontSize:14, flexShrink:0 }}>✦</span>
          <p style={{ fontSize:14, fontStyle:'italic', color:'var(--ink,#374151)', lineHeight:1.55, flex:1, margin:0 }}>{narrative}</p>
          <span style={{ fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--muted,#9ca3af)', flexShrink:0 }}>Gemini</span>
        </div>
      )}

      {/* Microclimate grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {LOCATIONS.map(({ key, label, icon }) => {
          const entry = microclimate[key] as { open?: boolean; suitable?: boolean; note: string };
          const ok = entry.open ?? entry.suitable ?? false;
          return (
            <div key={key} style={{ background:'var(--bg,#f9fafb)', border:'1px solid var(--line,#f3f4f6)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ fontSize:10, fontWeight:600, color:'var(--ink,#374151)', letterSpacing:'0.04em', flex:1 }}>{label}</span>
                <span style={{ width:7, height:7, borderRadius:'50%', background:ok ? '#16a34a' : '#dc2626', flexShrink:0, display:'inline-block' }} />
              </div>
              <p style={{ fontSize:11, color:'var(--muted,#6b7280)', lineHeight:1.4, margin:0 }}>{entry.note}</p>
            </div>
          );
        })}
      </div>

      {/* Forecast strip */}
      {forecast.length > 0 && (
        <div style={{ display:'flex', gap:8, paddingTop:16, borderTop:'1px solid var(--line,#f3f4f6)' }}>
          {forecast.map((day) => (
            <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 0', background:'var(--bg,#f9fafb)', borderRadius:10 }}>
              <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted,#9ca3af)' }}>{day.dayLabel}</span>
              <span style={{ fontSize:22 }}>{wi(day.icon)}</span>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--ink,#111827)' }}>{kToC(day.tempMax)}°</span>
              <span style={{ fontSize:11, color:'var(--muted,#9ca3af)' }}>{kToC(day.tempMin)}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
