/**
 * Real map of the ESH gemeenten, with native MapLibre clustering.
 *
 * Basemap: CARTO "Positron" raster tiles — free and KEYLESS (attribution
 * required, added below). For production at scale you may want your own tile
 * provider / usage agreement; swapping the `raster` source URL here is all it
 * takes.
 *
 * Every gemeente is one point in a clustered GeoJSON source: zoomed out you see
 * cluster bubbles with a count; zooming in (or clicking a cluster) splits them
 * into individual points. Clicking one opens a popup with its figures and a
 * "Voeg toe aan campagne" button that uses the same cart flow as the cards.
 *
 * This module statically imports maplibre-gl (heavy), so the parent lazy-loads it
 * (React.lazy) to keep it out of the initial bundle.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { reachOf, isUitverkocht, type Gemeente } from '../../data/gemeenten';

const COBALT = '#2456E6';
const AMBER = '#DE8A06';
const MIST = '#9AA7BD';
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
  gemeenten: Gemeente[];
  /** Ids of gemeenten in the current plan — highlighted in amber. */
  selectedIds?: string[];
  onAddGemeente: (gemeente: Gemeente) => void;
  addedIds?: string[];
}

function toGeoJSON(gemeenten: Gemeente[], selected: Set<string>): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: gemeenten
      .filter((g) => Number.isFinite(g.lat) && Number.isFinite(g.lng) && !(g.lat === 0 && g.lng === 0))
      .map((g) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
        properties: {
          id: g.id,
          sel: selected.has(g.id) ? 1 : 0,
          vol: isUitverkocht(g) ? 1 : 0,
        },
      })),
  };
}

export default function GemeenteMap({ gemeenten, selectedIds = [], onAddGemeente, addedIds = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);

  // Keep the latest props in refs so map event handlers never go stale.
  const byId = useRef(new Map<string, Gemeente>());
  byId.current = new Map(gemeenten.map((g) => [g.id, g]));
  const onAddRef = useRef(onAddGemeente);
  onAddRef.current = onAddGemeente;
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
      map.addSource('gemeenten', {
        type: 'geojson',
        data: toGeoJSON(gemeenten, new Set(selectedIds)),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 44,
      });

      // Cluster bubbles — cobalt, growing with count.
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'gemeenten',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': COBALT,
          'circle-opacity': 0.9,
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 12, 30],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(36,86,230,0.25)',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'gemeenten',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
        paint: { 'text-color': '#FFFFFF' },
      });

      // Single gemeenten — amber in the plan, grey when sold out, cobalt otherwise.
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'gemeenten',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'sel'], 1], AMBER,
            ['==', ['get', 'vol'], 1], MIST,
            COBALT,
          ],
          'circle-radius': ['case', ['==', ['get', 'sel'], 1], 9, 7],
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
        const src = map.getSource('gemeenten') as maplibregl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          const center = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number];
          if (reduced) map.jumpTo({ center, zoom });
          else map.easeTo({ center, zoom });
        }).catch(() => {});
      });

      // Popup for a single gemeente.
      map.on('click', 'points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const g = byId.current.get(f.properties?.id as string);
        if (!g) return;
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px', offset: 12 })
          .setLngLat(coords)
          .setDOMContent(buildPopup(g))
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

  // Refresh source data when gemeenten / selection change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource('gemeenten') as maplibregl.GeoJSONSource | undefined;
    src?.setData(toGeoJSON(gemeenten, new Set(selectedIds)));
  }, [gemeenten, selectedIds]);

  // Build the popup DOM (textContent everywhere → no HTML injection).
  function buildPopup(g: Gemeente): HTMLElement {
    const vol = isUitverkocht(g);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:Inter,sans-serif;min-width:190px';

    const name = document.createElement('div');
    name.textContent = g.name;
    name.style.cssText = 'font-weight:800;font-size:13px;color:#16213A;line-height:1.2';

    const meta = document.createElement('div');
    meta.textContent = `${g.province} · plaatsing op ${g.plaatsingsdag}`;
    meta.style.cssText = 'font-size:11px;color:#5B6B85;margin:2px 0 8px';

    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:12px;font-size:11px;color:#16213A;margin-bottom:6px';
    const reach = document.createElement('div');
    reach.innerHTML = `<div style="color:#5B6B85">Bereik/week</div><b>${fmtInt(reachOf(g))}</b>`;
    const price = document.createElement('div');
    price.innerHTML = `<div style="color:#5B6B85">Richtprijs/week</div><b style="color:${AMBER}">€${fmtInt(g.weeklyPrice)}</b>`;
    stats.append(reach, price);

    const avail = document.createElement('div');
    avail.textContent = vol
      ? 'Deze week volgeboekt'
      : `Indicatief: nog ${fmtInt(g.displaysVrij)} van ${fmtInt(g.displays)} displays vrij`;
    avail.style.cssText = `font-size:10px;color:${vol ? '#B4472F' : '#5B6B85'};margin-bottom:10px`;

    const btn = document.createElement('button');
    const already = addedRef.current.has(g.id);
    const disabled = already || vol;
    btn.textContent = vol ? 'Volgeboekt' : already ? 'Al toegevoegd ✓' : 'Voeg toe aan campagne';
    btn.disabled = disabled;
    btn.style.cssText =
      `width:100%;border:0;border-radius:999px;padding:8px 12px;font-weight:700;font-size:12px;cursor:${disabled ? 'default' : 'pointer'};` +
      `background:${disabled ? '#EAF0FF' : COBALT};color:${disabled ? '#2456E6' : '#fff'}`;
    if (!disabled) {
      btn.onclick = () => {
        onAddRef.current(g);
        btn.textContent = 'Toegevoegd ✓';
        btn.disabled = true;
        btn.style.background = '#EAF0FF';
        btn.style.color = '#2456E6';
        btn.style.cursor = 'default';
      };
    }

    wrap.append(name, meta, stats, avail, btn);
    return wrap;
  }

  return (
    <div
      ref={containerRef}
      className="screenmap"
      aria-label="Kaart met ESH-gemeenten"
    />
  );
}
