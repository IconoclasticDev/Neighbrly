import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { AppIcon } from './components/AppIcon';
import wards from './mumbai-wards.json';
import { LandingPage } from './components/LandingPage';
import {
  AREAS,
  METRICS,
  QUIZ,
  DEFAULT_WEIGHTS,
  weightsFromAnswers,
  score,
  band,
  tone,
  summary,
  checklist,
  report,
  Area,
  Weights,
  BasemapStyleId,
  DEFAULT_BASEMAP_STYLE,
  CARTO_OSM_ATTRIBUTION,
  BOUNDARY_ATTRIBUTION,
  buildCartoTileUrl,
  MapLayerId,
  EnabledLayers,
  DEFAULT_ENABLED_LAYERS,
  MAP_LAYERS,
  MUMBAI_WARDS_META,
  BASE_GEOGRAPHY_FEATURES,
  MUMBAI_POIS,
  MapPoiFeature,
  ADVANCED_INTELLIGENCE_LAYERS,
  getLocalityIntelligenceStatus,
  filterPois,
  clusterPois,
  searchMapEntities,
} from '../shared/core';
import './style.css';
import 'leaflet/dist/leaflet.css';
import './product-theme.css';

type Screen =
  | 'welcome'
  | 'home'
  | 'quiz'
  | 'report'
  | 'metric'
  | 'price'
  | 'promoter'
  | 'checklist'
  | 'compare'
  | 'saved'
  | 'settings';
type Saved = { id: string; savedAt: string; snapshot: ReturnType<typeof report> };
type Model = {
  screen: Screen;
  area: string;
  selectedTarget: string;
  basemap: BasemapStyleId;
  layers: EnabledLayers;
  poiSubfilter: string;
  selectedPoiId: string | null;
  weights: Weights;
  quizDone: boolean;
  saved: Saved[];
  checks: Record<string, boolean>;
  device: string;
  correction: string;
  metric: string;
  pair: string[];
  returnToReport?: boolean;
};

const initial: Model = {
  screen: 'welcome',
  area: 'a',
  selectedTarget: 'a',
  basemap: DEFAULT_BASEMAP_STYLE,
  layers: { ...DEFAULT_ENABLED_LAYERS },
  poiSubfilter: 'all',
  selectedPoiId: null,
  weights: { ...DEFAULT_WEIGHTS },
  quizDone: false,
  saved: [],
  checks: {},
  device: 'web',
  correction: '',
  metric: 'air',
  pair: ['a', 'b'],
  returnToReport: false,
};

declare global {
  interface Window {
    openai?: { widgetState?: any; setWidgetState?: (s: any) => Promise<void> };
    NEIGHBRLY_INLINE?: boolean;
    NEIGHBRLY_CARTO_KEY?: string;
  }
}

const validScreens: Screen[] = [
  'welcome',
  'home',
  'quiz',
  'report',
  'metric',
  'price',
  'promoter',
  'checklist',
  'compare',
  'saved',
  'settings',
];

function validLayers(raw: any): EnabledLayers {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ENABLED_LAYERS };
  return {
    boundaries: typeof raw.boundaries === 'boolean' ? raw.boundaries : DEFAULT_ENABLED_LAYERS.boundaries,
    transport: typeof raw.transport === 'boolean' ? raw.transport : DEFAULT_ENABLED_LAYERS.transport,
    education: typeof raw.education === 'boolean' ? raw.education : DEFAULT_ENABLED_LAYERS.education,
    healthcare: typeof raw.healthcare === 'boolean' ? raw.healthcare : DEFAULT_ENABLED_LAYERS.healthcare,
    green: typeof raw.green === 'boolean' ? raw.green : DEFAULT_ENABLED_LAYERS.green,
    amenities: typeof raw.amenities === 'boolean' ? raw.amenities : DEFAULT_ENABLED_LAYERS.amenities,
  };
}

function validState(raw: any): Model {
  if (!raw || typeof raw !== 'object') return { ...initial };
  const weights = Object.fromEntries(
    METRICS.map((m) => [
      m.id,
      Number.isFinite(raw.weights?.[m.id]) && raw.weights[m.id] >= 1 && raw.weights[m.id] <= 9
        ? raw.weights[m.id]
        : 1,
    ])
  );
  const validArea = AREAS.some((a) => a.id === raw.area) ? raw.area : 'a';
  const validTarget =
    typeof raw.selectedTarget === 'string' &&
    (AREAS.some((a) => a.id === raw.selectedTarget) ||
      MUMBAI_WARDS_META.some((w) => w.code === raw.selectedTarget))
      ? raw.selectedTarget
      : validArea;
  const validBasemap: BasemapStyleId =
    raw.basemap === 'positron' || raw.basemap === 'voyager' || raw.basemap === 'local'
      ? raw.basemap
      : DEFAULT_BASEMAP_STYLE;
  return {
    ...initial,
    screen: validScreens.includes(raw.screen) ? raw.screen : 'home',
    area: validArea,
    selectedTarget: validTarget,
    basemap: validBasemap,
    layers: validLayers(raw.layers),
    poiSubfilter: typeof raw.poiSubfilter === 'string' ? raw.poiSubfilter : 'all',
    selectedPoiId:
      typeof raw.selectedPoiId === 'string' && MUMBAI_POIS.some((p) => p.id === raw.selectedPoiId)
        ? raw.selectedPoiId
        : null,
    weights,
    quizDone: raw.quizDone === true,
    saved: Array.isArray(raw.saved)
      ? raw.saved
          .filter(
            (x: any) =>
              AREAS.some((a) => a.id === x.id) &&
              x.snapshot?.demo === true &&
              typeof x.savedAt === 'string'
          )
          .slice(0, 3)
          .map((x: any) => ({
            ...x,
            snapshot:
              x.snapshot.methodVersion === 'demo-bounds-v2'
                ? { ...x.snapshot, areaName: AREAS.find((a) => a.id === x.id)!.name }
                : report(AREAS.find((a) => a.id === x.id)!, weights),
          }))
      : [],
    checks:
      raw.checks && typeof raw.checks === 'object'
        ? (Object.fromEntries(
            Object.entries(raw.checks).filter(
              ([k, v]) =>
                k.length < 50 &&
                typeof v === 'boolean' &&
                [...METRICS.map((m) => m.id), 'rera', 'deeds'].includes(k.split(':')[1])
            )
          ) as Record<string, boolean>)
        : {},
    device: 'web',
    correction: typeof raw.correction === 'string' ? raw.correction.slice(0, 1200) : '',
    metric: METRICS.some((m) => m.id === raw.metric) ? raw.metric : 'air',
    pair:
      Array.isArray(raw.pair) &&
      raw.pair.length === 2 &&
      raw.pair.every((id: string) => AREAS.some((a) => a.id === id))
        ? raw.pair
        : ['a', 'b'],
    returnToReport: raw.returnToReport === true,
  };
}

function load(): Model {
  try {
    const host = window.openai?.widgetState?.privateContent;
    const saved = host ? validState(host) : validState(JSON.parse(localStorage.getItem('neighbrly.preview.v2') || 'null'));
    return { ...saved, screen: window.location.hash === '#explore' ? 'home' : 'welcome' };
  } catch {
    return { ...initial };
  }
}

function getEnvCartoKey(): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.NEIGHBRLY_CARTO_KEY) {
      return window.NEIGHBRLY_CARTO_KEY;
    }
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && typeof metaEnv.VITE_CARTO_BASEMAP_KEY === 'string') {
      return metaEnv.VITE_CARTO_BASEMAP_KEY;
    }
  } catch {
    // Ignore in non-Vite environments
  }
  return undefined;
}

const money = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const titles: Record<Screen, string> = {
  welcome: 'Welcome',
  home: 'Explore',
  quiz: 'Your priorities',
  report: 'Neighbourhood report',
  metric: 'Evidence ledger',
  price: 'Price Reality Check',
  promoter: 'Promoter record',
  checklist: 'Visit checklist',
  compare: 'Compare areas',
  saved: 'Saved reports',
  settings: 'Settings',
};

function Demo() {
  return <span className="nb-badge">DEMO DATA</span>;
}

function Tag({ value }: { value: number | null }) {
  return <span className={'nb-tag ' + tone(value)}>{band(value)}</span>;
}

interface AppMapProps {
  selectedTarget: string;
  basemap: BasemapStyleId;
  layers: EnabledLayers;
  poiSubfilter: string;
  selectedPoiId: string | null;
  cartoKey?: string;
  onSelectLocality: (targetId: string, openReportImmediately?: boolean) => void;
  onSelectPoi: (poiId: string) => void;
  onOutside: () => void;
  onTileStatusChange: (status: 'idle' | 'loading' | 'loaded' | 'error' | 'offline_local') => void;
}

function AppMap({
  selectedTarget,
  basemap,
  layers,
  poiSubfilter,
  selectedPoiId,
  cartoKey,
  onSelectLocality,
  onSelectPoi,
  onOutside,
  onTileStatusChange,
}: AppMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryGroupRef = useRef<L.LayerGroup | null>(null);
  const poiGroupRef = useRef<L.LayerGroup | null>(null);
  const [zoom, setZoom] = useState<number>(11);

  const callbacks = useRef({ onSelectLocality, onSelectPoi, onOutside, onTileStatusChange });
  callbacks.current = { onSelectLocality, onSelectPoi, onOutside, onTileStatusChange };

  // Initialize OpenStreetMap Mumbai view
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, {
      scrollWheelZoom: true,
      attributionControl: true,
      zoomControl: true,
    }).setView([19.076, 72.8777], 11);
    mapRef.current = m;
    boundaryGroupRef.current = L.layerGroup().addTo(m);
    poiGroupRef.current = L.layerGroup().addTo(m);

    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution(CARTO_OSM_ATTRIBUTION);

    m.on('zoomend', () => {
      setZoom(m.getZoom());
    });

    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      boundaryGroupRef.current = null;
      poiGroupRef.current = null;
    };
  }, []);

  // Manage OpenStreetMap / CARTO raster tile layer
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (tileLayerRef.current) {
      m.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const activeStyle = basemap === 'local' ? 'local' : basemap === 'positron' ? 'voyager' : basemap;
    const tileUrl = !isOffline
      ? buildCartoTileUrl(activeStyle, cartoKey) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      : null;

    if (!tileUrl) {
      callbacks.current.onTileStatusChange('offline_local');
      return;
    }

    callbacks.current.onTileStatusChange('loading');
    const tl = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: CARTO_OSM_ATTRIBUTION,
    });
    tl.on('load', () => callbacks.current.onTileStatusChange('loaded'));
    tl.on('tileload', () => callbacks.current.onTileStatusChange('loaded'));
    tl.on('tileerror', () => callbacks.current.onTileStatusChange('error'));
    tl.addTo(m);
    tileLayerRef.current = tl;
  }, [basemap, cartoKey]);

  // Keep ward geometry invisible over OpenStreetMap while rendering neighbourhood report markers
  useEffect(() => {
    const m = mapRef.current;
    const group = boundaryGroupRef.current;
    if (!m || !group) return;
    group.clearLayers();

    L.geoJSON(wards as any, {
      interactive: false,
      style: () => ({
        stroke: basemap === 'local',
        color: '#B7B8A2',
        weight: basemap === 'local' ? 1 : 0,
        opacity: basemap === 'local' ? 1 : 0,
        fill: basemap === 'local',
        fillColor: '#E6E9D9',
        fillOpacity: basemap === 'local' ? 0.9 : 0,
      }),
    }).addTo(group);

    // Render named neighbourhood pins on the OpenStreetMap Mumbai view
    for (const a of AREAS) {
      const isSelected = selectedTarget === a.id;
      const marker = L.marker([a.lat, a.lng], {
        title: a.name,
        icon: L.divIcon({
          className: 'nb-map-marker' + (isSelected ? ' nb-map-marker-active' : ''),
          html: `<span>${a.letter}</span>`,
          iconSize: [36, 42],
          iconAnchor: [18, 40],
        }),
        keyboard: true,
      }).addTo(group);
      marker.bindTooltip(`${a.name} · Demo report available`, {
        direction: 'top',
        offset: [0, -30],
      });
      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        callbacks.current.onSelectLocality(a.id, true);
      });
    }
  }, [selectedTarget, basemap]);

  // Render POI pins and clusters (Layers B–F) on top of OpenStreetMap Mumbai
  useEffect(() => {
    const m = mapRef.current;
    const group = poiGroupRef.current;
    if (!m || !group) return;
    group.clearLayers();

    const visiblePois = filterPois(layers, poiSubfilter);

    if (layers.green) {
      for (const poi of visiblePois) {
        if (poi.layer === 'green' && poi.polygon && poi.polygon.length >= 3) {
          const isSelectedPoi = poi.id === selectedPoiId;
          const poly = L.polygon(poi.polygon, {
            color: isSelectedPoi ? '#1F5C42' : '#4E9A66',
            weight: isSelectedPoi ? 2.5 : 1.5,
            fillColor: '#4E9A66',
            fillOpacity: isSelectedPoi ? 0.42 : 0.25,
          }).addTo(group);
          poly.bindTooltip(`${poi.name} (${poi.categoryLabel})`);
          poly.on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            callbacks.current.onSelectPoi(poi.id);
          });
        }
      }
    }

    const clusters = clusterPois(visiblePois, zoom);
    for (const cluster of clusters) {
      const layerMeta = MAP_LAYERS.find((l) => l.id === cluster.primaryLayer)!;
      if (cluster.count > 1) {
        const cMarker = L.marker([cluster.lat, cluster.lng], {
          title: `${cluster.count} ${layerMeta.shortLabel} facilities`,
          icon: L.divIcon({
            className: `nb-poi-cluster nb-poi-${cluster.primaryLayer}`,
            html: `<b>${cluster.count}</b>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(group);
        cMarker.bindTooltip(
          `${cluster.count} mapped ${layerMeta.shortLabel.toLowerCase()} facilities · Click to inspect or zoom`
        );
        cMarker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          callbacks.current.onSelectPoi(cluster.items[0].id);
          if (m.getZoom() < 13) {
            m.setView([cluster.lat, cluster.lng], 13, { animate: false });
          }
        });
      } else {
        const poi = cluster.items[0];
        const isSelected = poi.id === selectedPoiId;
        const pMarker = L.marker([poi.lat, poi.lng], {
          title: poi.name,
          icon: L.divIcon({
            className:
              `nb-poi-pin nb-poi-${poi.layer}` + (isSelected ? ' nb-poi-pin-active' : ''),
            html: `<i>${poi.layer[0].toUpperCase()}</i>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).addTo(group);
        pMarker.bindTooltip(`${poi.name} · ${poi.categoryLabel}`);
        pMarker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          callbacks.current.onSelectPoi(poi.id);
        });
      }
    }
  }, [layers, poiSubfilter, zoom, selectedPoiId]);

  // Pan to selected target or POI on the Mumbai OpenStreetMap view
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (selectedPoiId) {
      const poi = MUMBAI_POIS.find((p) => p.id === selectedPoiId);
      if (poi) {
        m.panTo([poi.lat, poi.lng], { animate: false });
        return;
      }
    }
    const demo = AREAS.find((x) => x.id === selectedTarget);
    if (demo) {
      m.panTo([demo.lat, demo.lng], { animate: false });
      return;
    }
    const ward = MUMBAI_WARDS_META.find((w) => w.code === selectedTarget);
    if (ward) {
      m.panTo([ward.lat, ward.lng], { animate: false });
    }
  }, [selectedTarget, selectedPoiId]);

  return (
    <div className="nb-map-wrap">
      <div
        ref={el}
        className="nb-map"
        aria-label="OpenStreetMap view of Mumbai"
      />
    </div>
  );
}

export default function App() {
  const [s, setS] = useState<Model>(load);
  const [answers, setAnswers] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState('');
  const [shareText, setShareText] = useState('');
  const [correction, setCorrection] = useState(s.correction);
  const [asking, setAsking] = useState('');
  const [tileStatus, setTileStatus] = useState<
    'idle' | 'loading' | 'loaded' | 'error' | 'offline_local'
  >('offline_local');
  const [layerDrawerOpen, setLayerDrawerOpen] = useState(true);
  const [showAdvancedLayers, setShowAdvancedLayers] = useState(false);

  const rawCartoKey = getEnvCartoKey();

  const area = AREAS.find((a) => a.id === s.area)!;
  const stats = score(area, s.weights);
  const metric = METRICS.find((m) => m.id === s.metric)!;
  const entry = area.entries[metric.id as keyof typeof area.entries];

  const localityIntel = getLocalityIntelligenceStatus(s.selectedTarget, s.weights);
  const visiblePois = filterPois(s.layers, s.poiSubfilter);
  const selectedPoi: MapPoiFeature | null =
    MUMBAI_POIS.find((p) => p.id === s.selectedPoiId) || null;
  const searchEntities = search.trim() ? searchMapEntities(search) : [];

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.globals?.widgetState?.privateContent)
        setS(validState(e.detail.globals.widgetState.privateContent));
    };
    window.addEventListener('openai:set_globals', handler);
    return () => window.removeEventListener('openai:set_globals', handler);
  }, []);

  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector('#nb-product [role="dialog"]') as HTMLElement | null;
    const nodes = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>('button,textarea,input,select,a[href]') || []
      ).filter((x) => !x.hasAttribute('disabled'));
    nodes()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal('');
        return;
      }
      if (e.key === 'Tab') {
        const n = nodes(),
          first = n[0],
          last = n[n.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [modal]);

  function update(p: Partial<Model>) {
    setS((old) => {
      const n = { ...old, ...p };
      try {
        localStorage.setItem('neighbrly.preview.v2', JSON.stringify(n));
      } catch {
        setNotice('Changes work for this session. Persistent storage is unavailable.');
      }
      window.openai
        ?.setWidgetState?.({
          modelContent: {
            screen: n.screen,
            selectedDemoArea: n.area,
            quizCompleted: n.quizDone,
            savedAreaIds: n.saved.map((x) => x.id),
          },
          privateContent: n,
        })
        ?.catch(() => {});
      return n;
    });
  }

  function go(screen: Screen, id?: string, fromReportMapJump = false) {
    window.history.replaceState(null, '', screen === 'welcome' ? window.location.pathname : '#explore');
    update({
      screen,
      ...(id ? { area: id, selectedTarget: id } : {}),
      returnToReport: fromReportMapJump,
    });
    setNotice('');
    setAsking('');
  }

  function quiz() {
    setAnswers([]);
    go('quiz');
  }

  function answer(id: string) {
    const next = [...answers, id];
    if (next.length === QUIZ.length) {
      update({ weights: weightsFromAnswers(next), quizDone: true, screen: 'home' });
      setNotice('Your priorities are set. Reports now use your weights.');
      setAnswers([]);
    } else setAnswers(next);
  }

  function toggleSave() {
    const saved = s.saved.some((x) => x.id === area.id)
      ? s.saved.filter((x) => x.id !== area.id)
      : [...s.saved, { id: area.id, savedAt: new Date().toISOString(), snapshot: report(area, s.weights) }];
    update({ saved });
  }

  function share() {
    const r = report(area, s.weights);
    setShareText(
      `Neighbrly · ${area.name}\nDEMO DATA — invented observations, not property advice.\n${
        r.score ?? 'Unavailable'
      }/100 · ${band(r.score)} · ${r.used}/${r.total} metrics\nAvailable weight coverage: ${
        r.coverage
      }%\nMissing-data bounds: ${r.lo}–${r.hi} (not a confidence interval)\nIllustrative evidence dated ${
        r.asOf
      }\n\n${r.summary.map((l) => `${l.text} [${l.ref}]`).join('\n')}\n\nSource for every reference: Invented demonstration dataset.\n${r.ledger
        .map((l) => `[${l.ref}] ${l.label}: ${l.raw}; ${l.date}; coverage ${l.coverage}`)
        .join('\n')}\n\nVerify all observations independently before a property decision.`
    );
    setModal('share');
  }

  function toggleLayer(layerId: MapLayerId) {
    update({
      layers: {
        ...s.layers,
        [layerId]: !s.layers[layerId],
      },
      poiSubfilter: 'all',
    });
  }

  function handleSelectTarget(targetId: string, openReportImmediately = false) {
    if (AREAS.some((a) => a.id === targetId)) {
      if (openReportImmediately) {
        go('report', targetId);
      } else {
        update({ area: targetId, selectedTarget: targetId, selectedPoiId: null });
      }
    } else {
      update({ selectedTarget: targetId, selectedPoiId: null });
    }
  }

  const nav = [
    ['welcome', 'Landing page', 'home'],
    ['home', 'Explore', 'explore'],
    ['compare', 'Compare', 'compare'],
    ['saved', 'Saved reports', 'bookmark'],
    ['quiz', 'My priorities', 'priorities'],
  ] as const;

  const choices = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {AREAS.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );

  const evidence = (id: string) => {
    update({ metric: id, screen: 'metric' });
  };

  function scoreBlock(a: Area, large = false) {
    const v = score(a, s.weights);
    return (
      <div
        className={'nb-score ' + (large ? 'nb-score-large' : '')}
        aria-label={`${v.score ?? 'Unavailable'}, ${band(v.score)}, ${v.used} of ${v.total} metrics`}
      >
        <strong>{v.score ?? '—'}</strong>
        <small>/100</small>
      </div>
    );
  }

  const areaCard = (a: Area) => {
    const v = score(a, s.weights);
    return (
      <button
        key={a.id}
        className={'nb-area ' + (s.area === a.id ? 'selected' : '')}
        onClick={() => go('report', a.id)}
      >
        <span className="nb-area-top">
          <span className="nb-letter">{a.letter}</span>
          <span className="nb-area-title">
            {a.name}
            <small>{a.tagline}</small>
          </span>
          <span aria-hidden="true">↗</span>
        </span>
        <span className="nb-area-bottom">
          {scoreBlock(a)}
          <span>
            <Tag value={v.score} />
            <small className="nb-muted">
              {v.used} of {v.total} metrics · {v.coverage}% weight covered
            </small>
          </span>
          {s.saved.some((x) => x.id === a.id) && <span className="nb-saved-tag">Saved</span>}
        </span>
      </button>
    );
  };

  if (s.screen === 'welcome') {
    return (
      <LandingPage onOpenFullExplorer={(weights) => { if (weights) update({ weights, quizDone: true }); go('home'); window.scrollTo(0, 0); }} />
    );
  }

  return (
    <div id="nb-product" className="nb-app">
      <div className="nb-layout">
        <aside className="nb-sidebar">
          <button className="nb-brand" onClick={() => go('welcome')} aria-label="Neighbrly Home">
            <img src="/brand/neighbrly-logo.png" alt="Neighbrly" className="nb-brand-img" width="126" height="36" />
          </button>
          <div className="nb-workspace">
            <span className="nb-status-dot" /> Mumbai pilot <span>⌄</span>
          </div>
          <nav aria-label="Main navigation">
            {nav.map(([id, label, icon]) => (
              <button
                key={id}
                className={s.screen === id ? 'active' : ''}
                aria-current={s.screen === id ? 'page' : undefined}
                onClick={() => (id === 'quiz' ? quiz() : go(id))}
              >
                <AppIcon name={icon}/>
                {label}
                {id === 'saved' && s.saved.length > 0 && <em>{s.saved.length}</em>}
              </button>
            ))}
          </nav>
          <div className="nb-sidebar-bottom">
            <button className="nb-settings-link" onClick={() => go('settings')}>
              <AppIcon name="settings"/> <span>Settings & data</span>
            </button>
          </div>
        </aside>

        <div className="nb-content">
          <header className="nb-header">
            <span>{s.screen === 'home' ? 'Your neighbourhood, understood' : titles[s.screen]}</span>
            <div>
              <Demo />
              <button
                className="nb-avatar"
                onClick={() => go('settings')}
                aria-label="Open preferences"
              >
                You
              </button>
            </div>
          </header>

          {notice && (
            <div className="nb-notice" role="status">
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss notification">
                ×
              </button>
            </div>
          )}

          <main className="nb-main">
            {s.screen !== 'home' && s.screen !== 'quiz' && (
              <div className="nb-breadcrumb">
                <button
                  onClick={() =>
                    go(
                      ['metric', 'price', 'promoter', 'checklist'].includes(s.screen)
                        ? 'report'
                        : 'home'
                    )
                  }
                >
                  ←{' '}
                  {['metric', 'price', 'promoter', 'checklist'].includes(s.screen)
                    ? area.name
                    : 'Explore'}
                </button>
                <span>/ {titles[s.screen]}</span>
              </div>
            )}

            {s.screen === 'home' && (
              <>
                {s.returnToReport && (
                  <div className="nb-return-banner">
                    <span>
                      Viewing geographic context for <strong>{area.name}</strong> · Your priority
                      weights and saved reports are preserved.
                    </span>
                    <button className="nb-secondary" onClick={() => go('report', area.id)}>
                      ← Back to {area.name} report
                    </button>
                  </div>
                )}

                <div className="nb-home-heading">
                  <div>
                    <span className="nb-eyebrow">FIND YOUR KIND OF NEIGHBOURHOOD</span>
                    <h1>
                      A better place
                      <br />
                      <em>starts with a clearer picture.</em>
                    </h1>
                    <p className="nb-lead">Explore what matters, before you make your move.</p>
                  </div>
                  <span className="nb-heading-stamp">
                    Independent.
                    <br />
                    Evidence-led.
                    <br />
                    <b>Made for you.</b>
                  </span>
                </div>

                <div className="nb-search-row">
                  <label className="nb-search">
                    <AppIcon name="search"/>
                    <input
                      placeholder="Search Chembur, Powai, Dadar, Mumbai wards or nearby places"
                      aria-label="Search demo localities, wards and facilities"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch('')} aria-label="Clear search">
                        ×
                      </button>
                    )}
                  </label>
                  <label className="nb-ward-picker">
                    <span className="nb-small nb-muted">Jump to area/ward:</span>
                    <select
                      data-testid="ward-quick-select"
                      aria-label="Select locality or Mumbai administrative ward"
                      value={s.selectedTarget}
                      onChange={(e) => handleSelectTarget(e.target.value, false)}
                    >
                      <optgroup label="Sample neighbourhood reports">
                        {AREAS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.tagline})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Mumbai administrative wards">
                        {MUMBAI_WARDS_META.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.title}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </label>
                </div>

                {search.trim() !== '' && searchEntities.length > 0 && (
                  <div className="nb-search-matches" role="region" aria-label="Map search matches">
                    <div className="nb-section-head">
                      <strong>Matching Mumbai localities, wards & facilities</strong>
                      <span className="nb-muted nb-small">{searchEntities.length} matches</span>
                    </div>
                    <div className="nb-chip-list">
                      {searchEntities.slice(0, 8).map((item) => (
                        <button
                          key={`${item.kind}-${item.id}`}
                          className="nb-chip"
                          onClick={() => {
                            if (item.kind === 'poi') {
                              if (item.layer) {
                                update({
                                  layers: { ...s.layers, [item.layer]: true },
                                  selectedPoiId: item.id,
                                });
                              } else {
                                update({ selectedPoiId: item.id });
                              }
                            } else {
                              handleSelectTarget(item.id, false);
                            }
                          }}
                        >
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!s.quizDone ? (
                  <div className="nb-priority-banner">
                    <AppIcon name="priorities" size={24}/>
                    <div>
                      <strong>
                        A good neighbourhood means something different to everyone.
                      </strong>
                      <p>Your reports currently use equal weights.</p>
                    </div>
                    <button onClick={quiz}>Set my priorities →</button>
                  </div>
                ) : (
                  <div className="nb-priority-banner nb-priority-done">
                    <AppIcon name="check"/>
                    <div>
                      <strong>These reports reflect your priorities.</strong>
                      <p>
                        {[...METRICS]
                          .sort((a, b) => s.weights[b.id] - s.weights[a.id])
                          .slice(0, 3)
                          .map((m) => m.label)
                          .join(' · ')}
                      </p>
                    </div>
                    <button onClick={quiz}>Retake quiz</button>
                  </div>
                )}

                <div className="nb-explore-grid">
                  <section>
                    <div className="nb-section-head">
                      <h2>Explore areas</h2>
                      <span className="nb-muted nb-small">Illustrative reports</span>
                    </div>
                    <div className="nb-area-list">
                      {AREAS.filter((a) =>
                        (a.name + ' ' + a.tagline).toLowerCase().includes(search.toLowerCase())
                      ).map(areaCard)}
                      {!AREAS.some((a) =>
                        (a.name + ' ' + a.tagline).toLowerCase().includes(search.toLowerCase())
                      ) && (
                        <div className="nb-empty">
                          <h3>No demo locality found</h3>
                          <p>
                            Try Chembur, Powai or Dadar, or pick a matched Mumbai ward or facility.
                            Address search will follow verified data coverage.
                          </p>
                          <button onClick={() => setSearch('')}>Show all areas</button>
                        </div>
                      )}
                    </div>

                    {/* Locality Intelligence Panel: 3-Tier Status & Report Connection */}
                    <div
                      className="nb-intel-panel"
                      data-testid="locality-intel-panel"
                      aria-label="Selected locality intelligence summary"
                    >
                      <div className="nb-section-head">
                        <div>
                          <span className="nb-eyebrow">
                            {localityIntel.classification === 'demo_report_locality'
                              ? 'SELECTED DEMO REPORT LOCALITY'
                              : 'SELECTED ADMINISTRATIVE WARD'}
                          </span>
                          <h3>{localityIntel.name}</h3>
                          <p className="nb-muted nb-small">{localityIntel.localitiesSummary}</p>
                        </div>
                        {localityIntel.demo && <Demo />}
                      </div>

                      <div className="nb-status-tiers" role="list" aria-label="Verification status">
                        <div className="nb-tier-item" role="listitem">
                          <span className="nb-tier-dot good" />
                          <span>
                            <strong>1. Geographic area exists:</strong> Yes (BMC Ward{' '}
                            {localityIntel.wardCode})
                          </span>
                        </div>
                        <div className="nb-tier-item" role="listitem">
                          <span
                            className={
                              'nb-tier-dot ' +
                              (localityIntel.reportAvailable ? 'caution' : 'missing')
                            }
                          />
                          <span>
                            <strong>2. Neighbourhood report:</strong>{' '}
                            {localityIntel.reportAvailable
                              ? 'Demo report available (7 metrics)'
                              : 'No report coverage yet'}
                          </span>
                        </div>
                        <div className="nb-tier-item" role="listitem">
                          <span className="nb-tier-dot risk" />
                          <span>
                            <strong>3. Supporting evidence:</strong>{' '}
                            {localityIntel.evidenceVerified
                              ? 'Verified'
                              : localityIntel.reportAvailable
                              ? 'Unverified demo fixture'
                              : 'Not verified'}
                          </span>
                        </div>
                      </div>

                      {localityIntel.reportAvailable ? (
                        <div className="nb-intel-score-box">
                          <div className="nb-intel-score-row">
                            <div className="nb-score">
                              <strong>{localityIntel.score ?? '—'}</strong>
                              <small>/100</small>
                            </div>
                            <Tag value={localityIntel.score} />
                            <span className="nb-muted nb-small">
                              {localityIntel.used} of {localityIntel.total} metrics ·{' '}
                              {localityIntel.coverage}% weight covered · Bounds {localityIntel.lo}–
                              {localityIntel.hi}
                            </span>
                          </div>
                          <p className="nb-muted nb-small">{localityIntel.limitationsNotice}</p>
                          <div className="nb-actions">
                            <button
                              className="nb-primary"
                              onClick={() => go('report', localityIntel.id)}
                            >
                              Open neighbourhood report →
                            </button>
                            <button className="nb-secondary" onClick={quiz}>
                              {s.quizDone ? 'Adjust priorities' : 'Take 7-question quiz'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="nb-intel-unmeasured">
                          <p className="nb-small">{localityIntel.limitationsNotice}</p>
                          <div className="nb-actions">
                            <button
                              className="nb-secondary"
                              onClick={() =>
                                handleSelectTarget(localityIntel.nearestDemoId, false)
                              }
                            >
                              Preview sample report: {AREAS.find((a) => a.id === localityIntel.nearestDemoId)?.name} →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="nb-map-section">
                    <div className="nb-section-head">
                      <div>
                        <h2>Around Mumbai</h2>
                        <span className="nb-muted nb-small">
                          Connections, everyday essentials and local context
                        </span>
                      </div>
                    </div>
                    {tileStatus === 'error' && <p className="nb-map-availability" role="status">Map imagery is temporarily unavailable. Locality markers and saved information remain available.</p>}

                    <AppMap
                      selectedTarget={s.selectedTarget}
                      basemap={s.basemap}
                      layers={s.layers}
                      poiSubfilter={s.poiSubfilter}
                      selectedPoiId={s.selectedPoiId}
                      cartoKey={rawCartoKey}
                      onSelectLocality={handleSelectTarget}
                      onSelectPoi={(poiId) => update({ selectedPoiId: poiId })}
                      onOutside={() =>
                        setNotice(
                          'Outside sample report coverage. Select Chembur, Powai, Dadar or a mapped facility.'
                        )
                      }
                      onTileStatusChange={setTileStatus}
                    />

                    {/* Map Layer Controls (Layers A-F) */}
                    <div className="nb-layer-panel">
                      <div className="nb-section-head">
                        <strong>Map layers (Layers A–F)</strong>
                        <button
                          className="nb-link"
                          onClick={() => setLayerDrawerOpen(!layerDrawerOpen)}
                          aria-expanded={layerDrawerOpen}
                        >
                          {layerDrawerOpen ? 'Hide layers ▴' : 'Show layers ▾'}
                        </button>
                      </div>

                      {layerDrawerOpen && (
                        <>
                          <div
                            className="nb-layer-toggles"
                            role="group"
                            aria-label="Toggle geographic layers"
                          >
                            {MAP_LAYERS.map((layer) => {
                              const active = s.layers[layer.id];
                              return (
                                <button
                                  key={layer.id}
                                  data-testid={`layer-toggle-${layer.id}`}
                                  className={'nb-layer-btn ' + (active ? 'active' : '')}
                                  aria-pressed={active}
                                  onClick={() => toggleLayer(layer.id)}
                                  title={layer.description}
                                >
                                  <span className="nb-layer-code">{layer.code}</span>
                                  <strong>{layer.shortLabel}</strong>
                                  <small>{active ? 'On' : 'Off'}</small>
                                </button>
                              );
                            })}
                          </div>

                          <div className="nb-subfilter-row">
                            <span className="nb-small nb-muted">Category filter:</span>
                            {[
                              ['all', 'All active POIs'],
                              ['rail', 'Rail stations'],
                              ['metro', 'Metro'],
                              ['bus', 'Bus stops'],
                              ['interchange', 'Interchanges'],
                              ['school', 'Schools'],
                              ['college', 'Colleges'],
                              ['hospital', 'Hospitals'],
                              ['park', 'Parks & polygons'],
                              ['market', 'Markets & grocery'],
                            ].map(([id, label]) => (
                              <button
                                key={id}
                                className={
                                  'nb-filter-pill ' + (s.poiSubfilter === id ? 'active' : '')
                                }
                                aria-pressed={s.poiSubfilter === id}
                                onClick={() => update({ poiSubfilter: id })}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Visible POI Quick Inspector Strip */}
                          <div className="nb-poi-strip">
                            <div className="nb-section-head">
                              <span className="nb-small nb-muted">
                                Mapped OpenStreetMap facilities ({visiblePois.length} shown · click
                                to inspect on map):
                              </span>
                            </div>
                            <div className="nb-poi-pills">
                              {visiblePois.slice(0, 8).map((poi) => (
                                <button
                                  key={poi.id}
                                  data-testid={`poi-item-${poi.id}`}
                                  className={
                                    'nb-poi-pill ' +
                                    (s.selectedPoiId === poi.id ? 'selected' : '')
                                  }
                                  onClick={() => update({ selectedPoiId: poi.id })}
                                >
                                  <span className="nb-poi-tag">{poi.layer.toUpperCase()}</span>
                                  <span>{poi.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Selected Facility Inspector Card */}
                          {selectedPoi && (
                            <div
                              className="nb-facility-card"
                              data-testid="facility-intel-panel"
                              role="region"
                              aria-label="Selected facility information"
                            >
                              <div className="nb-section-head">
                                <div>
                                  <span className="nb-eyebrow">
                                    MAPPED FACILITY · {selectedPoi.layer.toUpperCase()}
                                  </span>
                                  <h3>{selectedPoi.name}</h3>
                                </div>
                                <button
                                  className="nb-link"
                                  onClick={() => update({ selectedPoiId: null })}
                                  aria-label="Close facility details"
                                >
                                  Close ×
                                </button>
                              </div>
                              <dl className="nb-facility-dl">
                                <div>
                                  <dt>Category</dt>
                                  <dd>{selectedPoi.categoryLabel}</dd>
                                </div>
                                <div>
                                  <dt>Location</dt>
                                  <dd>
                                    {selectedPoi.addressContext} ({selectedPoi.lat.toFixed(4)}°N,{' '}
                                    {selectedPoi.lng.toFixed(4)}°E)
                                  </dd>
                                </div>
                                {selectedPoi.additionalInfo && (
                                  <div>
                                    <dt>Details</dt>
                                    <dd>{selectedPoi.additionalInfo}</dd>
                                  </div>
                                )}
                                <div>
                                  <dt>Source</dt>
                                  <dd>{selectedPoi.source}</dd>
                                </div>
                              </dl>
                              <p className="nb-facility-disclaimer">{selectedPoi.disclaimer}</p>
                            </div>
                          )}

                          {/* Planned Advanced Intelligence Layers */}
                          <div className="nb-advanced-layers">
                            <button
                              className="nb-link"
                              onClick={() => setShowAdvancedLayers(!showAdvancedLayers)}
                              aria-expanded={showAdvancedLayers}
                            >
                              {showAdvancedLayers
                                ? 'Hide planned intelligence feeds ▴'
                                : 'Show 6 planned advanced intelligence layers (not fabricated) ▾'}
                            </button>
                            {showAdvancedLayers && (
                              <div className="nb-advanced-grid">
                                {ADVANCED_INTELLIGENCE_LAYERS.map((adv) => (
                                  <div key={adv.id} className="nb-advanced-item">
                                    <div className="nb-section-head">
                                      <strong>{adv.label}</strong>
                                      <span className="nb-tag">Planned · Inactive</span>
                                    </div>
                                    <p className="nb-small nb-muted">{adv.missingDataNotice}</p>
                                    <small className="nb-muted">
                                      Required source: {adv.requiredSource}
                                    </small>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Map Legend */}
                    <div className="nb-map-legend" aria-label="Map legend">
                      <span>
                        <i className="nb-leg-demo" /> Sample neighbourhood report
                      </span>
                      <span>
                        <i className="nb-leg-ward" /> BMC administrative ward (boundary only)
                      </span>
                      <span>
                        <i className="nb-leg-green" /> Green space polygon
                      </span>
                      <span>
                        <i className="nb-leg-poi" /> Mapped OSM facility / cluster
                      </span>
                    </div>

                    <div className="nb-map-note">
                      <strong>Tap a locality, ward boundary or facility marker to inspect.</strong>
                      <span>
                        Attribution: © OpenStreetMap contributors (ODbL) · © CARTO · Mumbai wards:
                        Sanjana Krishnan (CC BY 4.0).
                      </span>
                    </div>
                  </section>
                </div>

                <div className="nb-footer-note">
                  <AppIcon name="shield"/> Every score is a starting point for questions, not a property
                  recommendation.
                </div>
              </>
            )}

            {s.screen === 'quiz' && (
              <section className="nb-quiz">
                <div className="nb-section-head">
                  <span className="nb-eyebrow">MAKE IT PERSONAL</span>
                  <button className="nb-link" onClick={() => go('home')}>
                    Exit quiz ×
                  </button>
                </div>
                <p className="nb-muted">
                  Question {answers.length + 1} of {QUIZ.length}
                </p>
                <div
                  className="nb-progress"
                  role="progressbar"
                  aria-label="Quiz progress"
                  aria-valuenow={answers.length}
                  aria-valuemin={0}
                  aria-valuemax={QUIZ.length}
                >
                  <span style={{ width: `${(answers.length / QUIZ.length) * 100}%` }} />
                </div>
                <h1>{QUIZ[answers.length].q}</h1>
                <p className="nb-lead">
                  There’s no right answer. Choose what matters more to you.
                </p>
                <div className="nb-options">
                  {[QUIZ[answers.length].a, QUIZ[answers.length].b].map((a, i) => (
                    <button key={`${answers.length}-${i}`} onClick={() => answer(a.m)}>
                      <span className="nb-letter">{i ? 'B' : 'A'}</span>
                      {a.label}
                      <span>→</span>
                    </button>
                  ))}
                </div>
                <p className="nb-muted nb-small">
                  Answers are balanced across all seven metrics. Each choice increases a preference
                  weight; it does not change the underlying evidence.
                </p>
                {answers.length > 0 && (
                  <button
                    className="nb-link"
                    onClick={() => setAnswers(answers.slice(0, -1))}
                  >
                    ← Previous question
                  </button>
                )}
              </section>
            )}

            {s.screen === 'report' && (
              <>
                <div className="nb-report-title">
                  <div>
                    <span className="nb-eyebrow">YOUR NEIGHBOURHOOD REPORT</span>
                    <h1>{area.name}</h1>
                    <p className="nb-lead">{area.tagline}</p>
                  </div>
                  <div className="nb-actions">
                    <button
                      className="nb-secondary"
                      onClick={() => go('home', area.id, true)}
                    >
                      <AppIcon name="map" size={18}/> View on neighbourhood map
                    </button>
                    <button className="nb-secondary" onClick={toggleSave}>
                      <AppIcon name="bookmark" size={18}/>{s.saved.some((x) => x.id === area.id) ? 'Saved' : 'Save report'}
                    </button>
                    <button className="nb-primary" onClick={share}>
                      Share ↗
                    </button>
                  </div>
                </div>
                <div className="nb-report-grid">
                  <section className="nb-score-panel">
                    <span className="nb-eyebrow">MATCH FOR YOUR PRIORITIES</span>
                    <div className="nb-score-line">
                      {scoreBlock(area, true)}
                      <Tag value={stats.score} />
                    </div>
                    <div className="nb-meter" aria-hidden="true">
                      <span
                        style={{ width: `${stats.score || 0}%` }}
                        className={tone(stats.score)}
                      />
                    </div>
                    <div className="nb-coverage">
                      <strong>
                        {stats.used} of {stats.total} metrics
                      </strong>
                      <span>{stats.coverage}% of your weight covered</span>
                    </div>
                    <p className="nb-bounds">
                      Missing-data bounds <b>{stats.lo}–{stats.hi}</b>
                    </p>
                    <p className="nb-muted nb-small">
                      Bounds assign missing metrics their lowest or highest possible scores. They
                      are not a confidence interval and exclude measurement uncertainty.
                    </p>
                    <div className="nb-asof">
                      Illustrative evidence · 1 Oct 2026 <Demo />
                    </div>
                  </section>
                  <section className="nb-summary-panel">
                    <span className="nb-eyebrow">THE SHORT VERSION</span>
                    <h2>What stands out for you</h2>
                    {summary(area, s.weights).map((l) => (
                      <div className="nb-summary" key={l.ref}>
                        <span
                          className={
                            'nb-summary-dot ' +
                            tone(area.entries[l.metric as keyof typeof area.entries].value)
                          }
                        />
                        <p>
                          {l.text}{' '}
                          <button className="nb-cite" onClick={() => evidence(l.metric)}>
                            [{l.ref}]
                          </button>
                        </p>
                      </div>
                    ))}
                    <p className="nb-muted nb-small">
                      Each reference opens its evidence. All observations are invented demonstration
                      data.
                    </p>
                  </section>
                </div>
                <div className="nb-section-head">
                  <h2>Behind the score</h2>
                  <span className="nb-muted nb-small">Higher always means more favourable</span>
                </div>
                <div className="nb-metrics-grid">
                  {METRICS.map((m) => {
                    const e = area.entries[m.id as keyof typeof area.entries];
                    return (
                      <button
                        className="nb-metric"
                        key={m.id}
                        onClick={() => evidence(m.id)}
                      >
                        <span className="nb-metric-top">
                          <span>
                            <small>[{e.ref}]</small> {m.label}
                          </span>
                          <span>↗</span>
                        </span>
                        {e.value === null ? (
                          <>
                            <strong className="nb-no-data">No data yet</strong>
                            <span className="nb-muted nb-small">
                              Excluded from score · tap to see why
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="nb-metric-value">
                              <strong>{e.value}</strong>
                              <Tag value={e.value} />
                            </span>
                            <span className="nb-mini-track">
                              <span
                                className={tone(e.value)}
                                style={{ width: `${e.value}%` }}
                              />
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="nb-section-head">
                  <h2>A closer look</h2>
                </div>
                <div className="nb-deep-grid">
                  {[
                    ['price', 'Price Reality Check', 'An asking price needs context.', 'price'],
                    ['promoter', 'Promoter record', 'Look beyond a single project.', 'building'],
                    ['checklist', 'Your visit checklist', 'Turn gaps into good questions.', 'checklist'],
                  ].map(([id, title, sub, icon]) => (
                    <button
                      className="nb-deep"
                      key={id}
                      onClick={() => go(id as Screen)}
                    >
                      <span className="nb-deep-icon"><AppIcon name={icon} size={24}/></span>
                      <strong>{title}</strong>
                      <p>{sub}</p>
                      <span>Explore →</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {s.screen === 'metric' && (
              <section className="nb-detail">
                <span className="nb-eyebrow">FACT LEDGER · REFERENCE [{entry.ref}]</span>
                <h1>{metric.label}</h1>
                <p className="nb-lead">{metric.blurb}</p>
                {entry.value === null ? (
                  <div className="nb-warning">
                    <h2>No data yet</h2>
                    <p>{entry.note}</p>
                    <p>
                      This metric is excluded from the observed score. Its missing weight widens the
                      missing-data bounds.
                    </p>
                    <h3>Verify on your visit</h3>
                    <p>{metric.verify}</p>
                  </div>
                ) : (
                  <div className="nb-evidence-card">
                    <div className="nb-evidence-score">
                      {entry.value}
                      <Tag value={entry.value} />
                    </div>
                    <dl>
                      <div>
                        <dt>Reading</dt>
                        <dd>{entry.raw}</dd>
                      </div>
                      <div>
                        <dt>Source</dt>
                        <dd>
                          {entry.source} <Demo />
                        </dd>
                      </div>
                      <div>
                        <dt>Observation date</dt>
                        <dd>1 October 2026</dd>
                      </div>
                      <div>
                        <dt>Coverage</dt>
                        <dd>{entry.coverage} · illustrative</dd>
                      </div>
                      <div>
                        <dt>Locality</dt>
                        <dd>{area.name}</dd>
                      </div>
                      <div>
                        <dt>Method</dt>
                        <dd>Invented 0–100 fixture; higher is more favourable.</dd>
                      </div>
                    </dl>
                  </div>
                )}
                <div className="nb-soft-card">
                  <h3>Take the evidence further</h3>
                  <p>{metric.verify}</p>
                  <div className="nb-actions">
                    <button className="nb-link" onClick={() => go('checklist')}>
                      Open your visit checklist →
                    </button>
                    <button className="nb-link" onClick={() => go('home', area.id, true)}>
                      View locality on map →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {s.screen === 'price' && (
              <section className="nb-detail">
                <span className="nb-eyebrow">VALUE · PRICE REALITY CHECK</span>
                <h1>
                  Put the asking price
                  <br />
                  <em>in perspective.</em>
                </h1>
                <p className="nb-lead">Compare like-for-like registered transactions.</p>
                {!area.price ? (
                  <div className="nb-warning">
                    <h2>No data yet</h2>
                    <p>
                      There are not enough suitable registered transactions in this demo locality to
                      calculate a median. No price comparison is shown.
                    </p>
                    <button className="nb-link" onClick={() => evidence('value')}>
                      See why price evidence is missing [8] →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="nb-soft-card">
                      <label className="nb-field">
                        Seller’s asking price · ₹ per sq ft
                        <input
                          inputMode="decimal"
                          type="number"
                          min="1"
                          max="1000000"
                          value={asking || area.price.asking}
                          onChange={(e) => setAsking(e.target.value)}
                        />
                      </label>
                      <p className="nb-muted nb-small">
                        Use the same area basis and property type. Your input changes this
                        comparison, not the bundled demo score.
                      </p>
                    </div>
                    {(() => {
                      const p = area.price;
                      const ask = Number(asking || p.asking);
                      if (!Number.isFinite(ask) || ask <= 0 || ask > 1000000)
                        return (
                          <p className="nb-warning" role="alert">
                            Enter a valid positive asking price up to ₹10,00,000 per sq ft.
                          </p>
                        );
                      const gap = Math.round((ask / p.median - 1) * 100);
                      const max = Math.max(ask, p.median);
                      return (
                        <div className="nb-price-card">
                          <p>
                            Registered median <strong>₹{money(p.median)} / sq ft</strong>
                          </p>
                          <div className="nb-price-bar">
                            <span style={{ width: `${(p.median / max) * 100}%` }} />
                          </div>
                          <p>
                            Seller’s asking price <strong>₹{money(ask)} / sq ft</strong>
                          </p>
                          <div className="nb-price-bar">
                            <span
                              className={gap > 8 ? 'risk' : 'caution'}
                              style={{ width: `${(ask / max) * 100}%` }}
                            />
                          </div>
                          <h2>
                            {Math.abs(gap)}% {gap >= 0 ? 'above' : 'below'} the sample median
                          </h2>
                          <p>
                            Based on {p.deals} invented deals · {p.period}. Asking price is not a
                            sale price.
                          </p>
                        </div>
                      );
                    })()}
                    <button className="nb-link" onClick={() => evidence('value')}>
                      View price metric [8] →
                    </button>
                    <p className="nb-muted nb-small">
                      Comparison source: invented demonstration transactions · 1 Oct 2026 ·{' '}
                      {area.price.deals} sample deals for {area.name}. Property comparability has
                      not been verified.
                    </p>
                  </>
                )}
              </section>
            )}

            {s.screen === 'promoter' && (
              <section className="nb-detail">
                <span className="nb-eyebrow">DELIVERY · PROMOTER RECORD</span>
                <h1>
                  The track record
                  <br />
                  <em>behind the promise.</em>
                </h1>
                {!area.promoter ? (
                  <div className="nb-warning">
                    <h2>No matched promoter</h2>
                    <p>
                      There is no confirmed project-to-promoter match for this demo locality. We
                      cannot attribute another builder’s record to this property.
                    </p>
                    <button className="nb-link" onClick={() => evidence('delivery')}>
                      Open missing evidence [6] →
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="nb-lead">{area.promoter.name} · fictitious promoter</p>
                    <div className="nb-promoter-grid">
                      {[
                        [String(area.promoter.projects), 'Sample projects'],
                        [
                          `${area.promoter.delayed} of ${area.promoter.projects}`,
                          'Delayed projects',
                        ],
                        [
                          `${area.promoter.avgDelayMonths} mo`,
                          'Average delay among delayed projects',
                        ],
                        [String(area.promoter.complaints), 'Sample complaints'],
                      ].map(([v, k]) => (
                        <div className="nb-soft-card" key={k}>
                          <strong className="nb-big-number">{v}</strong>
                          <p>{k}</p>
                        </div>
                      ))}
                    </div>
                    <p>
                      Records cover the listed demo projects only. Complaint counts do not establish
                      wrongdoing.
                    </p>
                    <button className="nb-link" onClick={() => evidence('delivery')}>
                      Open delivery evidence [6] →
                    </button>
                    <p className="nb-muted nb-small">
                      Source: Invented demonstration dataset · 1 Oct 2026 · coverage:{' '}
                      {area.promoter.projects} fictional registered projects.
                    </p>
                  </>
                )}
              </section>
            )}

            {s.screen === 'checklist' && (
              <section className="nb-detail">
                <span className="nb-eyebrow">TAKE A LITTLE CLARITY WITH YOU</span>
                <h1>Your visit checklist</h1>
                <p className="nb-lead">For {area.name}. Ordered by your priorities.</p>
                <div className="nb-check-progress">
                  {
                    checklist(area, s.weights).filter((c) => s.checks[area.id + ':' + c.id])
                      .length
                  }{' '}
                  of {checklist(area, s.weights).length} checked
                </div>
                {checklist(area, s.weights).map((c, i) => (
                  <label
                    className={'nb-check ' + (s.checks[area.id + ':' + c.id] ? 'done' : '')}
                    key={c.id}
                  >
                    <input
                      type="checkbox"
                      checked={!!s.checks[area.id + ':' + c.id]}
                      onChange={(e) =>
                        update({
                          checks: { ...s.checks, [area.id + ':' + c.id]: e.target.checked },
                        })
                      }
                    />
                    <span>
                      <strong>
                        {i + 1}. {c.title}
                      </strong>
                      <small>{c.text}</small>
                    </span>
                  </label>
                ))}
                <p className="nb-muted nb-small">
                  This checklist is based on demo evidence. Your checkmarks are saved on this
                  device.
                </p>
              </section>
            )}

            {s.screen === 'compare' && (
              <>
                <span className="nb-eyebrow">
                  THE SAME PRIORITIES. TWO DIFFERENT PLACES.
                </span>
                <h1>See the trade-offs.</h1>
                <p className="nb-lead">Compare evidence, not just a headline score.</p>
                <div className="nb-two-grid nb-compare-pickers">
                  <label className="nb-field">
                    First locality
                    {choices(s.pair[0], (id) =>
                      update({
                        pair: [
                          id,
                          s.pair[1] === id ? AREAS.find((a) => a.id !== id)!.id : s.pair[1],
                        ],
                      })
                    )}
                  </label>
                  <label className="nb-field">
                    Second locality
                    {choices(s.pair[1], (id) =>
                      update({
                        pair: [
                          s.pair[0] === id ? AREAS.find((a) => a.id !== id)!.id : s.pair[0],
                          id,
                        ],
                      })
                    )}
                  </label>
                </div>
                {(() => {
                  const a = AREAS.find((x) => x.id === s.pair[0])!,
                    b = AREAS.find((x) => x.id === s.pair[1])!;
                  const x = score(a, s.weights),
                    y = score(b, s.weights);
                  return (
                    <>
                      <div className="nb-compare-table">
                        <table>
                          <thead>
                            <tr>
                              <th scope="col">Your priorities</th>
                              <th scope="col">{a.name}</th>
                              <th scope="col">{b.name}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="nb-compare-score">
                              <th scope="row">Observed match</th>
                              <td>
                                {scoreBlock(a)}
                                <Tag value={x.score} />
                              </td>
                              <td>
                                {scoreBlock(b)}
                                <Tag value={y.score} />
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Missing-data bounds</th>
                              <td>
                                {x.lo}–{x.hi}
                              </td>
                              <td>
                                {y.lo}–{y.hi}
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Weight coverage</th>
                              <td>{x.coverage}%</td>
                              <td>{y.coverage}%</td>
                            </tr>
                            {METRICS.map((m) => {
                              const av = a.entries[m.id as keyof typeof a.entries].value,
                                bv = b.entries[m.id as keyof typeof b.entries].value;
                              return (
                                <tr key={m.id}>
                                  <th scope="row">{m.label}</th>
                                  {[av, bv].map((v, i) => (
                                    <td key={i}>
                                      <strong>{v ?? 'No data'}</strong>
                                      {v !== null && <small>{band(v)}</small>}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {Math.max(x.lo, y.lo) <= Math.min(x.hi, y.hi) && (
                        <div className="nb-warning">
                          <strong>The missing-data bounds overlap.</strong>
                          <p>
                            Unknown metrics could change the ordering. These are sensitivity bounds,
                            not a statistical test.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {s.screen === 'saved' && (
              <>
                <span className="nb-eyebrow">YOUR SHORTLIST</span>
                <h1>A little closer to home.</h1>
                <p className="nb-lead">Saved snapshots stay on this device.</p>
                {s.saved.length === 0 ? (
                  <div className="nb-empty">
                    <AppIcon name="bookmark" size={35}/>
                    <h2>No saved reports yet</h2>
                    <p>Explore a locality and save its report to start your shortlist.</p>
                    <button className="nb-primary" onClick={() => go('home')}>
                      Explore areas →
                    </button>
                  </div>
                ) : (
                  <div className="nb-saved-list">
                    {s.saved.map((x) => (
                      <div className="nb-soft-card" key={x.id}>
                        <div className="nb-section-head">
                          <h2>{x.snapshot.areaName}</h2>
                          <Demo />
                        </div>
                        <p>
                          <strong>{x.snapshot.score} / 100</strong> · {x.snapshot.used} of{' '}
                          {x.snapshot.total} metrics
                        </p>
                        <p className="nb-muted nb-small">
                          Saved {new Date(x.savedAt).toLocaleDateString('en-IN')} · evidence{' '}
                          {x.snapshot.asOf} · {x.snapshot.methodVersion}
                        </p>
                        <div className="nb-actions">
                          <button
                            className="nb-primary"
                            onClick={() => {
                              go('report', x.id);
                              setNotice(
                                'Showing a freshly calculated demo report with your current weights. The saved snapshot above retains the original score.'
                              );
                            }}
                          >
                            Open current report →
                          </button>
                          <button
                            className="nb-link"
                            onClick={() =>
                              update({ saved: s.saved.filter((y) => y.id !== x.id) })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {s.screen === 'settings' && (
              <section className="nb-detail">
                <span className="nb-eyebrow">MAKE YOURSELF AT HOME</span>
                <h1>Settings & data</h1>
                <div className="nb-soft-card">
                  <h2>Your priorities</h2>
                  <div className="nb-weights">
                    {METRICS.map((m) => (
                      <div key={m.id}>
                        <span>{m.label}</span>
                        <b>{s.weights[m.id]}</b>
                      </div>
                    ))}
                  </div>
                  <button className="nb-secondary" onClick={quiz}>
                    Retake the 7-question quiz
                  </button>
                </div>
                <div className="nb-soft-card">
                  <h2>Language</h2>
                  <div className="nb-actions">
                    <span className="nb-tag good">English</span>
                    <span className="nb-muted">हिन्दी · मराठी — planned</span>
                  </div>
                </div>
                <div className="nb-soft-card">
                  <h2>About this data</h2>
                  <p>
                    Every score, price and promoter in this preview is invented. Evidence date: 1
                    October 2026. Neighbourhood names and map positions refer to real places. The Mumbai administrative outline and OpenStreetMap points of
                    interest are sourced geographic context; they do not verify any report claim.
                  </p>
                  <p>
                    Missing metrics are excluded from the observed weighted average. At least three
                    known metrics and 50% of your selected weight are required for a score. The
                    bounds show possible outcomes if missing metrics range from 0 to 100;
                    measurement errors are not modelled.
                  </p>
                </div>
                <div className="nb-soft-card">
                  <h2>Privacy</h2>
                  <p>
                    No account and no location tracking. Preferences, saved snapshots and checklist
                    items stay in local browser storage. The in-chat preview may also retain
                    interaction state with this conversation. No device geolocation permission is
                    requested.
                  </p>
                </div>
                <div className="nb-soft-card">
                  <h2>Flag a data issue</h2>
                  <p className="nb-muted">
                    Save a private draft here. This preview does not send corrections to a team.
                  </p>
                  <label className="nb-field">
                    Correction draft
                    <textarea
                      rows={3}
                      maxLength={1200}
                      value={correction}
                      onChange={(e) => setCorrection(e.target.value)}
                      placeholder="Which locality, metric or source needs checking?"
                    />
                  </label>
                  <button
                    className="nb-secondary"
                    onClick={() => {
                      update({ correction });
                      setNotice('Correction draft saved locally. Nothing has been submitted.');
                    }}
                  >
                    Save draft on this device
                  </button>
                </div>
                <button className="nb-danger" onClick={() => setModal('reset')}>
                  Clear preferences & saved data
                </button>
              </section>
            )}
          </main>

          <footer className="nb-product-footer">
            <span>neighbrly.</span>
            <span>Know the neighbourhood before you sign.</span>
            <span>Demo · v0.1</span>
          </footer>
        </div>
      </div>

      {modal && (
        <div className="nb-modal-shade">
          <section
            className="nb-modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal === 'reset' ? 'Clear saved data' : 'Share report'}
          >
            <div className="nb-section-head">
              <h2>{modal === 'reset' ? 'Start fresh?' : 'Take the report with you'}</h2>
              <button
                className="nb-close"
                onClick={() => setModal('')}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            {modal === 'reset' ? (
              <>
                <p>
                  This removes your priorities, saved snapshots, checkmarks and correction draft
                  from this preview.
                </p>
                <div className="nb-actions">
                  <button
                    className="nb-danger"
                    onClick={() => {
                      update({ ...initial, device: s.device });
                      setAnswers([]);
                      setCorrection('');
                      setModal('');
                    }}
                  >
                    Clear data
                  </button>
                  <button className="nb-secondary" onClick={() => setModal('')}>
                    Keep my data
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="nb-muted nb-small">
                  Includes the demo label, evidence and missing-data explanation.
                </p>
                <textarea
                  aria-label="Shareable report text"
                  rows={8}
                  readOnly
                  value={shareText}
                />
                <div className="nb-actions">
                  <button
                    className="nb-primary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareText);
                        setNotice('Report text copied.');
                        setModal('');
                      } catch {
                        setNotice(
                          'Clipboard is unavailable here. Select and copy the report text.'
                        );
                      }
                    }}
                  >
                    Copy report
                  </button>
                  <button
                    className="nb-secondary"
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Neighbrly demo report',
                            text: shareText,
                          });
                        } catch {
                          setNotice(
                            'Sharing was cancelled or unavailable. You can copy the text.'
                          );
                        }
                      } else
                        setNotice(
                          'Device sharing is unavailable in this preview. Copy the text to share.'
                        );
                    }}
                  >
                    Device share ↗
                  </button>
                </div>
                <p className="nb-muted nb-small">
                  PDF export and WhatsApp integration are planned. This version shares text.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
