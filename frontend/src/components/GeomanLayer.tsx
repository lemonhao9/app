import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import type { Zone } from '../services/zones';

export interface GeomanLayerHandle {
  clearPending: () => void;
  getEditedGeoJSON: (zoneId: number) => { geojson: GeoJSON.Feature; bounds: L.LatLngBounds } | null;
}

interface Props {
  zones: Zone[];
  editingZoneId: number | null;
  onCreate: (geojson: GeoJSON.Feature, bounds: L.LatLngBounds) => void;
}

export const GeomanLayer = forwardRef<GeomanLayerHandle, Props>(function GeomanLayer({ zones, editingZoneId, onCreate }, ref) {
  const map = useMap();
  const layersRef = useRef<{ zoneId: number; layer: L.GeoJSON }[]>([]);
  const pendingLayerRef = useRef<L.Layer | null>(null);

  useImperativeHandle(ref, () => ({
    clearPending: () => {
      if (pendingLayerRef.current) {
        map.removeLayer(pendingLayerRef.current);
        pendingLayerRef.current = null;
      }
    },
    getEditedGeoJSON: (zoneId) => {
      const entry = layersRef.current.find(l => l.zoneId === zoneId);
      if (!entry) return null;
      let result: { geojson: GeoJSON.Feature; bounds: L.LatLngBounds } | null = null;
      entry.layer.eachLayer((l: any) => {
        result = { geojson: l.toGeoJSON(), bounds: l.getBounds() };
      });
      return result;
    },
  }));

  useEffect(() => {
    map.pm.addControls({
      position: 'topright',
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      editMode: false,
      dragMode: false,
      removalMode: false,
    });

    const handleCreate = (e: any) => {
      pendingLayerRef.current = e.layer;
      onCreate(e.layer.toGeoJSON(), e.layer.getBounds());
    };

    map.on('pm:create', handleCreate);
    return () => {
      map.pm.removeControls();
      map.off('pm:create', handleCreate);
    };
  }, [map, onCreate]);

  useEffect(() => {
    layersRef.current.forEach(({ layer }) => map.removeLayer(layer));
    layersRef.current = zones.map(zone => {
      const layer = L.geoJSON(zone.geojson, { style: { color: zone.color || '#3388ff', fillOpacity: 0.2 } });
      layer.bindTooltip(zone.name);
      layer.addTo(map);
      if (zone.zone_id === editingZoneId) {
        layer.eachLayer((l: any) => l.pm.enable());
      }
      return { zoneId: zone.zone_id, layer };
    });
    return () => { layersRef.current.forEach(({ layer }) => map.removeLayer(layer)); };
  }, [map, zones, editingZoneId]);

  return null;
});
