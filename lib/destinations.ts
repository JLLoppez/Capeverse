/**
 * Destination registry — the foundation for multi-city expansion.
 *
 * When a new destination is added here, the AI system prompt, scoring engine,
 * and admin panel all pick it up automatically. No hardcoded city names elsewhere.
 *
 * To add a destination:
 *   1. Add an entry to DESTINATIONS below.
 *   2. Seed attractions with matching `region` slugs.
 *   3. Set NEXT_PUBLIC_ACTIVE_DESTINATION in .env (or use 'all' for a multi-city platform).
 */

export type DestinationId = 'cape-town' | 'garden-route' | 'johannesburg' | 'kruger';

export type Destination = {
  id: DestinationId;
  name: string;
  country: string;
  timezone: string;
  currency: string;
  bestMonths: string;
  regionClusters: Record<string, string>; // region name → cluster key
  systemPromptContext: string;            // injected into AI system prompt
};

export const DESTINATIONS: Record<DestinationId, Destination> = {
  'cape-town': {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    bestMonths: 'October–April (summer). May–September can be windy but uncrowded.',
    regionClusters: {
      'Cape Peninsula':    'peninsula',
      'Simons Town':       'peninsula',
      'Atlantic Seaboard': 'peninsula',
      'Cape Winelands':    'winelands',
      'Winelands':         'winelands',
      'City Bowl':         'city',
      'Cape Town CBD':     'city',
      'Newlands':          'city',
      'Gardens':           'city',
    },
    systemPromptContext: `
Cape Town expertise:
- Best months: October–April (summer). May–September can be windy but uncrowded.
- Table Mountain cable car is weather-dependent — mornings on clear days are best.
- Cape Point and Boulders Beach are both on the Peninsula — always cluster them on the same day.
- Stellenbosch and Franschhoek are both Winelands — pair them for a single day wine route.
- Private tour advantage: no shared-coach crowds, flexible timing, local guide relationships.
    `.trim(),
  },

  'garden-route': {
    id: 'garden-route',
    name: 'Garden Route',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    bestMonths: 'Year-round. December–February for whale-watching. April–May for hiking.',
    regionClusters: {
      'Knysna':     'knysna',
      'Wilderness': 'wilderness',
      'Mossel Bay': 'mossel-bay',
      'Plettenberg Bay': 'plett',
      'Tsitsikamma': 'tsitsikamma',
    },
    systemPromptContext: `
Garden Route expertise:
- Best for: scenic drives, whale-watching, hiking, and adventure activities.
- Knysna Heads and Featherbed Nature Reserve are the highlights of the central stretch.
- Tsitsikamma is a full day — Storms River Mouth and the suspension bridge are unmissable.
- Self-drive is popular but a private guide adds wildlife knowledge significantly.
    `.trim(),
  },

  'johannesburg': {
    id: 'johannesburg',
    name: 'Johannesburg',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    bestMonths: 'April–September (dry winter). Avoid December–February for outdoor activities.',
    regionClusters: {
      'Sandton':      'sandton',
      'Maboneng':     'inner-city',
      'Soweto':       'soweto',
      'Cradle':       'cradle',
      'Magaliesberg': 'magaliesberg',
    },
    systemPromptContext: `
Johannesburg expertise:
- Apartheid Museum and Soweto are essential for understanding South African history.
- The Cradle of Humankind (1.5hr from JHB) pairs well with a Magaliesberg overnight.
- Sandton is the commercial hub; Maboneng is the arts district.
    `.trim(),
  },

  'kruger': {
    id: 'kruger',
    name: 'Kruger & Safari',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    bestMonths: 'May–September (dry season). Animals concentrate around water sources.',
    regionClusters: {
      'Southern Kruger':  'southern-kruger',
      'Central Kruger':   'central-kruger',
      'Northern Kruger':  'northern-kruger',
      'Sabi Sand':        'sabi-sand',
      'Timbavati':        'timbavati',
    },
    systemPromptContext: `
Kruger & Safari expertise:
- Dry season (May–Sep) is best: lower vegetation and animals congregate near rivers.
- Early morning and late afternoon game drives produce the best sightings.
- Big 5 sightings most reliable in the south and around Satara in the centre.
- Private reserves (Sabi Sand, Timbavati) offer off-road driving and walking safaris.
    `.trim(),
  },
};

export function getActiveDestination(): Destination {
  const id = (process.env.NEXT_PUBLIC_ACTIVE_DESTINATION ?? 'cape-town') as DestinationId;
  return DESTINATIONS[id] ?? DESTINATIONS['cape-town'];
}

export function getAllDestinations(): Destination[] {
  return Object.values(DESTINATIONS);
}
