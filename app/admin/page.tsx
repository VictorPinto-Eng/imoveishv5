'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Users, Building2, MessageSquare, Eye, FileText, Check, X, Loader2, AlertCircle, ExternalLink, Trash2, RotateCcw, Edit3
} from 'lucide-react';
import styles from './admin.module.css';
import Swal from 'sweetalert2';

interface Stats {
  totalUsers: number;
  totalBrokers: number;
  totalOwners: number;
  totalAdmins: number;
  propertiesForSale: number;
  propertiesForRent: number;
  activeProperties: number;
  pendingProperties: number;
  totalLeads: number;
  totalQuestions: number;
  totalViews: number;
}

interface PendingCreci {
  id: number;
  name: string;
  email: string;
  phone: string;
  creci_numero: string;
  creci_tipo: string;
  creci_document_url: string;
  state_sigla: string;
}

interface PendingCpf {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  data_nascimento: string;
  razao_social?: string;
}

interface UserListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj?: string;
  cpf_validated?: boolean;
  razao_social?: string;
  delete_requested: boolean;
  venda_count: number;
  locacao_count: number;
}

interface RecentProperty {
  id: number;
  nome: string;
  status: string;
  created_at: string;
  operacao_nome: string;
  tipo_nome: string;
  preco_base: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingCreci, setPendingCreci] = useState<PendingCreci[]>([]);
  const [pendingCpf, setPendingCpf] = useState<PendingCpf[]>([]);
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users'>('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401 || res.status === 403) {
        // Redireciona se não for admin
        router.push('/');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setPendingCreci(data.pendingCreci);
          setPendingCpf(data.pendingCpf || []);
          setUsersList(data.usersList || []);
          setRecentProperties(data.recentProperties);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: number, brokerName: string, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    const confirmResult = await Swal.fire({
      title: isApprove ? 'Aprovar CRECI?' : 'Rejeitar Comprovante?',
      text: isApprove
        ? `Você está aprovando e homologando o cadastro do corretor ${brokerName}.`
        : `O documento do corretor ${brokerName} será removido e ele precisará reenviar.`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: isApprove ? 'Sim, Aprovar' : 'Sim, Rejeitar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/creci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          title: isApprove ? 'Homologado!' : 'Rejeitado!',
          text: data.message,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        // Reload dashboard
        loadDashboardData();
      } else {
        Swal.fire({
          title: 'Erro!',
          text: data.error || 'Erro ao processar ação.',
          icon: 'error'
        });
      }
    } catch (err) {
      console.error('Error processing CRECI action:', err);
      Swal.fire({
        title: 'Erro!',
        text: 'Erro de conexão.',
        icon: 'error'
      });
    }
  };

  const handleCpfAction = async (userId: number, userName: string, action: 'approve' | 'reject', currentRazaoSocial?: string) => {
    const isApprove = action === 'approve';

    // --- Fluxo de APROVAÇÃO/ATUALIZAÇÃO: pede o nome da Receita Federal antes de confirmar ---
    if (isApprove) {
      const inputResult = await Swal.fire({
        title: 'Homologar / Atualizar Nome Receita Federal',
        html: `
          <p style="margin-bottom:12px">Você está definindo o nome oficial do CPF/CNPJ de <strong>${userName}</strong>.</p>
          <p style="font-size:0.875rem;color:#64748b;margin-bottom:4px">
            📋 Cole abaixo o nome completo conforme consta na <strong>Receita Federal</strong>:
          </p>`,
        input: 'text',
        inputValue: currentRazaoSocial || '',
        inputPlaceholder: 'Ex: JOAO DA SILVA',
        inputAttributes: { autocomplete: 'off', style: 'text-transform:uppercase; letter-spacing:0.04em;' },
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Salvar / Homologar',
        cancelButtonText: 'Cancelar',
        preConfirm: (value: string) => {
          if (!value || !value.trim()) {
            Swal.showValidationMessage('⚠️ O nome da Receita Federal é obrigatório para homologar.');
          }
          return value?.trim().toUpperCase();
        }
      });

      if (!inputResult.isConfirmed) return;

      try {
        const res = await fetch('/api/admin/cpf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'approve', razaoSocial: inputResult.value })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          Swal.fire({ title: 'Salvo com sucesso!', text: data.message, icon: 'success', timer: 2000, showConfirmButton: false });
          loadDashboardData();
        } else {
          Swal.fire({ title: 'Erro!', text: data.error || 'Erro ao processar ação.', icon: 'error' });
        }
      } catch (err) {
        console.error('Error processing CPF action:', err);
        Swal.fire({ title: 'Erro!', text: 'Erro de conexão.', icon: 'error' });
      }
      return;
    }

    // --- Fluxo de REJEIÇÃO ---
    const confirmResult = await Swal.fire({
      title: 'Rejeitar CPF/CNPJ?',
      text: `Os dados de CPF/CNPJ do usuário ${userName} serão limpos e ele precisará preencher novamente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, Rejeitar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/cpf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          title: 'Rejeitado!',
          text: data.message,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        loadDashboardData();
      } else {
        Swal.fire({
          title: 'Erro!',
          text: data.error || 'Erro ao processar ação.',
          icon: 'error'
        });
      }
    } catch (err) {
      console.error('Error processing CPF action:', err);
      Swal.fire({
        title: 'Erro!',
        text: 'Erro de conexão.',
        icon: 'error'
      });
    }
  };

  const handleRestoreUser = async (userId: number, userName: string) => {
    const confirm = await Swal.fire({
      title: 'Reativar Conta?',
      text: `Deseja reativar a conta do usuário ${userName} e cancelar a solicitação de exclusão?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, Reativar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({ icon: 'success', title: 'Reativada!', text: data.message, timer: 2000, showConfirmButton: false });
        loadDashboardData();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro!', text: data.error || 'Erro ao reativar conta.' });
      }
    } catch (error) {
      console.error('Error restoring account:', error);
      Swal.fire({ icon: 'error', title: 'Erro!', text: 'Erro de conexão.' });
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    const confirm = await Swal.fire({
      title: '⚠️ EXCLUIR DEFINITIVAMENTE?',
      text: `Esta ação apagará permanentemente o usuário ${userName} e todos os seus imóveis do banco de dados de forma definitiva! Não há como reverter.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Excluir Definitivamente',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({ icon: 'success', title: 'Excluído!', text: data.message, timer: 2000, showConfirmButton: false });
        loadDashboardData();
      } else {
        Swal.fire({ icon: 'error', title: 'Erro!', text: data.error || 'Erro ao excluir conta.' });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Swal.fire({ icon: 'error', title: 'Erro!', text: 'Erro de conexão.' });
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loadingContainer}>
          <Loader2 className="animate-spin" size={24} />
          <span>Carregando painel administrativo...</span>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.adminContainer}>
        <div className="container">
          <div className={styles.titleSection}>
            <h1>Painel do Administrador</h1>
            <p>Monitore o desempenho do sistema e valide novas contas de corretores.</p>
          </div>

          {currentView === 'users' ? (
            <div className={styles.sectionBox} style={{ marginTop: '1rem' }}>
              <div className={styles.sectionHeader}>
                <h2>
                  <Users size={22} style={{ color: '#7F34E6', marginRight: '6px' }} />
                  Usuários Cadastrados ({usersList.length})
                </h2>
                <button 
                  className={styles.btnApprove} 
                  onClick={() => setCurrentView('dashboard')}
                  style={{ backgroundColor: '#7F34E6', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                >
                  Voltar
                </button>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Documento & Receita</th>
                      <th style={{ textAlign: 'center' }}>A Venda</th>
                      <th style={{ textAlign: 'center' }}>Locação</th>
                      <th style={{ textAlign: 'center' }}>Total Imóveis</th>
                      <th style={{ textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          Nenhum usuário cadastrado encontrado.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((usr) => {
                        const total = (Number(usr.venda_count) || 0) + (Number(usr.locacao_count) || 0);
                        const isCpfCnpj = !!usr.cpf_cnpj;
                        return (
                          <tr key={usr.id} style={usr.delete_requested ? { backgroundColor: '#fef2f2' } : {}}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 600 }}>{usr.name}</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{usr.email}</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{usr.phone || 'Sem telefone'}</span>
                                {usr.delete_requested && (
                                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                                    ⚠️ Solicitou exclusão permanente
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {isCpfCnpj ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>
                                    {usr.cpf_cnpj!.length === 11
                                      ? usr.cpf_cnpj!.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                                      : usr.cpf_cnpj!.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                                    {usr.cpf_validated ? (
                                      <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, marginLeft: '8px' }}>
                                        ✅ Validado
                                      </span>
                                    ) : (
                                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginLeft: '8px' }}>
                                        ⏳ Pendente
                                      </span>
                                    )}
                                  </div>
                                  {usr.razao_social && (
                                    <div style={{ fontSize: '0.8rem', color: '#7F34E6', fontWeight: 600 }}>
                                      📋 Receita: {usr.razao_social}
                                    </div>
                                  )}
                                  <div style={{ marginTop: '2px' }}>
                                    <button
                                      onClick={() => handleCpfAction(usr.id, usr.name, 'approve', usr.razao_social)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#7F34E6',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        padding: 0,
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      <Edit3 size={12} />
                                      {usr.cpf_validated ? 'Atualizar Nome Receita' : 'Homologar Nome Receita'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sem documento informado</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 500 }}>
                              {usr.venda_count || 0}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 500 }}>
                              {usr.locacao_count || 0}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#7F34E6' }}>
                              {total}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                {usr.delete_requested ? (
                                  <>
                                    <button
                                      className={styles.btnApprove}
                                      onClick={() => handleRestoreUser(usr.id, usr.name)}
                                      title="Reativar Conta e Cancelar Exclusão"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.6rem' }}
                                    >
                                      <RotateCcw size={14} /> Reativar
                                    </button>
                                    <button
                                      className={styles.btnReject}
                                      onClick={() => handleDeleteUser(usr.id, usr.name)}
                                      title="Excluir Definitivamente do Banco de Dados"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.6rem' }}
                                    >
                                      <Trash2 size={14} /> Excluir
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {stats && (
                <div className={styles.statsGrid}>
                  <div 
                    className={styles.statCard} 
                    onClick={() => setCurrentView('users')}
                    style={{ cursor: 'pointer' }}
                    title="Clique para ver lista de usuários cadastrados"
                  >
                    <div className={`${styles.iconWrapper} ${styles.blueIcon}`}>
                      <Users size={24} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Usuários Cadastrados</span>
                      <span className={styles.statValue}>{stats.totalUsers}</span>
                      <span className={styles.statSubtext}>{stats.totalBrokers} Corretores</span>
                      <span className={styles.statSubtext}>{stats.totalOwners} Proprietários</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.purpleIcon}`}>
                      <Building2 size={24} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Imóveis para Venda</span>
                      <span className={stats.propertiesForSale > 0 ? styles.statValue : ''} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.propertiesForSale}</span>
                      <span className={styles.statSubtext}>Disponíveis para venda</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.orangeIcon}`}>
                      <Building2 size={24} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Imóveis para Locação</span>
                      <span className={stats.propertiesForRent > 0 ? styles.statValue : ''} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.propertiesForRent}</span>
                      <span className={styles.statSubtext}>Disponíveis para aluguel</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.iconWrapper} ${styles.greenIcon}`}>
                      <MessageSquare size={24} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Mensagens Recebidas</span>
                      <span className={styles.statValue}>{stats.totalLeads + stats.totalQuestions}</span>
                      <span className={styles.statSubtext}>{stats.totalLeads} Leads • {stats.totalQuestions} Perguntas</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.dashboardGrid}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Left Box: Pending CRECI */}
                  <div className={styles.sectionBox}>
                    <div className={styles.sectionHeader}>
                      <h2>
                        <FileText size={20} />
                        Homologações do CRECI Pendentes
                      </h2>
                      {pendingCreci.length > 0 && (
                        <span className={styles.badge}>{pendingCreci.length} novos</span>
                      )}
                    </div>

                    {pendingCreci.length === 0 ? (
                      <div className={styles.emptyState}>
                        <span className={styles.icon}>🎉</span>
                        <p>Tudo em dia! Nenhuma solicitação de CRECI pendente de validação.</p>
                      </div>
                    ) : (
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>CRECI / UF</th>
                              <th>Documento</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingCreci.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.email}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.phone}</div>
                                </td>
                                <td>
                                  <div>{item.creci_numero}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.creci_tipo} • Região {item.state_sigla}</div>
                                </td>
                                <td>
                                  <a
                                    href={item.creci_document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.docLink}
                                  >
                                    Ver Comprovante
                                  </a>
                                </td>
                                <td>
                                  <div className={styles.actionGroup}>
                                    <button
                                      className={styles.btnApprove}
                                      onClick={() => handleAction(item.id, item.name, 'approve')}
                                      title="Aprovar CRECI"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      className={styles.btnReject}
                                      onClick={() => handleAction(item.id, item.name, 'reject')}
                                      title="Rejeitar Documento"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Pending CPF/CNPJ box */}
                  <div className={styles.sectionBox}>
                    <div className={styles.sectionHeader}>
                      <h2>
                        <FileText size={20} />
                        Homologações de CPF/CNPJ Pendentes
                      </h2>
                      {pendingCpf.length > 0 && (
                        <span className={styles.badge}>{pendingCpf.length} novos</span>
                      )}
                    </div>

                    {pendingCpf.length === 0 ? (
                      <div className={styles.emptyState}>
                        <span className={styles.icon}>🎉</span>
                        <p>Tudo em dia! Nenhuma solicitação de CPF/CNPJ pendente de validação.</p>
                      </div>
                    ) : (
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Documento (CPF/CNPJ)</th>
                              <th>Data Nasc. / Abertura</th>
                              <th>Receita Federal</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingCpf.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.email}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.phone || 'Sem telefone'}</div>
                                  {item.razao_social && (
                                    <div style={{ fontSize: '0.8rem', color: '#7F34E6', marginTop: '4px', fontWeight: 600 }}>
                                      📋 Receita: {item.razao_social}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div
                                    style={{ fontFamily: 'monospace', fontWeight: 600, cursor: 'copy' }}
                                    title="Clique para copiar o CPF/CNPJ"
                                    onClick={() => navigator.clipboard.writeText(item.cpf_cnpj)}
                                  >
                                    {item.cpf_cnpj.length === 11
                                      ? item.cpf_cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                                      : item.cpf_cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                                  </div>
                                  <div style={{ marginTop: '2px' }}>
                                    <button
                                      onClick={() => handleCpfAction(item.id, item.name, 'approve', item.razao_social)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#7F34E6',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        padding: 0,
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      <Edit3 size={12} />
                                      Homologar Nome Receita
                                    </button>
                                  </div>
                                </td>
                                <td>
                                  <div
                                    style={{ cursor: 'copy' }}
                                    title="Clique para copiar a data"
                                    onClick={() => {
                                      if (item.data_nascimento) {
                                        const iso = new Date(item.data_nascimento).toISOString().split('T')[0];
                                        const [y, m, d] = iso.split('-');
                                        navigator.clipboard.writeText(`${d}/${m}/${y}`);
                                      }
                                    }}
                                  >
                                    {item.data_nascimento
                                      ? new Date(item.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                      : 'Não informada'}
                                  </div>
                                </td>
                                <td>
                                  <a
                                    href="https://servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao/consultapublica.asp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.docLink}
                                    title="Abrir portal da Receita Federal"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                  >
                                    <ExternalLink size={13} />
                                    Consultar RF
                                  </a>
                                </td>
                                <td>
                                  <div className={styles.actionGroup}>
                                    <button
                                      className={styles.btnApprove}
                                      onClick={() => handleCpfAction(item.id, item.name, 'approve', item.razao_social)}
                                      title="Aprovar CPF/CNPJ"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      className={styles.btnReject}
                                      onClick={() => handleCpfAction(item.id, item.name, 'reject')}
                                      title="Rejeitar CPF/CNPJ"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Box: Recent Properties */}
                <div className={styles.sectionBox}>
                  <div className={styles.sectionHeader}>
                    <h2>
                      <Building2 size={20} />
                      Últimos Imóveis Cadastrados
                    </h2>
                  </div>

                  {recentProperties.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>Nenhum imóvel cadastrado no sistema.</p>
                    </div>
                  ) : (
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Imóvel</th>
                            <th>Valor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentProperties.map((prop) => (
                            <tr key={prop.id}>
                              <td>
                                <div style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={prop.nome}>
                                  {prop.nome}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  {prop.tipo_nome} • {prop.operacao_nome}
                                </div>
                              </td>
                              <td className={styles.priceCol}>
                                {formatPrice(prop.preco_base)}
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${prop.status.toLowerCase() === 'ativo' ? styles.statusActive :
                                    prop.status.toLowerCase() === 'pendente' ? styles.statusPending :
                                      styles.statusInactive
                                  }`}>
                                  {prop.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
