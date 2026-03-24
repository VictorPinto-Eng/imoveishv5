
'use client'

import { useState } from 'react'

export default function ImageGallery({ images, alt }: { images: string[], alt: string }) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const next = () => setCurrentIndex(prev => (prev + 1) % images.length)
    const prev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)

    if (!images || images.length === 0) return null

    return (
        <div style={{
            position: 'relative',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: '#f1f5f9',
            aspectRatio: '4/3'
        }}>
            <img
                src={images[currentIndex]}
                alt={`${alt} - Foto ${currentIndex + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        style={{
                            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                            width: '2.5rem', height: '2.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        ←
                    </button>
                    <button
                        onClick={next}
                        style={{
                            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                            width: '2.5rem', height: '2.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        →
                    </button>
                    <div style={{
                        position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: '0.5rem'
                    }}>
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '0.5rem', height: '0.5rem', borderRadius: '50%',
                                    background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
