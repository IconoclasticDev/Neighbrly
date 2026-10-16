import { AREAS, DEFAULT_WEIGHTS, score, report, band, tone, Area, Weights } from './core';

export type BasemapStyleId = 'positron' | 'voyager' | 'local';

export type CartoCredentialStatus =
  | 'unconfigured'
  | 'platform_token_incompatible'
  | 'basemap_key_configured';

export interface CartoCredentialCheck {
  status: CartoCredentialStatus;
  compatible: boolean;
  sanitizedKey: string | null;
  providerLabel: string;
  diagnostic: string;
  securityNote: string;
}

const PLACEHOLDER_KEYS = new Set([
  '',
  'your_key',
  'your_carto_basemap_key_here',
  'your_carto_android_basemap_key_here',
  'replace_with_your_carto_basemap_key',
  'placeholder',
  'changeme',
  'none',
  'null',
  'undefined',
  'todo',
]);

export function inspectCartoCredential(rawKey?: string | null): CartoCredentialCheck {
  const securityNote =
    'Browser and WebView tile keys are visible in network requests. Restrict keys by allowed HTTP referrer/app origin and quota, and never commit live keys to Git.';
  const trimmed = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (!trimmed || PLACEHOLDER_KEYS.has(trimmed.toLowerCase())) {
    return {
      status: 'unconfigured',
      compatible: false,
      sanitizedKey: null,
      providerLabel: 'Local Boundary Mode (No CARTO Basemaps key configured)',
      diagnostic:
        'No active VITE_CARTO_BASEMAP_KEY / EXPO_PUBLIC_CARTO_BASEMAP_KEY configured. Rendering bundled Mumbai ward boundaries and OpenStreetMap overlays offline.',
      securityNote,
    };
  }

  // Detect CARTO v3 Cloud Native Platform JWT access tokens (eyJ... with 3 dot-separated segments)
  // or OAuth / Bearer tokens or full URLs — these are NOT interchangeable with CARTO Basemaps tile keys.
  const isJwt = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmed);
  const isPlatformToken =
    isJwt ||
    /^bearer\s+/i.test(trimmed) ||
    /^carto_(pat|oauth|platform)_/i.test(trimmed) ||
    /^https?:\/\//i.test(trimmed);

  if (isPlatformToken) {
    return {
      status: 'platform_token_incompatible',
      compatible: false,
      sanitizedKey: null,
      providerLabel: 'Incompatible Credential (CARTO Platform Token detected)',
      diagnostic:
        'Detected a CARTO Platform API token (JWT/OAuth) rather than a CARTO Basemaps raster tile key. Platform API tokens and Basemaps tile keys are not interchangeable. Falling back to local boundary rendering.',
      securityNote,
    };
  }

  // Validate character set and length for a CARTO Basemaps key
  if (!/^[A-Za-z0-9._-]{6,128}$/.test(trimmed)) {
    return {
      status: 'unconfigured',
      compatible: false,
      sanitizedKey: null,
      providerLabel: 'Invalid Key Format — Local Boundary Fallback',
      diagnostic:
        'Configured key contains unsupported characters or invalid length. Falling back to bundled Mumbai boundaries.',
      securityNote,
    };
  }

  const hasCb1Prefix = /^cb1_[A-Za-z0-9_]{8,120}$/.test(trimmed);
  return {
    status: 'basemap_key_configured',
    compatible: true,
    sanitizedKey: trimmed,
    providerLabel: hasCb1Prefix
      ? 'CARTO Basemaps Service (cb1_ Basemap Key verified)'
      : 'CARTO Basemaps Service (Key verified)',
    diagnostic: hasCb1Prefix
      ? 'Verified CARTO Basemaps (cb1_) raster tile credential. Positron (light) and Voyager (detailed) tile layers are active with offline fallback.'
      : 'Compatible CARTO Basemaps key detected. Positron (light) and Voyager (detailed) raster tile layers are enabled with automatic offline fallback.',
    securityNote,
  };
}

export const DEFAULT_BASEMAP_STYLE: BasemapStyleId = 'positron';

export interface BasemapStyleDef {
  id: BasemapStyleId;
  label: string;
  shortLabel: string;
  description: string;
  requiresKey: boolean;
  template: string | null;
}

export const CARTO_BASEMAP_STYLES: BasemapStyleDef[] = [
  {
    id: 'positron',
    label: 'CARTO Positron (Light)',
    shortLabel: 'Positron',
    description: 'Clean, light CARTO basemap designed to keep neighbourhood boundaries and overlays legible.',
    requiresKey: true,
    template: 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key={key}',
  },
  {
    id: 'voyager',
    label: 'CARTO Voyager (Detailed)',
    shortLabel: 'Voyager',
    description: 'Detailed CARTO street, transit and landmark basemap for neighbourhood context.',
    requiresKey: true,
    template: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key={key}',
  },
  {
    id: 'local',
    label: 'Local Boundaries (Offline)',
    shortLabel: 'Local offline',
    description: 'Bundled Mumbai administrative ward boundaries and local OpenStreetMap overlays with zero tile requests.',
    requiresKey: false,
    template: null,
  },
];

export const CARTO_OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

export const BOUNDARY_ATTRIBUTION =
  'Boundaries: <a href="https://github.com/sanjanakrishnan/mumbai_spatial_data" target="_blank" rel="noreferrer">Sanjana &middot; CC BY 4.0</a> (simplified)';

export function buildCartoTileUrl(style: BasemapStyleId, rawKey?: string | null): string | null {
  if (style === 'local') return null;
  const check = inspectCartoCredential(rawKey);
  if (!check.compatible || !check.sanitizedKey) return null;
  const encodedKey = encodeURIComponent(check.sanitizedKey);
  if (style === 'positron') {
    return `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${encodedKey}`;
  }
  if (style === 'voyager') {
    return `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodedKey}`;
  }
  return null;
}

// --- Essential Map Layers (Layers A through F) ---
export type MapLayerId =
  | 'boundaries'
  | 'transport'
  | 'education'
  | 'healthcare'
  | 'green'
  | 'amenities';

export type EnabledLayers = Record<MapLayerId, boolean>;

export const DEFAULT_ENABLED_LAYERS: EnabledLayers = {
  boundaries: true,
  transport: true,
  education: true,
  healthcare: true,
  green: true,
  amenities: false, // Disabled by default to prevent map clutter per specification
};

export interface MapLayerDef {
  id: MapLayerId;
  code: string;
  label: string;
  shortLabel: string;
  defaultEnabled: boolean;
  color: string;
  badgeBg: string;
  symbol: string;
  description: string;
  disclaimer: string;
  subcategories: { id: string; label: string }[];
  source: string;
}

export const MAP_LAYERS: MapLayerDef[] = [
  {
    id: 'boundaries',
    code: 'Layer A',
    label: 'Locality boundaries & base geography',
    shortLabel: 'Boundaries & base',
    defaultEnabled: true,
    color: '#1F5C42',
    badgeBg: '#E3F1E8',
    symbol: '⬡',
    description: '24 BMC administrative wards, demo report localities, arterial roads, rail lines, lakes and coastline.',
    disclaimer: 'Administrative ward boundaries are simplified reference outlines and do not imply verified report coverage.',
    subcategories: [
      { id: 'all', label: 'All base geography' },
      { id: 'road', label: 'Major roads' },
      { id: 'rail_line', label: 'Railway corridors' },
      { id: 'waterway', label: 'Lakes & coastline' },
      { id: 'landmark', label: 'Major landmarks' },
    ],
    source: 'Sanjana Krishnan (CC BY 4.0) & OpenStreetMap contributors (ODbL)',
  },
  {
    id: 'transport',
    code: 'Layer B',
    label: 'Public transport',
    shortLabel: 'Transport',
    defaultEnabled: true,
    color: '#2F7D5B',
    badgeBg: '#E3F1E8',
    symbol: '🚆',
    description: 'Mumbai suburban rail stations, metro stations, bus terminals, bus stops and major interchanges.',
    disclaimer: 'Station coordinates come from OpenStreetMap. Neighbrly never invents train schedules, service frequency or travel times from coordinates.',
    subcategories: [
      { id: 'all', label: 'All transport' },
      { id: 'rail', label: 'Local train stations' },
      { id: 'metro', label: 'Metro stations' },
      { id: 'bus', label: 'Bus stops & terminals' },
      { id: 'interchange', label: 'Major interchanges' },
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'education',
    code: 'Layer C',
    label: 'Education',
    shortLabel: 'Education',
    defaultEnabled: true,
    color: '#B87314',
    badgeBg: '#FCF0CF',
    symbol: '🎓',
    description: 'Mapped schools, junior colleges, degree colleges and universities.',
    disclaimer: 'Map presence shows geographic location only. It does not indicate school quality, board outcomes, fees or admission availability.',
    subcategories: [
      { id: 'all', label: 'All education' },
      { id: 'school', label: 'Schools' },
      { id: 'college', label: 'Colleges' },
      { id: 'university', label: 'Universities & institutes' },
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'healthcare',
    code: 'Layer D',
    label: 'Healthcare',
    shortLabel: 'Healthcare',
    defaultEnabled: true,
    color: '#D9553A',
    badgeBg: '#F8E1DB',
    symbol: '✚',
    description: 'Mapped public and private hospitals, clinics and pharmacies.',
    disclaimer: 'Map presence does not confirm 24-hour emergency availability, clinical quality rating or current operational status.',
    subcategories: [
      { id: 'all', label: 'All healthcare' },
      { id: 'hospital', label: 'Hospitals' },
      { id: 'clinic', label: 'Clinics' },
      { id: 'pharmacy', label: 'Pharmacies' },
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'green',
    code: 'Layer E',
    label: 'Green spaces',
    shortLabel: 'Green spaces',
    defaultEnabled: true,
    color: '#4E9A66',
    badgeBg: '#E7F0E4',
    symbol: '🌳',
    description: 'Mapped parks, public gardens, playgrounds, sports grounds and nature reserves with polygon footprints.',
    disclaimer: 'Mapped park polygons and counts do not equate to a validated environmental quality or tree-canopy score.',
    subcategories: [
      { id: 'all', label: 'All green spaces' },
      { id: 'park', label: 'Parks & gardens' },
      { id: 'playground', label: 'Playgrounds' },
      { id: 'sports_ground', label: 'Sports & recreation grounds' },
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'amenities',
    code: 'Layer F',
    label: 'Everyday amenities (Optional)',
    shortLabel: 'Amenities',
    defaultEnabled: false,
    color: '#6B6B63',
    badgeBg: '#ECECE4',
    symbol: '🏪',
    description: 'Optional supermarkets, municipal markets, banks/ATMs, restaurants/cafés and public parking.',
    disclaimer: 'Disabled by default to prevent visual clutter. Presence on map does not verify operating hours or service quality.',
    subcategories: [
      { id: 'all', label: 'All everyday amenities' },
      { id: 'supermarket', label: 'Supermarkets & grocery' },
      { id: 'market', label: 'Markets' },
      { id: 'bank_atm', label: 'Banks & ATMs' },
      { id: 'food_cafe', label: 'Restaurants & cafés' },
      { id: 'parking', label: 'Public parking' },
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
];

// --- Mumbai 24 BMC Administrative Wards Metadata ---
export interface WardMetadata {
  code: string;
  gid: number;
  title: string;
  localities: string;
  zone: string;
  lat: number;
  lng: number;
  nearestDemoId: 'a' | 'b' | 'c';
  demoAreaId: 'a' | 'b' | 'c' | null;
}

export const MUMBAI_WARDS_META: WardMetadata[] = [
  { code: 'A', gid: 1, title: 'Ward A · Colaba, Fort & Churchgate', localities: 'Colaba, Cuffe Parade, Fort, Nariman Point, Churchgate', zone: 'Island City South', lat: 18.926, lng: 72.831, nearestDemoId: 'c', demoAreaId: null },
  { code: 'B', gid: 2, title: 'Ward B · Dongri & Masjid Bunder', localities: 'Dongri, Masjid Bunder, Mohammed Ali Road, Dockyard', zone: 'Island City South', lat: 18.958, lng: 72.839, nearestDemoId: 'c', demoAreaId: null },
  { code: 'C', gid: 3, title: 'Ward C · Marine Lines & Bhuleshwar', localities: 'Marine Lines, Kalbadevi, Bhuleshwar, Chira Bazaar', zone: 'Island City South', lat: 18.948, lng: 72.828, nearestDemoId: 'c', demoAreaId: null },
  { code: 'D', gid: 4, title: 'Ward D · Malabar Hill, Grant Road & Tardeo', localities: 'Malabar Hill, Walkeshwar, Breach Candy, Tardeo, Girgaon', zone: 'Island City South', lat: 18.963, lng: 72.809, nearestDemoId: 'c', demoAreaId: null },
  { code: 'E', gid: 5, title: 'Ward E · Byculla, Mazgaon & Nagpada', localities: 'Byculla, Mazgaon, Reay Road, Chinchpokli, Kamathipura', zone: 'Island City Central', lat: 18.977, lng: 72.836, nearestDemoId: 'c', demoAreaId: null },
  { code: 'F/S', gid: 6, title: 'Ward F/S · Parel & Sewri', localities: 'Parel, Lalbaug, Sewri, Cotton Green, Naigaon', zone: 'Island City Central', lat: 19.003, lng: 72.848, nearestDemoId: 'c', demoAreaId: null },
  { code: 'G/S', gid: 7, title: 'Ward G/S · Worli & Lower Parel', localities: 'Worli, Lower Parel, Prabhadevi, Mahalaxmi, Elphinstone', zone: 'Island City Central', lat: 19.002, lng: 72.825, nearestDemoId: 'c', demoAreaId: null },
  { code: 'F/N', gid: 8, title: 'Ward F/N · Matunga, Sion & Wadala', localities: 'Matunga East, Sion, Wadala, Antop Hill, King Circle', zone: 'Island City North', lat: 19.029, lng: 72.863, nearestDemoId: 'c', demoAreaId: null },
  { code: 'G/N', gid: 9, title: 'Ward G/N · Dadar, Mahim & Matunga West', localities: 'Dadar West, Shivaji Park, Mahim, Matunga West, Dharavi', zone: 'Island City North', lat: 19.028, lng: 72.847, nearestDemoId: 'c', demoAreaId: 'c' },
  { code: 'N', gid: 10, title: 'Ward N · Ghatkopar & Vikhroli', localities: 'Ghatkopar East, Ghatkopar West, Vidyavihar, Vikhroli', zone: 'Eastern Suburbs', lat: 19.092, lng: 72.912, nearestDemoId: 'b', demoAreaId: null },
  { code: 'R/C', gid: 11, title: 'Ward R/C · Borivali', localities: 'Borivali West, Borivali East, Gorai, National Park', zone: 'Western Suburbs North', lat: 19.229, lng: 72.865, nearestDemoId: 'b', demoAreaId: null },
  { code: 'S', gid: 12, title: 'Ward S · Bhandup, Powai & Kanjurmarg', localities: 'Powai, Bhandup, Kanjurmarg, Vikhroli West, Nahur', zone: 'Eastern Suburbs', lat: 19.132, lng: 72.918, nearestDemoId: 'b', demoAreaId: 'b' },
  { code: 'T', gid: 13, title: 'Ward T · Mulund', localities: 'Mulund West, Mulund East, Nahur East', zone: 'Eastern Suburbs', lat: 19.172, lng: 72.948, nearestDemoId: 'b', demoAreaId: null },
  { code: 'K/W', gid: 14, title: 'Ward K/W · Andheri West, Juhu & Versova', localities: 'Andheri West, Juhu, Versova, Oshiwara, Lokhandwala', zone: 'Western Suburbs', lat: 19.129, lng: 72.829, nearestDemoId: 'b', demoAreaId: null },
  { code: 'R/N', gid: 15, title: 'Ward R/N · Dahisar', localities: 'Dahisar East, Dahisar West, Mandapeshwar', zone: 'Western Suburbs North', lat: 19.254, lng: 72.859, nearestDemoId: 'b', demoAreaId: null },
  { code: 'M/E', gid: 16, title: 'Ward M/E · Govandi, Mankhurd & Deonar', localities: 'Deonar, Govandi, Mankhurd, Trombay, Shivaji Nagar', zone: 'Eastern Suburbs', lat: 19.051, lng: 72.927, nearestDemoId: 'a', demoAreaId: null },
  { code: 'M/W', gid: 17, title: 'Ward M/W · Chembur & Tilak Nagar', localities: 'Chembur, Tilak Nagar, Sindhi Society, Diamond Garden, Mahul', zone: 'Eastern Suburbs', lat: 19.056, lng: 72.897, nearestDemoId: 'a', demoAreaId: 'a' },
  { code: 'H/E', gid: 18, title: 'Ward H/E · Bandra East, Khar East & Santacruz East', localities: 'Bandra East, BKC, Kalina, Vakola, Santacruz East', zone: 'Western Suburbs', lat: 19.077, lng: 72.855, nearestDemoId: 'c', demoAreaId: null },
  { code: 'K/E', gid: 19, title: 'Ward K/E · Andheri East, Jogeshwari East & Vile Parle East', localities: 'Andheri East, Chakala, Marol, MIDC, Vile Parle East', zone: 'Western Suburbs', lat: 19.115, lng: 72.866, nearestDemoId: 'b', demoAreaId: null },
  { code: 'P/S', gid: 20, title: 'Ward P/S · Goregaon', localities: 'Goregaon West, Goregaon East, Aarey Colony, Film City', zone: 'Western Suburbs', lat: 19.163, lng: 72.857, nearestDemoId: 'b', demoAreaId: null },
  { code: 'P/N', gid: 21, title: 'Ward P/N · Malad', localities: 'Malad West, Malad East, Madh, Marve, Dindoshi', zone: 'Western Suburbs North', lat: 19.188, lng: 72.842, nearestDemoId: 'b', demoAreaId: null },
  { code: 'R/S', gid: 22, title: 'Ward R/S · Kandivali', localities: 'Kandivali West, Kandivali East, Charkop, Thakur Village', zone: 'Western Suburbs North', lat: 19.205, lng: 72.852, nearestDemoId: 'b', demoAreaId: null },
  { code: 'H/W', gid: 23, title: 'Ward H/W · Bandra West, Khar West & Santacruz West', localities: 'Bandra West, Pali Hill, Carter Road, Khar West, Santacruz West', zone: 'Western Suburbs', lat: 19.065, lng: 72.831, nearestDemoId: 'c', demoAreaId: null },
  { code: 'L', gid: 24, title: 'Ward L · Kurla & Saki Naka', localities: 'Kurla West, Kurla East, Saki Naka, Chunabhatti, Chandivali', zone: 'Eastern Suburbs', lat: 19.085, lng: 72.883, nearestDemoId: 'a', demoAreaId: null },
];

// --- Three-Tier Neighbourhood Intelligence Status ---
export type IntelligenceTier =
  | 'geometry_only'
  | 'demo_report_available'
  | 'verified_evidence';

export interface LocalityIntelligenceStatus {
  id: string;
  name: string;
  classification: 'demo_report_locality' | 'bmc_administrative_ward';
  wardCode: string;
  localitiesSummary: string;
  status: IntelligenceTier;
  statusLabel: string;
  geometryExists: boolean;
  reportAvailable: boolean;
  evidenceVerified: boolean;
  demo: boolean;
  score: number | null;
  bandLabel: string;
  toneClass: string;
  lo: number | null;
  hi: number | null;
  used: number | null;
  total: number;
  coverage: number | null;
  missingMetrics: string[];
  nearestDemoId: 'a' | 'b' | 'c';
  lat: number;
  lng: number;
  limitationsNotice: string;
}

const DEMO_WARD_MAP: Record<string, { wardCode: string; localities: string }> = {
  a: { wardCode: 'M/W', localities: 'Eastern suburb · Chembur / Tilak Nagar rail corridor (illustrative)' },
  b: { wardCode: 'S', localities: 'Lakeside · Powai / Kanjurmarg / Bhandup corridor (illustrative)' },
  c: { wardCode: 'G/N', localities: 'Central neighbourhood · Dadar / Matunga / Sion corridor (illustrative)' },
};

export function getLocalityIntelligenceStatus(
  idOrWardCode: string,
  weights: Weights = DEFAULT_WEIGHTS
): LocalityIntelligenceStatus {
  const demoArea = AREAS.find((a) => a.id === (idOrWardCode || '').trim());
  if (demoArea) {
    const s = score(demoArea, weights);
    const r = report(demoArea, weights);
    const missingMetrics = r.ledger.filter((l) => l.value === null).map((l) => l.label);
    const mapInfo = DEMO_WARD_MAP[demoArea.id] || { wardCode: 'M/W', localities: demoArea.tagline };
    return {
      id: demoArea.id,
      name: demoArea.name,
      classification: 'demo_report_locality',
      wardCode: mapInfo.wardCode,
      localitiesSummary: `${demoArea.tagline} · BMC Ward ${mapInfo.wardCode}`,
      status: 'demo_report_available',
      statusLabel: 'Demo report available · Unverified fixture evidence',
      geometryExists: true,
      reportAvailable: true,
      evidenceVerified: false,
      demo: true,
      score: s.score,
      bandLabel: band(s.score),
      toneClass: tone(s.score),
      lo: s.lo,
      hi: s.hi,
      used: s.used,
      total: s.total,
      coverage: s.coverage,
      missingMetrics,
      nearestDemoId: demoArea.id as 'a' | 'b' | 'c',
      lat: demoArea.lat,
      lng: demoArea.lng,
      limitationsNotice:
        missingMetrics.length > 0
          ? `DEMO DATA: ${missingMetrics.join(', ')} has no data yet and widens the sensitivity bounds (${s.lo}–${s.hi}). Supporting evidence is illustrative and not field-verified.`
          : `DEMO DATA: All 7 metrics are present in this illustrative fixture (${s.lo}–${s.hi}), but observations are invented and not field-verified.`,
    };
  }

  const normalized = idOrWardCode.trim().toUpperCase();
  const ward =
    MUMBAI_WARDS_META.find((w) => w.code.toUpperCase() === normalized) ||
    MUMBAI_WARDS_META.find((w) => w.title.toUpperCase().includes(normalized)) ||
    MUMBAI_WARDS_META[0];

  return {
    id: ward.code,
    name: ward.title,
    classification: 'bmc_administrative_ward',
    wardCode: ward.code,
    localitiesSummary: `${ward.localities} (${ward.zone})`,
    status: 'geometry_only',
    statusLabel: 'Geographic boundary & OSM POIs only · No neighbourhood report yet',
    geometryExists: true,
    reportAvailable: false,
    evidenceVerified: false,
    demo: false,
    score: null,
    bandLabel: 'No report coverage',
    toneClass: 'missing',
    lo: null,
    hi: null,
    used: null,
    total: 7,
    coverage: null,
    missingMetrics: ['Air quality', 'Transit access', 'Schools nearby', 'Safety proxies', 'Builder delivery record', 'Green cover', 'Price value'],
    nearestDemoId: ward.nearestDemoId,
    lat: ward.lat,
    lng: ward.lng,
    limitationsNotice:
      'Administrative boundary and OpenStreetMap facilities exist for this ward, but Neighbrly has not yet compiled a 7-metric neighbourhood report or verified evidence here. We never colour or score unmeasured areas.',
  };
}

// --- Base Geography Features (Layer A: Major Roads, Railway Lines, Waterways, Landmarks) ---
export interface BaseGeoFeature {
  id: string;
  name: string;
  subcategory: 'road' | 'rail_line' | 'waterway' | 'landmark';
  geometryType: 'line' | 'polygon' | 'point';
  coordinates: [number, number][] | [number, number];
  wardContext: string;
  detail: string;
  source: string;
}

export const BASE_GEOGRAPHY_FEATURES: BaseGeoFeature[] = [
  {
    id: 'rail-central',
    name: 'Central Railway Suburban Corridor',
    subcategory: 'rail_line',
    geometryType: 'line',
    coordinates: [
      [18.940, 72.835],
      [18.976, 72.833],
      [19.018, 72.843],
      [19.043, 72.863],
      [19.066, 72.879],
      [19.086, 72.908],
      [19.119, 72.928],
      [19.146, 72.937],
      [19.172, 72.956],
    ],
    wardContext: 'Wards A, E, F/N, G/N, L, N, S, T',
    detail: 'Primary suburban rail spine connecting CSMT, Dadar, Kurla, Ghatkopar, Kanjurmarg, Bhandup and Mulund.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'rail-harbour',
    name: 'Harbour Line Suburban Corridor',
    subcategory: 'rail_line',
    geometryType: 'line',
    coordinates: [
      [18.940, 72.835],
      [18.988, 72.844],
      [19.016, 72.859],
      [19.042, 72.865],
      [19.063, 72.899],
      [19.055, 72.915],
      [19.048, 72.932],
    ],
    wardContext: 'Wards A, E, F/S, F/N, M/W, M/E',
    detail: 'Suburban rail line serving Wadala, GTB Nagar, Chunabhatti, Tilak Nagar, Chembur, Govandi and Mankhurd.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'rail-western',
    name: 'Western Railway Suburban Corridor',
    subcategory: 'rail_line',
    geometryType: 'line',
    coordinates: [
      [18.935, 72.827],
      [18.969, 72.819],
      [19.018, 72.842],
      [19.054, 72.840],
      [19.082, 72.841],
      [19.119, 72.846],
      [19.165, 72.849],
      [19.205, 72.851],
      [19.229, 72.857],
    ],
    wardContext: 'Wards A, D, G/S, G/N, H/W, H/E, K/W, K/E, P/S, P/N, R/S, R/C',
    detail: 'Western suburban rail corridor linking Churchgate, Dadar, Bandra, Andheri, Goregaon, Malad and Borivali.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'rail-metro-1',
    name: 'Mumbai Metro Line 1 (Versova–Andheri–Ghatkopar)',
    subcategory: 'rail_line',
    geometryType: 'line',
    coordinates: [
      [19.131, 72.821],
      [19.120, 72.848],
      [19.111, 72.869],
      [19.104, 72.888],
      [19.086, 72.908],
    ],
    wardContext: 'Wards K/W, K/E, L, N',
    detail: 'East–west elevated metro corridor connecting Versova, Andheri, Saki Naka and Ghatkopar.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'road-eeh',
    name: 'Eastern Express Highway (NH 48 / EEH)',
    subcategory: 'road',
    geometryType: 'line',
    coordinates: [
      [19.043, 72.864],
      [19.062, 72.889],
      [19.084, 72.916],
      [19.124, 72.935],
      [19.168, 72.961],
    ],
    wardContext: 'Wards F/N, M/W, L, N, S, T',
    detail: 'Major north–south arterial highway through Sion, Chembur, Ghatkopar, Vikhroli, Kanjurmarg and Mulund.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'road-weh',
    name: 'Western Express Highway (WEH)',
    subcategory: 'road',
    geometryType: 'line',
    coordinates: [
      [19.052, 72.842],
      [19.091, 72.854],
      [19.122, 72.856],
      [19.166, 72.857],
      [19.225, 72.866],
    ],
    wardContext: 'Wards H/E, K/E, P/S, P/N, R/S, R/C',
    detail: 'Major north–south arterial highway linking Bandra, Santacruz, Andheri, Goregaon, Kandivali and Dahisar.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'road-jvlr',
    name: 'Jogeshwari–Vikhroli Link Road (JVLR)',
    subcategory: 'road',
    geometryType: 'line',
    coordinates: [
      [19.138, 72.854],
      [19.132, 72.885],
      [19.124, 72.909],
      [19.118, 72.931],
    ],
    wardContext: 'Wards K/E, P/S, S, N',
    detail: 'Key east–west arterial link connecting WEH at Jogeshwari, Powai Lake and EEH at Vikhroli.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'water-powai-lake',
    name: 'Powai Lake Waterbody',
    subcategory: 'waterway',
    geometryType: 'polygon',
    coordinates: [
      [19.134, 72.898],
      [19.136, 72.909],
      [19.128, 72.914],
      [19.121, 72.907],
      [19.123, 72.897],
    ],
    wardContext: 'Ward S · Powai',
    detail: 'Mapped urban lake adjacent to IIT Bombay and Powai residential precinct.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'water-vihar-lake',
    name: 'Vihar Lake Reservoir',
    subcategory: 'waterway',
    geometryType: 'polygon',
    coordinates: [
      [19.163, 72.896],
      [19.167, 72.912],
      [19.152, 72.917],
      [19.146, 72.903],
      [19.151, 72.894],
    ],
    wardContext: 'Ward S · Sanjay Gandhi National Park South',
    detail: 'Municipal reservoir inside the southern buffer of Sanjay Gandhi National Park.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
  {
    id: 'water-mithi-river',
    name: 'Mithi River & Mahim Creek Channel',
    subcategory: 'waterway',
    geometryType: 'line',
    coordinates: [
      [19.122, 72.901],
      [19.102, 72.885],
      [19.076, 72.874],
      [19.064, 72.861],
      [19.051, 72.842],
    ],
    wardContext: 'Wards S, L, H/E, G/N',
    detail: 'Mapped river channel draining Powai through Saki Naka, Kurla, BKC and Mahim Creek.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
  },
];

// --- Curated OpenStreetMap Points of Interest & Green Space Polygons (Layers B through F) ---
export interface MapPoiFeature {
  id: string;
  name: string;
  layer: Exclude<MapLayerId, 'boundaries'>;
  subcategory: string;
  categoryLabel: string;
  lat: number;
  lng: number;
  wardCode: string;
  areaId: 'a' | 'b' | 'c' | null;
  addressContext: string;
  additionalInfo?: string;
  polygon?: [number, number][];
  source: string;
  disclaimer: string;
}

export const MUMBAI_POIS: MapPoiFeature[] = [
  // === LAYER B: PUBLIC TRANSPORT ===
  {
    id: 'tr-chembur-rail',
    name: 'Chembur Railway Station',
    layer: 'transport',
    subcategory: 'rail',
    categoryLabel: 'Suburban Rail Station · Harbour Line',
    lat: 19.0625,
    lng: 72.9008,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Station Road, Chembur East · Ward M/W',
    additionalInfo: 'Harbour Line suburban rail station; connected to Monorail walk bridge.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-tilaknagar-rail',
    name: 'Tilak Nagar Railway Station',
    layer: 'transport',
    subcategory: 'rail',
    categoryLabel: 'Suburban Rail Station · Harbour Line',
    lat: 19.0692,
    lng: 72.8931,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Tilak Nagar, Chembur · Ward M/W',
    additionalInfo: 'Harbour Line station serving Tilak Nagar and western Chembur.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-kurla-interchange',
    name: 'Kurla Junction & Terminus Interchange',
    layer: 'transport',
    subcategory: 'interchange',
    categoryLabel: 'Major Rail Interchange · Central & Harbour Lines',
    lat: 19.0655,
    lng: 72.8794,
    wardCode: 'L',
    areaId: 'a',
    addressContext: 'Kurla / Lokmanya Tilak Terminus · Ward L',
    additionalInfo: 'Suburban Central Line, Harbour Line and outstation rail interchange.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-chembur-bus',
    name: 'Chembur Colony BEST Bus Terminal',
    layer: 'transport',
    subcategory: 'bus',
    categoryLabel: 'Bus Terminal · BEST Public Bus',
    lat: 19.0558,
    lng: 72.8962,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'CG Road, Chembur · Ward M/W',
    additionalInfo: 'Mapped municipal bus terminal serving eastern and central routes.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Bus stop location only; real-time headways and schedules are not inferred.',
  },
  {
    id: 'tr-kanjurmarg-rail',
    name: 'Kanjurmarg Railway Station',
    layer: 'transport',
    subcategory: 'rail',
    categoryLabel: 'Suburban Rail Station · Central Line',
    lat: 19.1286,
    lng: 72.9282,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'JVLR East end, Kanjurmarg · Ward S',
    additionalInfo: 'Nearest Central Line suburban rail link for Powai and Kanjurmarg.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-ghatkopar-interchange',
    name: 'Ghatkopar Rail & Metro Line 1 Interchange',
    layer: 'transport',
    subcategory: 'interchange',
    categoryLabel: 'Rail + Metro Interchange · Central Line & Metro 1',
    lat: 19.0858,
    lng: 72.9081,
    wardCode: 'N',
    areaId: 'b',
    addressContext: 'Ghatkopar West · Ward N',
    additionalInfo: 'Multi-modal interchange linking Central Railway suburban trains with Metro Line 1.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-sakinaka-metro',
    name: 'Saki Naka Metro Station',
    layer: 'transport',
    subcategory: 'metro',
    categoryLabel: 'Metro Station · Mumbai Metro Line 1',
    lat: 19.1035,
    lng: 72.8878,
    wardCode: 'L',
    areaId: 'b',
    addressContext: 'Andheri–Ghatkopar Link Road · Ward L',
    additionalInfo: 'Elevated Metro Line 1 station south-west of Powai and Chandivali.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; metro headways and walk times are not inferred.',
  },
  {
    id: 'tr-powai-bus',
    name: 'Hiranandani Powai Bus Terminal',
    layer: 'transport',
    subcategory: 'bus',
    categoryLabel: 'Bus Terminal · BEST Public Bus',
    lat: 19.1197,
    lng: 72.9082,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Central Avenue, Powai · Ward S',
    additionalInfo: 'Primary public bus hub inside Powai township.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Bus stop location only; real-time headways and schedules are not inferred.',
  },
  {
    id: 'tr-dadar-interchange',
    name: 'Dadar Central & Western Railway Interchange',
    layer: 'transport',
    subcategory: 'interchange',
    categoryLabel: 'Major Rail Interchange · Central & Western Lines',
    lat: 19.0183,
    lng: 72.8432,
    wardCode: 'G/N',
    areaId: 'c',
    addressContext: 'Dadar · Ward G/N',
    additionalInfo: 'Primary city rail interchange connecting Western and Central suburban corridors.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-matunga-rail',
    name: 'Matunga Railway Station',
    layer: 'transport',
    subcategory: 'rail',
    categoryLabel: 'Suburban Rail Station · Central Line',
    lat: 19.0274,
    lng: 72.8502,
    wardCode: 'G/N',
    areaId: 'c',
    addressContext: 'Matunga · Ward G/N',
    additionalInfo: 'Central Line suburban station serving Matunga and Dadar East.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-sion-rail',
    name: 'Sion Railway Station',
    layer: 'transport',
    subcategory: 'rail',
    categoryLabel: 'Suburban Rail Station · Central Line',
    lat: 19.0402,
    lng: 72.8615,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'Sion · Ward F/N',
    additionalInfo: 'Central Line suburban station at the northern edge of Island City.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-dadar-bus',
    name: 'Khareghat / Dadar TT Bus Hub',
    layer: 'transport',
    subcategory: 'bus',
    categoryLabel: 'Bus Hub · BEST & Intercity',
    lat: 19.0195,
    lng: 72.8489,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'Dadar TT Circle · Ward F/N',
    additionalInfo: 'Arterial bus junction at Dadar TT Circle.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Bus stop location only; real-time headways and schedules are not inferred.',
  },
  {
    id: 'tr-andheri-interchange',
    name: 'Andheri Rail & Metro Interchange',
    layer: 'transport',
    subcategory: 'interchange',
    categoryLabel: 'Rail + Metro Interchange · Western Line & Metro 1',
    lat: 19.1197,
    lng: 72.8465,
    wardCode: 'K/E',
    areaId: null,
    addressContext: 'Andheri · Wards K/W & K/E',
    additionalInfo: 'Major Western Suburbs rail and Metro Line 1 interchange.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },
  {
    id: 'tr-bandra-rail',
    name: 'Bandra Railway Station & Terminus',
    layer: 'transport',
    subcategory: 'rail',
    categoryLabel: 'Suburban Rail Station · Western & Harbour Lines',
    lat: 19.0544,
    lng: 72.8402,
    wardCode: 'H/W',
    areaId: null,
    addressContext: 'Bandra · Wards H/W & H/E',
    additionalInfo: 'Heritage suburban rail station serving Bandra West and BKC corridor.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Coordinates only; train frequency and walk times are not inferred from map coordinates.',
  },

  // === LAYER C: EDUCATION ===
  {
    id: 'ed-gregorios-chembur',
    name: 'St. Gregorios High School',
    layer: 'education',
    subcategory: 'school',
    categoryLabel: 'School · Secondary Education',
    lat: 19.0584,
    lng: 72.9019,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'NB Patil Marg, Chembur · Ward M/W',
    additionalInfo: 'Mapped ICSE school facility in central Chembur.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer school quality or admission availability from map data.',
  },
  {
    id: 'ed-ves-chembur',
    name: 'Vivekanand Education Society (VES) Campus',
    layer: 'education',
    subcategory: 'college',
    categoryLabel: 'College · Higher Education Campus',
    lat: 19.0468,
    lng: 72.8899,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Hashu Advani Memorial Complex, Chembur · Ward M/W',
    additionalInfo: 'Mapped degree and technical college campus.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer educational quality from map data.',
  },
  {
    id: 'ed-iit-bombay',
    name: 'Indian Institute of Technology Bombay (IIT Bombay)',
    layer: 'education',
    subcategory: 'university',
    categoryLabel: 'University / Public Research Institute',
    lat: 19.1334,
    lng: 72.9133,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Powai · Ward S',
    additionalInfo: 'Public engineering and research university campus north of Powai Lake.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer educational quality from map data.',
  },
  {
    id: 'ed-hfs-powai',
    name: 'Hiranandani Foundation School Powai',
    layer: 'education',
    subcategory: 'school',
    categoryLabel: 'School · Primary & Secondary',
    lat: 19.1165,
    lng: 72.9091,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Hiranandani Gardens, Powai · Ward S',
    additionalInfo: 'Mapped school campus inside Powai township.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer school quality or admission availability from map data.',
  },
  {
    id: 'ed-kv-powai',
    name: 'Kendriya Vidyalaya IIT Powai',
    layer: 'education',
    subcategory: 'school',
    categoryLabel: 'School · Central Government School',
    lat: 19.1292,
    lng: 72.9154,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'IIT Campus, Powai · Ward S',
    additionalInfo: 'Mapped Kendriya Vidyalaya campus.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer school quality or admission availability from map data.',
  },
  {
    id: 'ed-vjti-matunga',
    name: 'Veermata Jijabai Technological Institute (VJTI)',
    layer: 'education',
    subcategory: 'university',
    categoryLabel: 'University / Engineering Institute',
    lat: 19.0222,
    lng: 72.8561,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'HR Mahajani Road, Matunga · Ward F/N',
    additionalInfo: 'Public engineering institute adjacent to Five Gardens, Matunga.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer educational quality from map data.',
  },
  {
    id: 'ed-donbosco-matunga',
    name: 'Don Bosco High School Matunga',
    layer: 'education',
    subcategory: 'school',
    categoryLabel: 'School · Primary & Secondary',
    lat: 19.0246,
    lng: 72.8558,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'Matunga East · Ward F/N',
    additionalInfo: 'Mapped school and sports ground campus in Matunga.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer school quality or admission availability from map data.',
  },
  {
    id: 'ed-ruia-podar',
    name: 'Ramnarain Ruia & R.A. Podar College Precinct',
    layer: 'education',
    subcategory: 'college',
    categoryLabel: 'College · Arts, Science & Commerce',
    lat: 19.0249,
    lng: 72.8508,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'LN Road, Matunga · Ward F/N',
    additionalInfo: 'Mapped degree college cluster near Matunga railway station.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Geographic presence only; Neighbrly does not infer educational quality from map data.',
  },

  // === LAYER D: HEALTHCARE ===
  {
    id: 'hc-zen-chembur',
    name: 'Zen Multi Speciality Hospital',
    layer: 'healthcare',
    subcategory: 'hospital',
    categoryLabel: 'Hospital · Multi-Speciality Facility',
    lat: 19.0569,
    lng: 72.9012,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: '10th Road, Chembur · Ward M/W',
    additionalInfo: 'Mapped hospital facility in central Chembur.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify 24/7 emergency availability, bed capacity or clinical quality.',
  },
  {
    id: 'hc-maa-chembur',
    name: 'MAA Municipal General Hospital Chembur',
    layer: 'healthcare',
    subcategory: 'hospital',
    categoryLabel: 'Hospital · BMC Municipal Facility',
    lat: 19.0598,
    lng: 72.8935,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Sion–Trombay Road, Chembur · Ward M/W',
    additionalInfo: 'Mapped civic hospital facility.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify 24/7 emergency availability or operational status.',
  },
  {
    id: 'hc-chembur-clinic',
    name: 'Tilak Nagar Urban Primary Health Clinic',
    layer: 'healthcare',
    subcategory: 'clinic',
    categoryLabel: 'Clinic · Primary Care',
    lat: 19.0672,
    lng: 72.8951,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Tilak Nagar · Ward M/W',
    additionalInfo: 'Mapped neighbourhood outpatient clinic.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; verify operating hours and services in person.',
  },
  {
    id: 'hc-hiranandani-powai',
    name: 'Dr. L. H. Hiranandani Hospital',
    layer: 'healthcare',
    subcategory: 'hospital',
    categoryLabel: 'Hospital · Tertiary Care Facility',
    lat: 19.1189,
    lng: 72.9114,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Hillside Avenue, Powai · Ward S',
    additionalInfo: 'Mapped hospital campus in Powai.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify 24/7 emergency availability, bed capacity or clinical quality.',
  },
  {
    id: 'hc-powai-pharmacy',
    name: 'Galleria Medical & Pharmacy Node',
    layer: 'healthcare',
    subcategory: 'pharmacy',
    categoryLabel: 'Pharmacy · Dispensing Chemist',
    lat: 19.1174,
    lng: 72.9073,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Galleria Precinct, Powai · Ward S',
    additionalInfo: 'Mapped neighbourhood pharmacy node.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify 24-hour dispensing hours.',
  },
  {
    id: 'hc-sion-hospital',
    name: 'Lokmanya Tilak Municipal General (Sion) Hospital',
    layer: 'healthcare',
    subcategory: 'hospital',
    categoryLabel: 'Hospital · Public Teaching Hospital',
    lat: 19.0398,
    lng: 72.8599,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'Dr. Babasaheb Ambedkar Road, Sion · Ward F/N',
    additionalInfo: 'Major BMC public medical college and hospital.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify current wait times or department availability.',
  },
  {
    id: 'hc-hinduja-mahim',
    name: 'P. D. Hinduja National Hospital',
    layer: 'healthcare',
    subcategory: 'hospital',
    categoryLabel: 'Hospital · Tertiary Care Facility',
    lat: 19.0334,
    lng: 72.8384,
    wardCode: 'G/N',
    areaId: 'c',
    addressContext: 'Veer Savarkar Marg, Mahim · Ward G/N',
    additionalInfo: 'Mapped hospital campus on the western edge of Dadar/Mahim.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify 24/7 emergency availability or clinical rating.',
  },
  {
    id: 'hc-kem-parel',
    name: 'King Edward Memorial (KEM) & Tata Memorial Hospital Cluster',
    layer: 'healthcare',
    subcategory: 'hospital',
    categoryLabel: 'Hospital · Public Tertiary Medical Cluster',
    lat: 19.0024,
    lng: 72.8419,
    wardCode: 'F/S',
    areaId: 'c',
    addressContext: 'Parel · Ward F/S',
    additionalInfo: 'Major municipal and specialist hospital precinct in Parel.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Map location only; does not verify current wait times or emergency availability.',
  },

  // === LAYER E: GREEN SPACES (With Polygon Geometries!) ===
  {
    id: 'gr-diamond-garden',
    name: 'Diamond Garden (Chembur)',
    layer: 'green',
    subcategory: 'park',
    categoryLabel: 'Public Park · Polygon Footprint',
    lat: 19.0528,
    lng: 72.8998,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Central Avenue Road, Chembur · Ward M/W',
    additionalInfo: 'Mapped municipal public garden with polygon boundary.',
    polygon: [
      [19.0545, 72.8982],
      [19.0545, 72.9016],
      [19.0512, 72.9016],
      [19.0512, 72.8982],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped park polygon does not establish a verified neighbourhood environmental quality score.',
  },
  {
    id: 'gr-tilak-ground',
    name: 'Tilak Nagar Municipal Sports & Recreation Ground',
    layer: 'green',
    subcategory: 'sports_ground',
    categoryLabel: 'Sports & Recreation Ground · Polygon Footprint',
    lat: 19.0682,
    lng: 72.8902,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Tilak Nagar · Ward M/W',
    additionalInfo: 'Mapped neighbourhood playground and open sports maidan.',
    polygon: [
      [19.0699, 72.8884],
      [19.0699, 72.8920],
      [19.0666, 72.8920],
      [19.0666, 72.8884],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped ground polygon does not confirm public access hours or protected open-space status.',
  },
  {
    id: 'gr-nirvana-powai',
    name: 'Nirvana Park & Forest Walk (Powai)',
    layer: 'green',
    subcategory: 'park',
    categoryLabel: 'Public Garden · Polygon Footprint',
    lat: 19.1152,
    lng: 72.9078,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Hiranandani Gardens, Powai · Ward S',
    additionalInfo: 'Landscaped park polygon in southern Powai.',
    polygon: [
      [19.1172, 72.9056],
      [19.1172, 72.9101],
      [19.1131, 72.9101],
      [19.1131, 72.9056],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped park polygon does not establish a verified neighbourhood environmental quality score.',
  },
  {
    id: 'gr-heritage-powai',
    name: 'Heritage Garden & Powai Lakeside Promenade',
    layer: 'green',
    subcategory: 'park',
    categoryLabel: 'Public Garden · Polygon Footprint',
    lat: 19.1208,
    lng: 72.9018,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Adi Shankaracharya Marg, Powai · Ward S',
    additionalInfo: 'Mapped garden and lakeside open space polygon.',
    polygon: [
      [19.1231, 72.8992],
      [19.1231, 72.9044],
      [19.1186, 72.9044],
      [19.1186, 72.8992],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped park polygon does not establish a verified neighbourhood environmental quality score.',
  },
  {
    id: 'gr-five-gardens',
    name: 'Five Gardens & Mancherji Joshi Precinct (Matunga)',
    layer: 'green',
    subcategory: 'park',
    categoryLabel: 'Public Gardens · Polygon Footprint',
    lat: 19.0209,
    lng: 72.8548,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'Parsi Colony, Matunga · Ward F/N',
    additionalInfo: 'Cluster of five circular public gardens and tree-lined avenues.',
    polygon: [
      [19.0230, 72.8528],
      [19.0230, 72.8569],
      [19.0188, 72.8569],
      [19.0188, 72.8528],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped park polygon does not establish a verified neighbourhood environmental quality score.',
  },
  {
    id: 'gr-shivaji-park',
    name: 'Chhatrapati Shivaji Maharaj Park (Dadar)',
    layer: 'green',
    subcategory: 'sports_ground',
    categoryLabel: 'Public Maidan & Playground · Polygon Footprint',
    lat: 19.0268,
    lng: 72.8384,
    wardCode: 'G/N',
    areaId: 'c',
    addressContext: 'Dadar West · Ward G/N',
    additionalInfo: 'Historic public recreation ground and sports maidan in Dadar.',
    polygon: [
      [19.0294, 72.8361],
      [19.0294, 72.8409],
      [19.0243, 72.8409],
      [19.0243, 72.8361],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped park polygon does not establish a verified neighbourhood environmental quality score.',
  },
  {
    id: 'gr-mnp-sion',
    name: 'Maharashtra Nature Park (Sion–Dharavi)',
    layer: 'green',
    subcategory: 'park',
    categoryLabel: 'Urban Forest & Nature Park · Polygon Footprint',
    lat: 19.0518,
    lng: 72.8622,
    wardCode: 'G/N',
    areaId: 'c',
    addressContext: 'Sion Bandra Link Road · Ward G/N',
    additionalInfo: 'Urban ecological park along the southern bank of the Mithi River.',
    polygon: [
      [19.0548, 72.8588],
      [19.0548, 72.8659],
      [19.0489, 72.8659],
      [19.0489, 72.8588],
    ],
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Mapped park polygon does not establish a verified neighbourhood environmental quality score.',
  },

  // === LAYER F: EVERYDAY AMENITIES (Optional, disabled by default) ===
  {
    id: 'am-chembur-market',
    name: 'Chembur Station Municipal Market & Supermarkets',
    layer: 'amenities',
    subcategory: 'market',
    categoryLabel: 'Municipal Market & Grocery',
    lat: 19.0612,
    lng: 72.8994,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Station Road, Chembur · Ward M/W',
    additionalInfo: 'Daily fresh produce market and retail grocery street.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Optional everyday amenity marker; operating hours are not verified.',
  },
  {
    id: 'am-chembur-bank',
    name: 'Central Avenue Banking & ATM Cluster',
    layer: 'amenities',
    subcategory: 'bank_atm',
    categoryLabel: 'Banks & ATMs',
    lat: 19.0578,
    lng: 72.8981,
    wardCode: 'M/W',
    areaId: 'a',
    addressContext: 'Central Avenue, Chembur · Ward M/W',
    additionalInfo: 'Cluster of public and private bank branches and ATMs.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Optional everyday amenity marker; ATM availability is not verified.',
  },
  {
    id: 'am-powai-supermarket',
    name: 'Haiko Supermarket & Galleria Retail Hub',
    layer: 'amenities',
    subcategory: 'supermarket',
    categoryLabel: 'Supermarket & Grocery',
    lat: 19.1181,
    lng: 72.9065,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Central Avenue, Powai · Ward S',
    additionalInfo: 'Supermarket and daily convenience retail cluster.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Optional everyday amenity marker; operating hours are not verified.',
  },
  {
    id: 'am-powai-cafes',
    name: 'Powai Ventura & Central Avenue Dining Strip',
    layer: 'amenities',
    subcategory: 'food_cafe',
    categoryLabel: 'Restaurants & Cafés',
    lat: 19.1194,
    lng: 72.9052,
    wardCode: 'S',
    areaId: 'b',
    addressContext: 'Powai · Ward S',
    additionalInfo: 'Mapped cluster of neighbourhood cafés and restaurants.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Optional everyday amenity marker; operating hours are not verified.',
  },
  {
    id: 'am-dadar-market',
    name: 'Dadar Market & Matunga Central Supermarket Strip',
    layer: 'amenities',
    subcategory: 'market',
    categoryLabel: 'Municipal Market & Grocery',
    lat: 19.0214,
    lng: 72.8448,
    wardCode: 'G/N',
    areaId: 'c',
    addressContext: 'Dadar–Matunga · Ward G/N',
    additionalInfo: 'Major civic produce market and retail grocery hub.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Optional everyday amenity marker; operating hours are not verified.',
  },
  {
    id: 'am-matunga-parking',
    name: 'Matunga Station & Five Gardens Public Parking',
    layer: 'amenities',
    subcategory: 'parking',
    categoryLabel: 'Public Parking Facility',
    lat: 19.0258,
    lng: 72.8529,
    wardCode: 'F/N',
    areaId: 'c',
    addressContext: 'Matunga East · Ward F/N',
    additionalInfo: 'Mapped municipal parking lot near Matunga station.',
    source: 'OpenStreetMap contributors (ODbL 1.0)',
    disclaimer: 'Optional everyday amenity marker; parking capacity and tariffs are not verified.',
  },
];

// --- Section 4: Extensible Interfaces for Future Advanced Intelligence Layers ---
export interface AdvancedLayerDescriptor {
  id:
    | 'air_observations'
    | 'infra_projects'
    | 'flood_environment'
    | 'safety_proxies'
    | 'verified_price'
    | 'travel_isochrones';
  label: string;
  metricLink: string;
  active: boolean;
  status: 'planned_unavailable';
  requiredSource: string;
  missingDataNotice: string;
}

export const ADVANCED_INTELLIGENCE_LAYERS: AdvancedLayerDescriptor[] = [
  {
    id: 'air_observations',
    label: 'Station Air-Quality Observations',
    metricLink: 'air',
    active: false,
    status: 'planned_unavailable',
    requiredSource: 'CPCB / SAFAR Continuous Ambient Air Quality Monitoring Stations',
    missingDataNotice: 'No live or audited station feed connected. Neighbrly does not fabricate spatial AQI contours.',
  },
  {
    id: 'infra_projects',
    label: 'Official Infrastructure Projects',
    metricLink: 'transit',
    active: false,
    status: 'planned_unavailable',
    requiredSource: 'MMRDA & BMC Official Capital Works Registry',
    missingDataNotice: 'No verified construction schedule feed connected. Future metro/road alignments are not speculated.',
  },
  {
    id: 'flood_environment',
    label: 'Flood & Drainage Hazard Context',
    metricLink: 'green',
    active: false,
    status: 'planned_unavailable',
    requiredSource: 'BMC Storm Water Drains (SWD) & Coastal Tide Gauge Records',
    missingDataNotice: 'Street-level waterlogging and drainage elevation datasets are not yet integrated.',
  },
  {
    id: 'safety_proxies',
    label: 'Verified Street-Lighting & Civic Safety Proxies',
    metricLink: 'safety',
    active: false,
    status: 'planned_unavailable',
    requiredSource: 'Municipal Streetlight Audits & Emergency Response Coverage',
    missingDataNotice: 'Block-level lighting audits are not integrated. Neighbrly never fabricates crime heatmaps.',
  },
  {
    id: 'verified_price',
    label: 'Registered Transaction Price Context',
    metricLink: 'value',
    active: false,
    status: 'planned_unavailable',
    requiredSource: 'IGR Maharashtra Registered Sale Deeds (Building-Matched)',
    missingDataNotice: 'Building-matched deed ingestion is planned; current price checks use demo fixtures only.',
  },
  {
    id: 'travel_isochrones',
    label: 'Verified Walk & Transit Isochrones',
    metricLink: 'transit',
    active: false,
    status: 'planned_unavailable',
    requiredSource: 'OpenStreetMap Pedestrian Graph + Verified Rail/BEST Timetables',
    missingDataNotice: 'Routing and timetable engines are not connected; straight-line radii are never shown as walk times.',
  },
];

// --- Filtering, Decluttering / Clustering & Search ---
export function filterPois(
  enabledLayers: EnabledLayers,
  subcategoryFilter: string = 'all',
  areaFilter: string | null = null
): MapPoiFeature[] {
  return MUMBAI_POIS.filter((poi) => {
    if (!enabledLayers[poi.layer]) return false;
    if (subcategoryFilter !== 'all' && poi.subcategory !== subcategoryFilter) return false;
    if (areaFilter && poi.areaId !== areaFilter && poi.wardCode !== areaFilter) return false;
    return true;
  });
}

export interface PoiCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  items: MapPoiFeature[];
  primaryLayer: Exclude<MapLayerId, 'boundaries'>;
  wardCode: string;
}

export function clusterPois(pois: MapPoiFeature[], zoom: number): PoiCluster[] {
  if (zoom >= 13) {
    return pois.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      count: 1,
      items: [p],
      primaryLayer: p.layer,
      wardCode: p.wardCode,
    }));
  }

  // Deterministic spatial grid clustering for lower zoom levels (zoom <= 12)
  const cellSize = zoom <= 10 ? 0.038 : zoom === 11 ? 0.024 : 0.012;
  const buckets = new Map<string, MapPoiFeature[]>();

  for (const poi of pois) {
    const gx = Math.floor(poi.lat / cellSize);
    const gy = Math.floor(poi.lng / cellSize);
    const key = `${poi.layer}:${gx}:${gy}`;
    const existing = buckets.get(key);
    if (existing) existing.push(poi);
    else buckets.set(key, [poi]);
  }

  const clusters: PoiCluster[] = [];
  for (const [key, items] of buckets.entries()) {
    const lat = items.reduce((acc, x) => acc + x.lat, 0) / items.length;
    const lng = items.reduce((acc, x) => acc + x.lng, 0) / items.length;
    clusters.push({
      id: items.length === 1 ? items[0].id : `cluster-${key}`,
      lat: +lat.toFixed(5),
      lng: +lng.toFixed(5),
      count: items.length,
      items,
      primaryLayer: items[0].layer,
      wardCode: items[0].wardCode,
    });
  }
  return clusters;
}

export interface MapSearchResult {
  id: string;
  kind: 'demo_locality' | 'bmc_ward' | 'poi';
  title: string;
  subtitle: string;
  wardCode: string;
  demoAreaId: 'a' | 'b' | 'c' | null;
  lat: number;
  lng: number;
  layer?: MapLayerId;
}

export function searchMapEntities(query: string): MapSearchResult[] {
  const q = query.trim().toLowerCase();
  const results: MapSearchResult[] = [];

  for (const a of AREAS) {
    const info = DEMO_WARD_MAP[a.id];
    const hay = `${a.name} ${a.tagline} ${a.letter} ${info?.wardCode ?? ''} ${info?.localities ?? ''}`.toLowerCase();
    if (!q || hay.includes(q)) {
      results.push({
        id: a.id,
        kind: 'demo_locality',
        title: `${a.name} (Ward ${info?.wardCode ?? 'M/W'})`,
        subtitle: `${a.tagline} · Demo report available`,
        wardCode: info?.wardCode ?? 'M/W',
        demoAreaId: a.id as 'a' | 'b' | 'c',
        lat: a.lat,
        lng: a.lng,
      });
    }
  }

  for (const w of MUMBAI_WARDS_META) {
    const hay = `${w.code} ${w.title} ${w.localities} ${w.zone}`.toLowerCase();
    if (!q || hay.includes(q)) {
      results.push({
        id: w.code,
        kind: 'bmc_ward',
        title: w.title,
        subtitle: `${w.localities} · ${w.demoAreaId ? `Includes Demo Locality ${w.demoAreaId.toUpperCase()}` : 'Boundary & POIs only (no report yet)'}`,
        wardCode: w.code,
        demoAreaId: w.demoAreaId,
        lat: w.lat,
        lng: w.lng,
      });
    }
  }

  if (q.length >= 2) {
    for (const p of MUMBAI_POIS) {
      const hay = `${p.name} ${p.categoryLabel} ${p.addressContext} ${p.wardCode}`.toLowerCase();
      if (hay.includes(q)) {
        results.push({
          id: p.id,
          kind: 'poi',
          title: p.name,
          subtitle: `${p.categoryLabel} · ${p.addressContext}`,
          wardCode: p.wardCode,
          demoAreaId: p.areaId,
          lat: p.lat,
          lng: p.lng,
          layer: p.layer,
        });
      }
    }
  }

  return results.slice(0, 18);
}
