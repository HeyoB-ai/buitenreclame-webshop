/**
 * Small, STATIC MapLibre map for the detail modal: centered on the screen's real
 * coordinates with a single marker. Non-interactive (no drag/zoom/animation), so
 * it also satisfies prefers-reduced-motion by construction.
 *
 * Uses the same keyless CARTO Positron basemap as the big map. Heavy
 * (maplibre-gl), so the modal lazy-loads this component.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE: maplibregl.StyleSpecification = {
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
      attribution: '© OpenStreetMap · CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

export default function ScreenMiniMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [lng, lat],
      zoom: 13.5,
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.on('load', () => {
      new maplibregl.Marker({ color: '#2456E6' }).setLngLat([lng, lat]).addTo(map);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [lat, lng]);

  return <div ref={ref} style={{ width: '100%', height: 112, borderRadius: 10, overflow: 'hidden' }} />;
}
