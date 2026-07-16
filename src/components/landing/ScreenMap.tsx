/**
 * Real map of the NS station screens, with native MapLibre clustering.
 *
 * Basemap: CARTO "Positron" raster tiles — free and KEYLESS (attribution
 * required, added below). For production at scale you may want your own tile
 * provider / usage agreement; swapping the `raster` source URL here is all it
 * takes.
 *
 * All 732 screens are one clustered GeoJSON source: zoomed out you see cluster
 * bubbles with a count; zooming in (or clicking a cluster) splits them into
 * individual points. Clicking a single screen opens a popup with its info and a
 * "Voeg toe aan campagne" button that uses the same cart flow as the cards.
 *
 * This module statically imports maplibre-gl (heavy), so the parent lazy-loads it
 * (React.lazy) to keep it out of the initial bundle.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Screen } from '../../data/screens';

const COBALT = '#2456E6';
const AMBER = '#DE8A06';
const NL_CENTER: [number, number] = [5.2913, 52.1326];

// Keyless raster basemap (CARTO Positron). Attribution is mandatory.
const BASE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

const fmtInt = (n: number) => n.toLocaleString('nl-NL');

interface Props {
  screens: Screen[];
  /** Ids of screens in the current plan — highlighted in amber. */
  selectedIds?: string[];
  onAddScreen: (screen: Screen) => void;
  addedIds?: string[];
}

function toGeoJSON(screens: Screen[], selected: Set<string>): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: screens
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && !(s.lat === 0 && s.lng === 0))
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { id: s.id, sel: selected.has(s.id) ? 1 : 0 },
      })),
  };
}

export default function ScreenMap({ screens, selectedIds = [], onAddScreen, addedIds = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);

  // Keep the latest props in refs so map event handlers never go stale.
  const byId = useRef(new Map<string, Screen>());
  byId.current = new Map(screens.map((s) => [s.id, s]));
  const onAddRef = useRef(onAddScreen);
  onAddRef.current = onAddScreen;
  const addedRef = useRef(new Set(addedIds));
  addedRef.current = new Set(addedIds);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: NL_CENTER,
      zoom: 6.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('screens', {
        type: 'geojson',
        data: toGeoJSON(screens, new Set(selectedIds)),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 48,
      });

      // Cluster bubbles — cobalt, growing with count.
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'screens',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': COBALT,
          'circle-opacity': 0.9,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 30, 100, 40],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(36,86,230,0.25)',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'screens',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
        paint: { 'text-color': '#FFFFFF' },
      });

      // Single screens — amber when in the plan, cobalt otherwise.
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'screens',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['case', ['==', ['get', 'sel'], 1], AMBER, COBALT],
          'circle-radius': ['case', ['==', ['get', 'sel'], 1], 8, 6],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      readyRef.current = true;

      // Zoom into a cluster on click.
      map.on('click', 'clusters', (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = feats[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        const src = map.getSource('screens') as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          const center = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number];
          if (reduced) map.jumpTo({ center, zoom });
          else map.easeTo({ center, zoom });
        }).catch(() => {});
      });

      // Popup for a single screen.
      map.on('click', 'points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const s = byId.current.get(f.properties?.id as string);
        if (!s) return;
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px', offset: 12 })
          .setLngLat(coords)
          .setDOMContent(buildPopup(s))
          .addTo(map);
      });

      const setCursor = (c: string) => () => { map.getCanvas().style.cursor = c; };
      map.on('mouseenter', 'clusters', setCursor('pointer'));
      map.on('mouseleave', 'clusters', setCursor(''));
      map.on('mouseenter', 'points', setCursor('pointer'));
      map.on('mouseleave', 'points', setCursor(''));
    });

    return () => { map.remove(); mapRef.current = null; readyRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh source data when screens / selection change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource('screens') as maplibregl.GeoJSONSource | undefined;
    src?.setData(toGeoJSON(screens, new Set(selectedIds)));
  }, [screens, selectedIds]);

  // Build the popup DOM (textContent everywhere → no HTML injection).
  function buildPopup(s: Screen): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:Inter,sans-serif;min-width:190px';
    const name = document.createElement('div');
    name.textContent = s.name;
    name.style.cssText = 'font-weight:800;font-size:13px;color:#16213A;line-height:1.2';
    const meta = document.createElement('div');
    meta.textContent = `${s.area} · ${s.city}`;
    meta.style.cssText = 'font-size:11px;color:#5B6B85;margin:2px 0 8px';
    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:12px;font-size:11px;color:#16213A;margin-bottom:10px';
    stats.innerHTML = '';
    const reach = document.createElement('div');
    reach.innerHTML = `<div style="color:#5B6B85">Bereik/week</div><b>${fmtInt(s.weeklyReach)}</b>`;
    const price = document.createElement('div');
    price.innerHTML = `<div style="color:#5B6B85">Prijs/week</div><b style="color:${AMBER}">€${fmtInt(s.weeklyPrice)}</b>`;
    stats.append(reach, price);

    const btn = document.createElement('button');
    const already = addedRef.current.has(s.id);
    btn.textContent = already ? 'Al toegevoegd ✓' : 'Voeg toe aan campagne';
    btn.disabled = already;
    btn.style.cssText =
      `width:100%;border:0;border-radius:999px;padding:8px 12px;font-weight:700;font-size:12px;cursor:${already ? 'default' : 'pointer'};` +
      `background:${already ? '#EAF0FF' : COBALT};color:${already ? '#2456E6' : '#fff'}`;
    btn.onclick = () => {
      onAddRef.current(s);
      btn.textContent = 'Toegevoegd ✓';
      btn.disabled = true;
      btn.style.background = '#EAF0FF';
      btn.style.color = '#2456E6';
      btn.style.cursor = 'default';
    };

    wrap.append(name, meta, stats, btn);
    return wrap;
  }

  return (
    <div
      ref={containerRef}
      className="screenmap"
      aria-label="Kaart met stationsschermen"
    />
  );
}
