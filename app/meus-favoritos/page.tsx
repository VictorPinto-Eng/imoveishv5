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

  // Chat messaging states
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [loadingChats, setLoadingChats] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  const fetchChats = async (selectFirst: boolean = false) => {
    setLoadingChats(true);
    try {
      const res = await fetch('/api/user/chats', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setChats(data.chats || []);
        if (data.chats && data.chats.length > 0) {
          if (selectFirst && !selectedChatId) {
            setSelectedChatId(data.chats[0].atendimento_id);
            fetchChatMessages(data.chats[0].atendimento_id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchChatMessages = async (atendimentoId: number) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/user/negocios/messages?atendimentoId=${atendimentoId}&role=cliente`);
      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages(data.messages || []);
        // Reset unread count locally for the active chat in the lists
        setChats(prev => prev.map(c => c.atendimento_id === atendimentoId ? { ...c, unread_messages: 0 } : c));
        setProposals(prev => prev.map(p => p.proposal_id === atendimentoId ? { ...p, unread_messages: 0 } : p));
        setMessages(prev => prev.map(m => m.lead_id === atendimentoId ? { ...m, unread_messages: 0 } : m));
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // Poll chat messages every 5 seconds when chat is open in the modal
  useEffect(() => {
    if (!isChatModalOpen || selectedChatId === null) return;

    const interval = setInterval(() => {
      fetch(`/api/user/negocios/messages?atendimentoId=${selectedChatId}&role=cliente`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setChatMessages(data.messages || []);
          }
        })
        .catch(err => console.error('Error polling chat messages:', err));
    }, 5000);

    return () => clearInterval(interval);
  }, [isChatModalOpen, selectedChatId]);

  const handleSendMessage = async (atendimentoId: number) => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/user/negocios/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendimentoId,
          message: newMessage,
          senderType: 'cliente'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        alert(data.error || 'Erro ao enviar mensagem.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };
  
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
        // Fetch chats list to populate badges
        fetchChats(false);

        // Check query parameters to set active tab
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const tabParam = params.get('tab') as TabType;
          if (tabParam && ['favoritos', 'propostas', 'mensagens'].includes(tabParam)) {
            setActiveTab(tabParam);
            if (tabParam === 'propostas') {
              fetchProposals();
            } else if (tabParam === 'mensagens') {
              fetchMessages();
            }
          }
        }

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
      const res = await fetch('/api/user/proposals', { cache: 'no-store' });
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
      const res = await fetch('/api/user/messages', { cache: 'no-store' });
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
    if (tab === 'propostas') {
      fetchProposals();
    } else if (tab === 'mensagens') {
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

  const totalUnreadChats = chats.reduce((acc, c) => acc + (c.unread_messages || 0), 0);

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', backgroundColor: '#f8fafc', paddingTop: '100px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Header Panel */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px', 
            marginBottom: '32px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

            {authenticated && (
              <button
                onClick={() => {
                  setIsChatModalOpen(true);
                  fetchChats(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#7F34E6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(127, 52, 230, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <MessageSquare size={18} />
                <span>Chat Interno</span>
                {totalUnreadChats > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}>
                    {totalUnreadChats}
                  </span>
                )}
              </button>
            )}
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
                <span>Minhas Propostas</span>
                {proposals.reduce((acc, p) => acc + (p.unread_messages || 0), 0) > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}>
                    {proposals.reduce((acc, p) => acc + (p.unread_messages || 0), 0)}
                  </span>
                )}
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
                <span>Mensagens Enviadas</span>
                {messages.reduce((acc, m) => acc + (m.unread_messages || 0), 0) > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}>
                    {messages.reduce((acc, m) => acc + (m.unread_messages || 0), 0)}
                  </span>
                )}
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
                  <div className="card-grid" style={{ 
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
                          gridTemplateColumns: (proposal.tipo === 'proposta' || Number(proposal.valor) > 0) ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
                          gap: '16px'
                        }}>
                          {(proposal.tipo === 'proposta' || Number(proposal.valor) > 0) && (
                            <div>
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                VALOR PROPOSTO
                              </span>
                              <strong style={{ fontSize: '1.25rem', color: '#7F34E6', fontWeight: 800 }}>
                                {formatBRL(proposal.valor)}
                              </strong>
                            </div>
                          )}

                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                              {(proposal.tipo === 'proposta' || Number(proposal.valor) > 0) ? 'CONDIÇÕES DE PAGAMENTO' : 'MENSAGEM ENVIADA'}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                              {proposal.condicoes || proposal.mensagem || 'Nenhuma mensagem de contato detalhada.'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
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

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '12px' }}>
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
      
      {/* Centralized Chat Modal */}
      {isChatModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '950px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={22} style={{ color: '#7F34E6' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Chat Interno
                </h2>
              </div>
              <button
                onClick={() => setIsChatModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left pane: chat list */}
              <div style={{
                width: '35%',
                borderRight: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                backgroundColor: '#f8fafc'
              }}>
                {loadingChats ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: '#7F34E6' }} />
                  </div>
                ) : chats.length === 0 ? (
                  <div style={{ padding: '32px 16px', textTransform: 'none', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                    Nenhuma conversa encontrada.
                  </div>
                ) : (
                  chats.map((chat) => {
                    const isSelected = selectedChatId === chat.atendimento_id;
                    return (
                      <div
                        key={chat.atendimento_id}
                        onClick={() => {
                          setSelectedChatId(chat.atendimento_id);
                          fetchChatMessages(chat.atendimento_id);
                        }}
                        style={{
                          padding: '16px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(127, 52, 230, 0.08)' : 'transparent',
                          borderLeft: isSelected ? '4px solid #7F34E6' : '4px solid transparent',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s'
                        }}
                      >
                        {chat.photo ? (
                          <img
                            src={chat.photo}
                            alt={chat.property_name}
                            style={{ width: '50px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '50px', height: '40px', borderRadius: '6px', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                            🏠
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 750, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chat.property_name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: chat.tipo === 'proposta' ? '#fae8ff' : '#e0f2fe',
                              color: chat.tipo === 'proposta' ? '#a21caf' : '#0369a1',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {chat.tipo === 'proposta' ? 'Proposta' : 'Contato'}
                            </span>
                            {chat.unread_messages > 0 && (
                              <span style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '9999px',
                                padding: '1px 6px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                {chat.unread_messages}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right pane: message viewer */}
              <div style={{ width: '65%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedChatId ? (
                  <>
                    {/* Chat Target Info Header */}
                    {(() => {
                      const chatInfo = chats.find(c => c.atendimento_id === selectedChatId);
                      if (!chatInfo) return null;
                      return (
                        <div style={{
                          padding: '12px 20px',
                          backgroundColor: '#fafafa',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                              Imóvel da conversa
                            </span>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {chatInfo.property_name}
                            </h3>
                          </div>
                          <Link
                            href={`/imovel/${chatInfo.property_id}`}
                            target="_blank"
                            style={{
                              fontSize: '0.8rem',
                              color: '#7F34E6',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none'
                            }}
                          >
                            Ver anúncio <ExternalLink size={14} />
                          </Link>
                        </div>
                      );
                    })()}

                    {/* Messages Body */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {loadingChat ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                          <Loader2 className="animate-spin" size={24} style={{ color: '#7F34E6' }} />
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                          Nenhuma mensagem trocada ainda. Envie uma mensagem para iniciar a conversa!
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.sender_type === 'cliente';
                          return (
                            <div key={msg.id} style={{
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              backgroundColor: isMe ? '#7f34e6' : 'white',
                              color: isMe ? 'white' : '#1e293b',
                              padding: '12px 16px',
                              borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              maxWidth: '75%',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              border: isMe ? 'none' : '1px solid #e2e8f0',
                              fontSize: '0.875rem'
                            }}>
                              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                {msg.mensagem}
                              </p>
                              <div style={{
                                fontSize: '0.65rem',
                                color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                                textAlign: 'right',
                                marginTop: '4px'
                              }}>
                                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Message Input Footer */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', backgroundColor: 'white' }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage(selectedChatId);
                        }}
                        placeholder="Digite sua mensagem aqui..."
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.875rem',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#7F34E6'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                      />
                      <button
                        onClick={() => handleSendMessage(selectedChatId)}
                        disabled={sendingMessage || !newMessage.trim()}
                        style={{
                          backgroundColor: '#7F34E6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0 24px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {sendingMessage ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#94a3b8' }}>
                    <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
                      Selecione uma conversa ao lado para visualizar as mensagens
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
