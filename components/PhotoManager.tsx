
'use client'

import React, { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { Camera, Trash2, Upload, MoreVertical, Layout, Lock, Eye, UploadCloud, Move } from 'lucide-react';
import styles from './photoManager.module.css';
import PhotoDetailsModal from '@/components/PhotoDetailsModal';

export interface Photo {
    id: number;
    url_referencia: string;
    legenda: string | null;
    categoria: string;
    foto_principal: boolean;
    privada: boolean;
}

interface PhotoManagerProps {
    imovelId: number;
    initialPhotos: Photo[];
    onUpdate?: () => void;
    isReordering?: boolean;
}

export default function PhotoManager({ imovelId, initialPhotos, onUpdate, isReordering }: PhotoManagerProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos || []);
    const [uploading, setUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isUploadingRef = useRef(false);
    const [draggedPhotoId, setDraggedPhotoId] = useState<number | null>(null);

    const loadPhotos = async () => {
        try {
            const res = await fetch(`/api/property/${imovelId}/photos`);
            const data = await res.json();
            if (data.success) {
                setPhotos(data.photos);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Error loading photos:', error);
        }
    };

    useEffect(() => {
        // Se já temos fotos iniciais, não precisamos dar fetch imediatamente 
        // (ou podemos dar fetch em background se quisermos garantir sincronia)
        if (initialPhotos && initialPhotos.length > 0) {
            setPhotos(initialPhotos);
        } else {
            loadPhotos();
        }
    }, [imovelId, initialPhotos]);

    const convertToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert to WebP'));
                }, 'image/webp', 0.85); // 0.85 quality is a good balance
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });
    };

    const handleUploadFiles = async (fileArray: File[]) => {
        if (isUploadingRef.current) return;
        
        console.log(`Iniciando upload de ${fileArray.length} arquivos...`);
        isUploadingRef.current = true;
        setUploading(true);
        try {
            for (let i = 0; i < fileArray.length; i++) {
                const originalFile = fileArray[i];
                let fileToUpload: File | Blob = originalFile;
                let fileName = originalFile.name;

                console.log(`Processando arquivo ${i + 1}: ${fileName} (${originalFile.type})`);

                // Only convert if it's an image and not already WebP
                if (originalFile.type.startsWith('image/')) {
                    try {
                        console.log('Convertendo para WebP...');
                        fileToUpload = await convertToWebP(originalFile);
                        fileName = originalFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                        console.log('Conversão concluída.');
                    } catch (err) {
                        console.warn('Falha na conversão para WebP, usando original:', err);
                    }
                }

                const formData = new FormData();
                formData.append('file', fileToUpload, fileName);

                console.log(`Enviando para a API: /api/property/${imovelId}/photos`);
                const res = await fetch(`/api/property/${imovelId}/photos`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                console.log('Resposta da API:', data);

                if (data.success && data.photo) {
                    // Adiciona a nova foto ao estado local imediatamente para feedback visual
                    setPhotos(prev => [...prev, data.photo]);
                }

                if (!res.ok) {
                    const errorMsg = data.error || `Erro ao subir arquivo ${fileName}`;
                    console.error('Upload falhou no servidor:', errorMsg);
                    alert(errorMsg);
                }
            }
            
            console.log('Todos os uploads finalizados. Sincronizando com o banco...');
            await loadPhotos();

        } catch (error) {
            console.error('Erro crítico no upload:', error);
            alert('Ocorreu um erro ao enviar as fotos. Por favor, tente novamente.');
        } finally {
            isUploadingRef.current = false;
            setUploading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        if (fileInputRef.current) fileInputRef.current.value = '';

        await handleUploadFiles(fileArray);
    };

    const handleFileDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Se estivermos em modo de reordenamento, não fazemos upload por drop aqui
        if (isReordering) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await handleUploadFiles(Array.from(files));
        }
    };

    const handleGlobalDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDelete = async (e: React.MouseEvent, photoId: number) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta foto?')) return;
        try {
            const res = await fetch(`/api/property/${imovelId}/photos?photoId=${photoId}`, {
                method: 'DELETE'
            });
            if (res.ok) await loadPhotos();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleSetPrincipal = async (e: React.MouseEvent, photoId: number) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/property/${imovelId}/photos`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId, setPrincipal: true })
            });
            if (res.ok) await loadPhotos();
        } catch (error) {
            console.error('Set principal error:', error);
        }
    };

    const handleDragStart = (e: React.DragEvent, id: number) => {
        if (!isReordering) return;
        setDraggedPhotoId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (!isReordering || draggedPhotoId === null || draggedPhotoId === targetId) return;

        const newPhotos = [...photos];
        const draggedIndex = newPhotos.findIndex(p => p.id === draggedPhotoId);
        const targetIndex = newPhotos.findIndex(p => p.id === targetId);

        const [draggedItem] = newPhotos.splice(draggedIndex, 1);
        newPhotos.splice(targetIndex, 0, draggedItem);
        setPhotos(newPhotos);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (!isReordering) return;
        
        setDraggedPhotoId(null);
        
        try {
            const items = photos.map((p, i) => ({ id: p.id, ordem_exibicao: i }));
            const res = await fetch(`/api/property/${imovelId}/photos`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            if (!res.ok) throw new Error('Order fail');
        } catch (error) {
            console.error('Save order error:', error);
        }
    };

    return (
        <div className={styles.manager}>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }}
                accept="image/*" 
                multiple 
                onChange={handleUpload} 
            />

            {photos.length === 0 ? (
                <div className={styles.emptyContainer}>
                    <div 
                        className={styles.dropzoneEmpty} 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleGlobalDragOver}
                        onDrop={handleFileDrop}
                    >
                        <UploadCloud size={48} color="#118B8A" />
                        <span className={styles.dropzoneTextEmpty}>
                            {uploading ? 'Enviando...' : 'Solte ou clique para enviar fotos'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className={styles.grid}>
                    {/* Dropzone dentro da grid */}
                    <div 
                        className={styles.dropzone} 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleGlobalDragOver}
                        onDrop={handleFileDrop}
                    >
                        <div className={styles.iconCircle}>
                            <UploadCloud size={20} />
                        </div>
                        <span className={styles.dropzoneText}>
                            {uploading ? 'Enviando...' : 'Adicionar fotos'}
                        </span>
                    </div>

                    {/* Photos */}
                {photos.map((photo, index) => (
                    <div 
                        key={photo.id} 
                        draggable={isReordering}
                        onDragStart={(e) => handleDragStart(e, photo.id)}
                        onDragOver={(e) => handleDragOver(e, photo.id)}
                        onDrop={handleDrop}
                        className={`${styles.photoCard} ${photo.foto_principal ? styles.principal : ''} ${draggedPhotoId === photo.id ? 'opacity-50' : ''}`}
                        onClick={() => {
                            if (!isReordering) setSelectedPhoto(photo);
                        }}
                    >
                        <NextImage 
                            src={`${photo.url_referencia}?t=${new Date().getTime()}`} 
                            alt={photo.legenda || 'Foto'} 
                            fill 
                            unoptimized={true}
                            className={styles.image}
                        />

                        {photo.foto_principal && (
                            <div className={styles.badgePrincipal}>Capa</div>
                        )}

                        <div className={photo.foto_principal ? styles.overlayAlways : styles.overlay}>
                            
                            {!isReordering && (
                                <div className={styles.deleteContainer}>
                                    <button 
                                        className={styles.deleteBtn}
                                        onClick={(e) => handleDelete(e, photo.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            {isReordering && (
                                <div className={styles.moveIconContainer}>
                                    <Move size={32} color="white" />
                                </div>
                            )}

                            <div className={styles.bottomButtons}>
                                <button 
                                    className={`${styles.bottomBtn} ${photo.foto_principal ? styles.btnCapaActive : styles.btnCapaInactive}`}
                                    onClick={(e) => {
                                        if(!isReordering && !photo.foto_principal) handleSetPrincipal(e, photo.id);
                                        e.stopPropagation();
                                    }}
                                >
                                    CAPA
                                </button>
                                <button 
                                    className={`${styles.bottomBtn} ${!photo.foto_principal ? styles.btnCapaActive : styles.btnCapaInactive}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    CAPA INTERNA
                                </button>
                            </div>
                            
                            {photo.legenda && (
                                <div className={styles.photoLegenda}>
                                    {photo.legenda}
                                </div>
                            )}

                            {photo.privada && (
                                <div className="absolute bottom-2 right-2 text-white bg-black/50 p-1 rounded">
                                    <Lock size={10} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                </div>
            )}

            {selectedPhoto && (
                <PhotoDetailsModal 
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    onSave={async (data: { legenda: string; categoria: string; privada: boolean }) => {
                        const res = await fetch(`/api/property/${imovelId}/photos`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photoId: selectedPhoto.id, ...data })
                        });
                        if (res.ok) await loadPhotos();
                    }}
                />
            )}
        </div>
    );
}
