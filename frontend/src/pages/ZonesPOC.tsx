import { MapContainer, TileLayer } from 'react-leaflet';
import { GeomanLayer } from '../components/GeomanLayer';
import { NavBar } from '../components/ui/NavBar';

export function ZonesPOC() {
    return (
        <div>
            <NavBar dark />
            <h1 style={{ textAlign: 'center' }}>Zones POC</h1>
        <MapContainer center={[45.7640, 4.8357]} zoom={13} style={{height: '600px', width: '600px', margin: '0 auto'}}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors" />
            <GeomanLayer />
        </MapContainer>
                </div>
    );
}