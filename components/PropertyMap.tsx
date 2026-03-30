'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Maximize2 } from 'lucide-react';
import styles from './PropertyMap.module.css';
import MapViewerModal from './MapViewerModal';

export interface PropertyMapProps {
    latitude: number | null | undefined;
    longitude: number | null | undefined;
    address?: string;
}

// Fixed Leaflet icon issue
const fixLeafletIcon = () => {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
    }
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }, [center, zoom, map]);
    return null;
}

export default function PropertyMap({ latitude, longitude, address }: PropertyMapProps) {
    const [isViewerOpen, setIsViewerOpen] = React.useState(false);

    useEffect(() => {
        fixLeafletIcon();
    }, []);

    const handleTraceRoute = () => {
        if (latitude && longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            window.open(url, '_blank');
        } else if (address) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        }
    };

    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return (
            <div className={styles.mapContainer}>
                <div className={styles.emptyMap}>
                    <MapPin size={48} strokeWidth={1} />
                    <p>A localização exata ainda não foi cadastrada para este imóvel.</p>
                </div>
            </div>
        );
    }

    const center: [number, number] = [latitude, longitude];

    return (
        <div className={styles.mapContainer}>
            <MapContainer
                center={center}
                zoom={16}
                className={styles.leafletContainer}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={center} zoom={16} />
                <Marker position={center} />
            </MapContainer>

            <div className={styles.routeOverlay}>
                <button className={styles.expandButton} onClick={() => setIsViewerOpen(true)} title="Ver mapa ampliado">
                    <Maximize2 size={18} />
                    <span>Ver Mapa Maior</span>
                </button>
                <button className={styles.routeButton} onClick={handleTraceRoute}>
                    <Navigation size={18} />
                    <span>Traçar Rota</span>
                </button>
            </div>

            <MapViewerModal 
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                latitude={latitude}
                longitude={longitude}
                address={address}
            />
        </div>
    );
}
