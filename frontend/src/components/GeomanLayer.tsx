import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';

export function GeomanLayer() {
    const map = useMap();

    useEffect(() => {
        map.pm.addControls({
            position: 'topleft',
                drawMarker: false,
                    drawCircle: false,
                        drawCircleMarker: false,
                            drawPolyline: false,
                                drawRectangle: false,
                                    drawPolygon: true,
                                        editMode: true,
                                            dragMode: true,
                                                removalMode: true,
        });

    map.on('pm:create', (e: any) => {
        const geojson = e.layer.toGeoJSON();
        console.log('GeoJson exporté : ', JSON.stringify(geojson, null, 2));
    });
    return () => {
        map.pm.removeControls();
        map.off('pm:create');
    };
}, [map]);

return null;
}