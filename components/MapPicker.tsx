'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenLocationCode } from 'open-location-code';
import styles from './MapPicker.module.css';
import { X } from 'lucide-react';

interface MapPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number, plusCode: string) => void;
    initialLat?: number | null;
    initialLng?: number | null;
    initialZoom?: number;
    addressZoom?: number;
    addressContext?: string;
    addressData?: {
        street?: string;
        number?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        postalCode?: string;
    };
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

function MapEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

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

export default function MapPicker({
    isOpen,
    onClose,
    onSelect,
    initialLat,
    initialLng,
    addressZoom = 17,
    addressContext,
    addressData
}: MapPickerProps) {
    const [lat, setLat] = useState<number | null>(initialLat || null);
    const [lng, setLng] = useState<number | null>(initialLng || null);
    const [plusCode, setPlusCode] = useState<string>('');
    const [center, setCenter] = useState<[number, number]>([-14.235, -51.9253]);
    const [zoom, setZoom] = useState<number>(4);
    const [mapType, setMapType] = useState<'map' | 'satellite'>('map');

    useEffect(() => {
        fixLeafletIcon();
    }, []);

    useEffect(() => {
        const geocodeAddress = async () => {
            if (isOpen && !initialLat && !initialLng && (addressData || addressContext)) {
                try {
                    let data = [];
                    // 1. Try MOST Specific Structured Search (Street + Number)
                    if (addressData) {
                        const streetWithNumber = `${addressData.street || ''}${addressData.number ? `, ${addressData.number}` : ''}`.trim();
                        const params = new URLSearchParams({ format: 'json', limit: '1', addressdetails: '1', country: 'Brazil' });
                        if (streetWithNumber) params.append('street', streetWithNumber);
                        if (addressData.neighborhood) params.append('suburb', addressData.neighborhood);
                        if (addressData.city) params.append('city', addressData.city);
                        if (addressData.postalCode) params.append('postalcode', addressData.postalCode.replace(/\D/g, ''));

                        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
                        data = await res.json();

                        // 2. Fallback to Structured Search without Number (if street was too specific)
                        if ((!data || data.length === 0) && streetWithNumber !== addressData.street) {
                            const params2 = new URLSearchParams({ format: 'json', limit: '1', addressdetails: '1', country: 'Brazil' });
                            if (addressData.street) params2.append('street', addressData.street);
                            if (addressData.neighborhood) params2.append('suburb', addressData.neighborhood);
                            if (addressData.city) params2.append('city', addressData.city);
                            if (addressData.postalCode) params2.append('postalcode', addressData.postalCode.replace(/\D/g, ''));
                            const res2 = await fetch(`https://nominatim.openstreetmap.org/search?${params2.toString()}`);
                            data = await res2.json();
                        }

                        // 3. Fallback to Postal Code ONLY (highest reliability for general area)
                        if ((!data || data.length === 0) && addressData.postalCode) {
                            const cleanZip = addressData.postalCode.replace(/\D/g, '');
                            const res3 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(cleanZip)}&country=Brazil&limit=1`);
                            data = await res3.json();
                        }
                    }

                    // 4. Final Fallback to addressContext (keyword search)
                    if ((!data || data.length === 0) && addressContext) {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressContext)}&limit=1`, {
                            headers: { 'Accept-Language': 'pt-BR' }
                        });
                        data = await response.json();
                    }

                    if (data && data.length > 0) {
                        const { lat: pLat, lon: pLon } = data[0];
                        const parsedLat = parseFloat(pLat);
                        const parsedLng = parseFloat(pLon);
                        setCenter([parsedLat, parsedLng]);
                        setZoom(addressZoom);
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                }
            }
        };

        if (isOpen) {
            if (initialLat && initialLng) {
                setLat(initialLat);
                setLng(initialLng);
                setCenter([initialLat, initialLng]);
                setZoom(16);
            } else {
                geocodeAddress();
            }
        }
    }, [isOpen, initialLat, initialLng, addressContext, addressData, addressZoom]);

    useEffect(() => {
        if (lat !== null && lng !== null) {
            try {
                // @ts-ignore
                const OLC = OpenLocationCode.OpenLocationCode || OpenLocationCode;
                const code = new OLC().encode(lat, lng, 10);
                setPlusCode(code);
            } catch (err) {
                console.error('Error encoding plus code:', err);
            }
        }
    }, [lat, lng]);

    const handlePick = (pickedLat: number, pickedLng: number) => {
        setLat(pickedLat);
        setLng(pickedLng);
    };

    const handleConfirm = () => {
        if (lat !== null && lng !== null) {
            let finalPlusCode = plusCode;
            if (!finalPlusCode) {
                try {
                    // @ts-ignore
                    const OLC = OpenLocationCode.OpenLocationCode || OpenLocationCode;
                    const olc = new OLC();
                    finalPlusCode = olc.encode(lat, lng, 10);
                } catch (e) {
                    console.error('PlusCode generation failed in confirm:', e);
                }
            }
            onSelect(lat, lng, finalPlusCode || '');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.title}>Definir Localização</h2>
                        <p className={styles.subtitle}>Clique no mapa para posicionar o marcador precisamente.</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.mapContainer}>
                    <MapContainer
                        center={center}
                        zoom={zoom}
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
                        <ChangeView center={center} zoom={zoom} />
                        <MapEvents onPick={handlePick} />
                        {lat && lng && (
                            <Marker position={[lat, lng]} />
                        )}
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
                    <div className={styles.selectionInfo}>
                        <div className={styles.pulse} />
                        {lat && lng ? (
                            <span>Ponto Selecionado: <span className={styles.coordValue}>{lat.toFixed(6)}, {lng.toFixed(6)}</span></span>
                        ) : (
                            <span>Nenhum ponto selecionado.</span>
                        )}
                    </div>
                    
                    <div className={styles.footerActions}>
                        <button className={styles.btnSecondary} onClick={onClose}>
                            Cancelar
                        </button>
                        <button 
                            className={styles.btnPrimary} 
                            onClick={handleConfirm}
                            disabled={!lat || !lng}
                        >
                            Aplicar Coordenadas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
