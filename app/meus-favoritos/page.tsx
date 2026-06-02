'use client'

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImovelCard from '@/components/ImovelCard';
import { Imovel } from '@/lib/imoveis';
import { Heart, Loader2, ArrowRight, FileText, MessageSquare, ExternalLink, Calendar, Info, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

type TabType = 'favoritos' | 'propostas' | 'mensagens';

export default function MeusFavoritosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('favoritos');
  const [favorites, setFavorites] = useState<Imovel[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserDataAndFavorites = async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        if (!authRes.ok || !authData.authenticated) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        setAuthenticated(true);

        // Fetch favorites
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

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await fetch('/api/user/proposals');
      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch('/api/user/messages');
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'propostas' && proposals.length === 0) {
      fetchProposals();
    } else if (tab === 'mensagens' && messages.length === 0) {
      fetchMessages();
    }
  };

  const formatBRL = (value: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aceita':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.775rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <CheckCircle size={14} /> Aceita
          </span>
        );
      case 'recusada':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.775rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <XCircle size={14} /> Recusada
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.775rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <Clock size={14} /> Pendente
          </span>
        );
    }
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', backgroundColor: '#f8fafc', paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Header Panel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ 
              backgroundColor: 'rgba(127, 52, 230, 0.1)', 
              color: '#7F34E6', 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Heart size={28} fill={activeTab === 'favoritos' ? '#7F34E6' : 'none'} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                Meu Painel
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Gerencie seus favoritos, propostas enviadas e histórico de contatos
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {authenticated && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              borderBottom: '1px solid #e2e8f0', 
              marginBottom: '32px',
              paddingBottom: '2px',
              overflowX: 'auto'
            }}>
              <button 
                onClick={() => handleTabChange('favoritos')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  background: 'none',
                  padding: '12px 20px',
                  fontSize: '0.975rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  color: activeTab === 'favoritos' ? '#7F34E6' : '#64748b',
                  borderBottom: activeTab === 'favoritos' ? '3px solid #7F34E6' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Heart size={18} fill={activeTab === 'favoritos' ? '#7F34E6' : 'none'} />
                Favoritos ({favorites.length})
              </button>

              <button 
                onClick={() => handleTabChange('propostas')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  background: 'none',
                  padding: '12px 20px',
                  fontSize: '0.975rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  color: activeTab === 'propostas' ? '#7F34E6' : '#64748b',
                  borderBottom: activeTab === 'propostas' ? '3px solid #7F34E6' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <FileText size={18} />
                Minhas Propostas
              </button>

              <button 
                onClick={() => handleTabChange('mensagens')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  background: 'none',
                  padding: '12px 20px',
                  fontSize: '0.975rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  color: activeTab === 'mensagens' ? '#7F34E6' : '#64748b',
                  borderBottom: activeTab === 'mensagens' ? '3px solid #7F34E6' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <MessageSquare size={18} />
                Mensagens Enviadas
              </button>
            </div>
          )}

          {/* Main Content Area */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: '#7F34E6' }} />
              <p style={{ color: '#64748b', fontWeight: 500 }}>Carregando dados do painel...</p>
            </div>
          ) : authenticated === false ? (
            /* Restricted Access State */
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '24px', 
              padding: '60px 40px', 
              textAlign: 'center', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #e2e8f0',
              maxWidth: '500px',
              margin: '40px auto'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🔐</div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Acesso Restrito</h2>
              <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
                Você precisa estar conectado à sua conta para gerenciar favoritos, propostas e histórico de contatos.
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
                  padding: '14px 28px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(127,52,230,0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                Fazer Login
              </button>
            </div>
          ) : (
            <>
              {/* TAB: FAVORITES */}
              {activeTab === 'favoritos' && (
                favorites.length === 0 ? (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '24px', 
                    padding: '80px 40px', 
                    textAlign: 'center', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>✨</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Sua lista está vazia</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
                      Você ainda não favoritou nenhum imóvel. Explore nossa lista de opções e salve seus favoritos para comparar depois!
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
                    animation: 'fadeIn 0.4s ease-out'
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
                )
              )}

              {/* TAB: PROPOSALS */}
              {activeTab === 'propostas' && (
                proposalsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 className="animate-spin" size={36} style={{ color: '#7F34E6' }} />
                  </div>
                ) : proposals.length === 0 ? (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '24px', 
                    padding: '80px 40px', 
                    textAlign: 'center', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>📝</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Nenhuma proposta enviada</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
                      Você ainda não enviou propostas de compra ou locação para nenhum imóvel.
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
                    >
                      <span>Explorar Imóveis</span>
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease-out' }}>
                    {proposals.map((proposal) => (
                      <div 
                        key={proposal.proposal_id}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '20px',
                          padding: '24px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          transition: 'transform 0.2s',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {proposal.photo ? (
                              <img 
                                src={proposal.photo} 
                                alt={proposal.property_name} 
                                style={{ width: '80px', height: '60px', borderRadius: '12px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '80px', height: '60px', borderRadius: '12px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                🏠
                              </div>
                            )}
                            <div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#0f172a', margin: 0 }}>
                                {proposal.property_name}
                              </h3>
                              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                                {proposal.tipo_nome} • {proposal.cidade_nome} - {proposal.uf_nome}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            {getStatusBadge(proposal.status)}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                              <Calendar size={12} />
                              {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>

                        <div style={{ 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '12px', 
                          padding: '16px', 
                          border: '1px solid #f1f5f9',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '16px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                              VALOR PROPOSTO
                            </span>
                            <strong style={{ fontSize: '1.25rem', color: '#7F34E6', fontWeight: 800 }}>
                              {formatBRL(proposal.valor)}
                            </strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                              CONDIÇÕES DE PAGAMENTO
                            </span>
                            <span style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                              {proposal.condicoes || 'Nenhuma condição detalhada.'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                          <Link 
                            href={`/imovel/${proposal.property_id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#7F34E6',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            Ver anúncio original <ExternalLink size={16} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* TAB: MESSAGES */}
              {activeTab === 'mensagens' && (
                messagesLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 className="animate-spin" size={36} style={{ color: '#7F34E6' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '24px', 
                    padding: '80px 40px', 
                    textAlign: 'center', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>💬</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Nenhum contato recente</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
                      Seu histórico de contatos e mensagens está vazio.
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
                    >
                      <span>Pesquisar Imóveis</span>
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease-out' }}>
                    {messages.map((msg) => (
                      <div 
                        key={msg.lead_id}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '20px',
                          padding: '24px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.01)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                          borderBottom: '1px solid #f8fafc',
                          paddingBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {msg.photo ? (
                              <img 
                                src={msg.photo} 
                                alt={msg.property_name} 
                                style={{ width: '60px', height: '45px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '60px', height: '45px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                🏠
                              </div>
                            )}
                            <div>
                              <h4 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {msg.property_name}
                              </h4>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Cód: #{msg.property_id}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                            <Calendar size={12} />
                            {new Date(msg.created_at).toLocaleDateString('pt-BR')} às {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div style={{ 
                          fontSize: '0.925rem', 
                          color: '#475569', 
                          lineHeight: 1.6,
                          backgroundColor: '#f8fafc',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          borderLeft: '4px solid #7F34E6'
                        }}>
                          {msg.mensagem || 'Mensagem de contato enviada.'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Link 
                            href={`/imovel/${msg.property_id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#7F34E6',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            Ver anúncio <ExternalLink size={14} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
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
