'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapViewerModal.module.css';
import { X, Navigation, Map as MapIcon } from 'lucide-react';

interface MapViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    latitude: number;
    longitude: number;
    address?: string;
    propertyName?: string;
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

export default function MapViewerModal({
    isOpen,
    onClose,
    latitude,
    longitude,
    address,
    propertyName
}: MapViewerModalProps) {
    const [mapType, setMapType] = useState<'map' | 'satellite'>('map');

    useEffect(() => {
        fixLeafletIcon();
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const center: [number, number] = [latitude, longitude];

    const handleTraceRoute = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(url, '_blank');
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2>Localização do Imóvel</h2>
                        <p>{propertyName || address || 'Vizualização ampliada'}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.mapContainer}>
                    <MapContainer
                        center={center}
                        zoom={17}
                        className={styles.leafletContainer}
                    >
                        {mapType === 'map' ? (
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        ) : (
                            <TileLayer
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        )}
                        <ChangeView center={center} zoom={17} />
                        <Marker position={center} />
                    </MapContainer>

                    <button 
                        className={styles.satelliteToggle}
                        onClick={() => setMapType(mapType === 'map' ? 'satellite' : 'map')}
                        title={mapType === 'map' ? 'Mudar para Satélite' : 'Mudar para Mapa'}
                    >
                        <div className={`${styles.thumbWrapper} ${mapType === 'satellite' ? styles.thumbWrapperActive : ''}`}>
                            <img 
                                src={mapType === 'map' 
                                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/18571/10534" 
                                    : "https://a.tile.openstreetmap.org/15/18571/10534.png"
                                }
                                alt="Toggle Map Type"
                                className={styles.thumbImg}
                            />
                        </div>
                    </button>
                </div>

                <div className={styles.footer}>
                    <button className={styles.routeButton} onClick={handleTraceRoute}>
                        <Navigation size={20} />
                        <span>Traçar Rota no Google Maps</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
