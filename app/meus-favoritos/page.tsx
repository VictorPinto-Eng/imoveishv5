'use client'

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImovelCard from '@/components/ImovelCard';
import { Imovel } from '@/lib/imoveis';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MeusFavoritosPage() {
  const [favorites, setFavorites] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserDataAndFavorites = async () => {
      try {
        // 1. Check auth
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        if (!authRes.ok || !authData.authenticated) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        setAuthenticated(true);

        // 2. Fetch favorites
        const favRes = await fetch('/api/user/favorites');
        const favData = await favRes.json();
        
        if (favRes.ok && favData.success) {
          setFavorites(favData.favorites || []);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndFavorites();
  }, []);

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', backgroundColor: '#f8fafc', paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ 
              backgroundColor: 'rgba(127, 52, 230, 0.1)', 
              color: '#7F34E6', 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Heart size={24} fill="#7F34E6" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                Meus Favoritos
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Gerencie os imóveis que você favoritou na plataforma
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: '#7F34E6' }} />
              <p style={{ color: '#64748b', fontWeight: 500 }}>Carregando seus favoritos...</p>
            </div>
          ) : authenticated === false ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '20px', 
              padding: '60px 40px', 
              textAlign: 'center', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              maxWidth: '500px',
              margin: '40px auto'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔐</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Acesso Restrito</h2>
              <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                Você precisa estar conectado à sua conta para visualizar e gerenciar seus imóveis favoritos.
              </p>
              <button 
                onClick={() => {
                  const loginBtn = document.querySelector('button[class*="loginButtonPill"]') as HTMLButtonElement;
                  if (loginBtn) loginBtn.click();
                }}
                style={{ 
                  backgroundColor: '#7F34E6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '12px 24px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(127,52,230,0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                Fazer Login
              </button>
            </div>
          ) : favorites.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '20px', 
              padding: '80px 40px', 
              textAlign: 'center', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✨</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Sua lista está vazia</h2>
              <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
                Você ainda não favoritou nenhum imóvel. Explore nossa lista de opções e clique no ícone de coração para salvá-los aqui!
              </p>
              <Link 
                href="/imoveis"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#7F34E6', 
                  color: 'white', 
                  borderRadius: '12px', 
                  padding: '14px 28px', 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(127,52,230,0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <span>Buscar Imóveis</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '24px',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              {favorites.map(imovel => (
                <ImovelCard 
                  key={imovel.id} 
                  imovel={imovel} 
                  onFavoriteToggle={(id, isFav) => {
                    if (!isFav) {
                      setFavorites(prev => prev.filter(item => String(item.id) !== String(id)));
                    }
                  }}
                />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
