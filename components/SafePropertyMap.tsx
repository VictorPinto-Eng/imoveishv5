'use client';

import dynamic from 'next/dynamic';
import type { PropertyMapProps } from './PropertyMap';

/**
 * Safe wrapper for PropertyMap to avoid SSR errors in Node.js environment.
 * PropertyMap uses react-leaflet, which requires the browser 'window' object.
 */
const PropertyMap = dynamic<PropertyMapProps>(() => import('./PropertyMap'), { 
    ssr: false,
    loading: () => (
        <div style={{ 
            height: '400px', 
            width: '100%', 
            background: '#f8fafc', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
        }}>
            Carregando mapa...
        </div>
    )
});

export default function SafePropertyMap(props: PropertyMapProps) {
    return <PropertyMap {...props} />;
}
