'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Users, Building2, MessageSquare, Eye, FileText, Check, X, Loader2, AlertCircle 
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
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);

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

          {stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
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
                  <span className={styles.statValue}>{stats.propertiesForSale}</span>
                  <span className={styles.statSubtext}>Disponíveis para venda</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.iconWrapper} ${styles.orangeIcon}`}>
                  <Building2 size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Imóveis para Locação</span>
                  <span className={styles.statValue}>{stats.propertiesForRent}</span>
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
                            <span className={`${styles.statusBadge} ${
                              prop.status.toLowerCase() === 'ativo' ? styles.statusActive : 
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
        </div>
      </main>
      <Footer />
    </>
  );
}
