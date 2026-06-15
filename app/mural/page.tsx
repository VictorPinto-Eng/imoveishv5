'use client'

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Briefcase, Loader2, Calendar, Mail, Phone, ExternalLink, 
  Check, X, MessageSquare, AlertCircle, FileText, ArrowRight, ArrowLeft, Clock, CheckSquare, 
  UserCircle2, Home, DollarSign, Sparkles, Info, Eye, Pencil, Kanban, Printer, Plus,
  Search, Users, PhoneCall
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MuralPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isAdvertiser, setIsAdvertiser] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [showProposalDetailModal, setShowProposalDetailModal] = useState<boolean>(false);
  const [showProposalDetails, setShowProposalDetails] = useState<boolean>(false);
  const [showRespondProposalModal, setShowRespondProposalModal] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [isLeadsDrawerOpen, setIsLeadsDrawerOpen] = useState(false);
  const [leadsSearchQuery, setLeadsSearchQuery] = useState('');
  const [drawerMode, setDrawerMode] = useState<'list' | 'create'>('list');
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadPropertyId, setNewLeadPropertyId] = useState('');
  const [newLeadOperation, setNewLeadOperation] = useState('venda');
  const [newLeadValue, setNewLeadValue] = useState('');
  const [newLeadConditions, setNewLeadConditions] = useState('');
  const [historicalLeads, setHistoricalLeads] = useState<any[]>([]);

  // Chat messaging states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loadingChat, setLoadingChat] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  const fetchChatMessages = async (atendimentoId: number) => {
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/user/negocios/messages?atendimentoId=${atendimentoId}&role=corretor`);
      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProposal) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/user/negocios/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendimentoId: selectedProposal.proposal_id,
          message: newMessage,
          senderType: 'corretor'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Erro ao enviar mensagem.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (showProposalDetailModal && selectedProposal?.proposal_id) {
      fetchChatMessages(selectedProposal.proposal_id);
    }
  }, [showProposalDetailModal, selectedProposal?.proposal_id]);

  // Logging and Contact attempts states
  const [proposalLogs, setProposalLogs] = useState<any[]>([]);
  const [proposalAttempts, setProposalAttempts] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [meioContato, setMeioContato] = useState<string>('WhatsApp');
  const [resultadoContato, setResultadoContato] = useState<string>('Mensagem enviada');
  const [detalhesContato, setDetalhesContato] = useState<string>('');
  const [submittingAttempt, setSubmittingAttempt] = useState<boolean>(false);

  const etapas = [
    { nome: 'Novo', sigla: 'novo', icon: '✨', bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    { nome: 'Contato', sigla: 'contato', icon: '💬', bg: '#fef3c7', border: '#fde68a', text: '#92400e' },
    { nome: 'Agendamento', sigla: 'agendamento', icon: '📅', bg: '#d1fae5', border: '#a7f3d0', text: '#065f46' },
    { nome: 'Proposta', sigla: 'proposta', icon: '📝', bg: '#f3e8ff', border: '#e9d5ff', text: '#6b21a8' },
    { nome: 'Fechamento', sigla: 'fechamento', icon: '🤝', bg: '#fce7f3', border: '#fbcfe8', text: '#9d174d' }
  ];

  const listStages = etapas.map(e => e.sigla);

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        if (!authRes.ok || !authData.authenticated) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        setAuthenticated(true);
        const user = authData.user;
        const userRoles = user.roles || [];
        const hasAdvertiserRole = userRoles.some((r: any) => Number(r.id) === 2 || Number(r.id) === 3);
        const showMeusImoveis = !!user.is_admin || (hasAdvertiserRole && !!user.cpf_validated);
        
        setIsAdvertiser(showMeusImoveis);

        if (showMeusImoveis) {
          await fetchBusinessData();
          await fetchLeadsData();
          try {
            const propRes = await fetch('/api/user/imoveis');
            const propData = await propRes.json();
            if (propRes.ok && propData.success) {
              setMyProperties(propData.imoveis || []);
            }
          } catch (err) {
            console.error('Error fetching properties:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching businesses:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (isLeadsDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLeadsDrawerOpen]);

  const fetchBusinessData = async () => {
    try {
      const res = await fetch('/api/user/negocios');
      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(data.atendimentos || []);
      }
    } catch (err) {
      console.error('Error refreshing business data:', err);
    }
  };

  const fetchProposalLogs = async (id: number) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/user/negocios/logs?atendimentoId=${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProposalLogs(data.logs || []);
        setProposalAttempts(data.attempts || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveContactAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    setSubmittingAttempt(true);
    try {
      const res = await fetch('/api/user/negocios/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendimentoId: selectedProposal.proposal_id,
          meioContato,
          resultado: resultadoContato,
          detalhes: detalhesContato
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDetalhesContato('');
        Swal.fire({
          icon: 'success',
          title: 'Registrado!',
          text: 'Tentativa de contato gravada com sucesso.',
          confirmButtonColor: '#7F34E6'
        });
        await fetchProposalLogs(selectedProposal.proposal_id);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível registrar a tentativa de contato.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAttempt(false);
    }
  };

  const handleTriggerContactAttemptSwal = (proposalId?: number) => {
    const id = proposalId || selectedProposal?.proposal_id;
    if (!id) return;
    Swal.fire({
      title: 'Registrar Tentativa de Contato',
      html: `
        <div style="text-align: left; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Meio de Contato</label>
            <select id="swal-attempt-meio" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px; border: 1px solid #d9d9d9;">
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telefone">Telefone</option>
              <option value="E-mail">E-mail</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Resultado</label>
            <select id="swal-attempt-resultado" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px; border: 1px solid #d9d9d9;">
              <option value="Mensagem enviada">Mensagem enviada</option>
              <option value="Sucesso / Conversamos">Sucesso / Conversamos</option>
              <option value="Não atendeu">Não atendeu</option>
              <option value="Caixa postal">Caixa postal</option>
              <option value="Número inválido">Número inválido</option>
            </select>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Detalhes / Observação</label>
            <textarea id="swal-attempt-detalhes" class="swal2-textarea" placeholder="Descreva o que aconteceu..." style="margin: 0; width: 100%; box-sizing: border-box; border-radius: 8px; font-size: 14px; height: 70px;"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const meio = (document.getElementById('swal-attempt-meio') as HTMLSelectElement).value;
        const resultado = (document.getElementById('swal-attempt-resultado') as HTMLSelectElement).value;
        const detalhes = (document.getElementById('swal-attempt-detalhes') as HTMLTextAreaElement).value;
        return { meio, resultado, detalhes };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { meio, resultado: resVal, detalhes } = result.value;
        try {
          const res = await fetch('/api/user/negocios/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              atendimentoId: id,
              meioContato: meio,
              resultado: resVal,
              detalhes
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            await fetchBusinessData();
            if (selectedProposal && selectedProposal.proposal_id === id) {
              await fetchProposalLogs(id);
            }
            const prop = proposals.find(p => p.proposal_id === id) || selectedProposal;
            if (prop) {
              handleOpenContactAttemptsModal(prop);
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        const prop = proposals.find(p => p.proposal_id === id) || selectedProposal;
        if (prop) {
          handleOpenContactAttemptsModal(prop);
        }
      }
    });
  };

  const handleGenerateContactAttemptsPDF = (proposal: any, attempts: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Bloqueador de Popups Ativo',
        text: 'Por favor, permita popups para este site para gerar o PDF.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    const getEtapaDisplayName = (et: string) => {
      const names: Record<string, string> = {
        novo: 'Novo',
        contato: 'Contato',
        agendamento: 'Agendamento',
        proposta: 'Proposta',
        fechamento: 'Fechamento'
      };
      return names[et?.toLowerCase()] || et || '-';
    };

    const rowsHtml = attempts.map((att: any, idx: number) => {
      const dateFormatted = new Date(att.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${dateFormatted}</strong></td>
          <td><span style="font-weight: 600;">${att.meio_contato}</span></td>
          <td><span style="color: #475569;">${getEtapaDisplayName(att.etapa)}</span></td>
          <td><span style="background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${att.resultado}</span></td>
          <td style="word-break: break-all;">${att.detalhes || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Tentativas de Contato - HV5 Imóveis</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Outfit', sans-serif;
            color: #334155;
            margin: 0;
            background-color: #fff;
          }
          #pdf-container {
            padding: 20px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
          }
          .logo {
            height: 55px;
            object-fit: contain;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            margin: 0;
            font-size: 20px;
            color: #0f172a;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }
          .title-area p {
            margin: 4px 0 0 0;
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
          }
          .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 12px;
          }
          .info-box h3 {
            margin: 0 0 8px 0;
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px;
            text-align: left;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background-color: #fafbfc;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="loader" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; font-family: 'Outfit', sans-serif;">
          <div style="width: 50px; height: 50px; border: 5px solid #f3e8ff; border-top: 5px solid #7f34e6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 20px; font-weight: 600; color: #7f34e6; font-size: 16px;">Gerando relatório em PDF...</p>
        </div>

        <div id="pdf-container" style="position: absolute; left: -9999px; top: -9999px; width: 790px;">
          <div class="header">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <img src="/logo_hv5_1024.png" class="logo" alt="HV5 Logo" />
              <span style="font-size: 11px; font-weight: 700; color: #7f34e6; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">HV5 Imóveis</span>
            </div>
            <div class="title-area">
              <h1>Histórico de Contatos</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569; font-weight: 600;">Relatório de Tentativas de Contato</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div class="info-box">
            <div>
              <h3>Dados do Lead / Cliente</h3>
              <strong>Nome:</strong> ${proposal.sender_name || 'Não informado'}<br/>
              <strong>E-mail:</strong> ${proposal.sender_email || 'Não informado'}<br/>
              <strong>Telefone:</strong> ${proposal.sender_phone || 'Não informado'}<br/>
              <strong>Etapa Atual:</strong> ${getEtapaDisplayName(proposal.etapa)}
            </div>
            <div>
              <h3>Imóvel de Interesse</h3>
              <strong>Código/ID:</strong> #${proposal.property_id || '-'}<br/>
              <strong>Nome:</strong> ${proposal.property_name || '-'}<br/>
              <strong>Valor Ref.:</strong> ${proposal.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.valor) : '-'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 20%">Data/Hora</th>
                <th style="width: 15%">Meio</th>
                <th style="width: 15%">Etapa</th>
                <th style="width: 15%">Resultado</th>
                <th style="width: 30%">Observação</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align: center; color: #64748b;">Nenhuma tentativa de contato registrada.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            HV5 Imóveis &copy; ${new Date().getFullYear()} - Todos os direitos reservados.
          </div>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          window.onload = function() {
            function checkLibrary() {
              if (typeof html2pdf !== 'undefined') {
                generatePDF();
              } else {
                setTimeout(checkLibrary, 50);
              }
            }
            checkLibrary();
          };

          function generatePDF() {
            const element = document.getElementById('pdf-container');
            element.style.position = 'static';
            element.style.left = '0';
            element.style.top = '0';

            const opt = {
              margin:       10,
              filename:     'relatorio-tentativas-contato.pdf',
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().from(element).set(opt).toPdf().output('bloburl').then(function(blobUrl) {
              window.location.replace(blobUrl);
            }).catch(function(err) {
              console.error(err);
              document.getElementById('loader').style.display = 'none';
              window.print();
            });
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleOpenContactAttemptsModal = async (proposal: any) => {
    Swal.fire({
      title: 'Carregando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch(`/api/user/negocios/logs?atendimentoId=${proposal.proposal_id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar dados');
      }

      const attempts = data.attempts || [];
      const sortedAttempts = [...attempts].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const getEtapaDisplayName = (et: string) => {
        const names: Record<string, string> = {
          novo: 'Novo',
          contato: 'Contato',
          agendamento: 'Agendamento',
          proposta: 'Proposta',
          fechamento: 'Fechamento'
        };
        return names[et?.toLowerCase()] || et || '-';
      };

      const rowsHtml = sortedAttempts.map((att: any, idx: number) => {
        const dateFormatted = new Date(att.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-size: 13px; color: #334155;">${dateFormatted}</td>
            <td style="padding: 10px; font-size: 13px; color: #1e293b; font-weight: 600;">${att.meio_contato}</td>
            <td style="padding: 10px; font-size: 13px; color: #475569; font-weight: 600; cursor: help;" title="${getEtapaDisplayName(att.etapa)}">${getEtapaDisplayName(att.etapa).charAt(0).toUpperCase()}</td>
            <td style="padding: 10px; font-size: 13px;"><span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${att.resultado}</span></td>
            <td style="padding: 10px; font-size: 12px; color: #64748b; max-width: 200px; word-break: break-word;">${att.detalhes || '-'}</td>
          </tr>
        `;
      }).join('');

      const tableContent = sortedAttempts.length > 0 
        ? `
          <div style="max-height: 250px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 10px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 1;">
                  <th style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Data/Hora</th>
                  <th style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Meio</th>
                  <th style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Etapa</th>
                  <th style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Resultado</th>
                  <th style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Observação</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `
        : `
          <div style="padding: 24px; text-align: center; color: #64748b; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 10px; font-size: 13px;">
            Nenhuma tentativa de contato registrada para este lead.
          </div>
        `;

      Swal.fire({
        title: '',
        width: '650px',
        showCloseButton: true,
        html: `
          <div style="font-family: 'Outfit', sans-serif; text-align: left;">
            <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                  📞 Histórico de Contatos
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; font-weight: 500;">
                  Cliente: <strong style="color: #1e293b;">${proposal.sender_name || 'Não informado'}</strong>
                  ${proposal.sender_phone ? ` &bull; Tel: <strong style="color: #1e293b;">${proposal.sender_phone}</strong>` : ''}
                </p>
              </div>
              <div style="display: flex; gap: 8px; margin-right: 32px;">
                <button id="swal-btn-new-attempt" style="background-color: #10b981; color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: background-color 0.2s;">
                  ➕ Novo Contato
                </button>
                <button id="swal-btn-generate-pdf" style="background-color: #7f34e6; color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: background-color 0.2s;">
                  📄 PDF Relatório
                </button>
              </div>
            </div>
            
            ${tableContent}
          </div>
        `,
        showConfirmButton: false,
        didOpen: () => {
          document.getElementById('swal-btn-new-attempt')?.addEventListener('click', () => {
            Swal.close();
            handleTriggerContactAttemptSwal(proposal.proposal_id);
          });
          document.getElementById('swal-btn-generate-pdf')?.addEventListener('click', () => {
            handleGenerateContactAttemptsPDF(proposal, sortedAttempts);
          });
        }
      });

    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.message || 'Não foi possível carregar as tentativas de contato.',
        confirmButtonColor: '#7F34E6'
      });
    }
  };

  const handleOpenTimelineLogsModal = async (proposal: any) => {
    Swal.fire({
      title: 'Carregando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch(`/api/user/negocios/logs?atendimentoId=${proposal.proposal_id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar histórico');
      }

      const logs = data.logs || [];
      const sortedLogs = [...logs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const getEtapaDisplayName = (et: string) => {
        const names: Record<string, string> = {
          novo: 'Novo',
          contato: 'Contato',
          agendamento: 'Agendamento',
          proposta: 'Proposta',
          fechamento: 'Fechamento'
        };
        return names[et?.toLowerCase()] || et || '-';
      };

      const timelineHtml = sortedLogs.map((log: any) => {
        const dateFormatted = new Date(log.created_at).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        let badgeHtml = '';
        if (log.etapa_anterior && log.etapa_nova && log.etapa_anterior !== log.etapa_nova) {
          const anterior = getEtapaDisplayName(log.etapa_anterior).toUpperCase();
          const nova = getEtapaDisplayName(log.etapa_nova).toUpperCase();
          badgeHtml = `
            <div style="font-size: 11px; margin-top: 4px; font-weight: 700; color: #475569; font-family: 'Inter', sans-serif;">
              De: <span>${anterior}</span>
              <span style="color: #7f34e6; margin: 0 4px;">&rarr;</span>
              Para: <span style="color: #7f34e6;">${nova}</span>
            </div>
          `;
        }

        return `
          <div style="position: relative; display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            <!-- Purple Dot -->
            <div style="position: absolute; left: -29px; top: 6px; width: 8px; height: 8px; border-radius: 50%; background-color: #7f34e6; border: 2px solid #fff; box-shadow: 0 0 0 2px #e9d5ff;"></div>
            <!-- Left content: description and stage transition -->
            <div style="text-align: left; font-family: 'Inter', sans-serif; flex-grow: 1; padding-right: 16px;">
              <div style="font-size: 13px; color: #334155; font-weight: 600; line-height: 1.4;">${log.descricao}</div>
              ${badgeHtml}
            </div>
            <!-- Right content: date/time -->
            <div style="font-size: 12px; color: #94a3b8; font-weight: 500; white-space: nowrap; flex-shrink: 0; padding-top: 2px;">
              ${dateFormatted}
            </div>
          </div>
        `;
      }).join('');

      const timelineContent = sortedLogs.length > 0
        ? `
          <div style="position: relative; max-height: 400px; overflow-y: auto; padding-right: 8px; margin-top: 10px; border-left: 2px solid #e2e8f0; margin-left: 12px; padding-left: 24px; display: flex; flex-direction: column; gap: 20px; padding-top: 4px; padding-bottom: 4px;">
            ${timelineHtml}
          </div>
        `
        : `
          <div style="padding: 24px; text-align: center; color: #64748b; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 10px; font-size: 13px;">
            Nenhum log de acompanhamento registrado para este card.
          </div>
        `;

      Swal.fire({
        title: '',
        width: '650px',
        showCloseButton: true,
        html: `
          <div style="font-family: 'Outfit', sans-serif; text-align: left; padding: 10px 10px 10px 5px;">
            <h2 style="margin: 0 0 24px 0; font-size: 1.05rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
              Histórico de Acompanhamento (Logs)
            </h2>
            ${timelineContent}
          </div>
        `,
        showConfirmButton: false
      });

    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.message || 'Não foi possível carregar o histórico de acompanhamento.',
        confirmButtonColor: '#7F34E6'
      });
    }
  };

  const fetchLeadsData = async () => {
    try {
      const res = await fetch('/api/user/leads');
      const data = await res.json();
      if (res.ok && data.success) {
        setHistoricalLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Error refreshing leads data:', err);
    }
  };

  const handleUpdateStatus = async (proposalId: number, newStatus: 'aceita' | 'recusada') => {
    const actionText = newStatus === 'aceita' ? 'aceitar' : 'recusar';
    const confirmColor = newStatus === 'aceita' ? '#10b981' : '#ef4444';

    const confirmResult = await Swal.fire({
      title: `Confirmar Ação`,
      text: `Deseja realmente ${actionText} esta proposta?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sim, ${actionText}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#64748b'
    });

    if (!confirmResult.isConfirmed) return;

    setUpdatingId(proposalId);
    try {
      const res = await fetch('/api/user/negocios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, status: newStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(prev => 
          prev.map(p => p.proposal_id === proposalId ? { ...p, status: newStatus } : p)
        );
        if (selectedProposal && selectedProposal.proposal_id === proposalId) {
          setSelectedProposal((prev: any) => ({ ...prev, status: newStatus }));
        }
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: `A proposta foi marcada como ${newStatus === 'aceita' ? 'aceita' : 'recusada'}.`,
          confirmButtonColor: '#7F34E6'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar a proposta.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateEtapa = async (proposalId: number, newEtapa: string) => {
    setUpdatingId(proposalId);
    try {
      const res = await fetch('/api/user/negocios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, etapa: newEtapa })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(prev => 
          prev.map(p => p.proposal_id === proposalId ? { ...p, etapa: newEtapa } : p)
        );
        if (selectedProposal && selectedProposal.proposal_id === proposalId) {
          setSelectedProposal((prev: any) => ({ ...prev, etapa: newEtapa }));
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar o estágio da negociação.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateNotes = async (proposalId: number, notes: string) => {
    setUpdatingId(proposalId);
    try {
      const res = await fetch('/api/user/negocios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, anotacoesInternas: notes })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(prev => 
          prev.map(p => p.proposal_id === proposalId ? { ...p, anotacoes_internas: notes } : p)
        );
        if (selectedProposal && selectedProposal.proposal_id === proposalId) {
          setSelectedProposal((prev: any) => ({ ...prev, anotacoes_internas: notes }));
        }
        Swal.fire({
          icon: 'success',
          title: 'Anotações Salvas!',
          text: 'As anotações internas foram atualizadas com sucesso.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar as anotações.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateDataVisita = async (proposalId: number, dateStr: string) => {
    setUpdatingId(proposalId);
    try {
      const body: any = { proposalId, dataVisita: dateStr || null };
      if (dateStr) {
        body.etapa = 'agendamento';
      }
      
      const res = await fetch('/api/user/negocios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(prev => 
          prev.map(p => p.proposal_id === proposalId ? { ...p, data_visita: dateStr || null, data_agendamento: dateStr || null, etapa: dateStr ? 'agendamento' : p.etapa } : p)
        );
        if (selectedProposal && selectedProposal.proposal_id === proposalId) {
          setSelectedProposal((prev: any) => ({ ...prev, data_visita: dateStr || null, data_agendamento: dateStr || null, etapa: dateStr ? 'agendamento' : prev.etapa }));
        }
        Swal.fire({
          icon: 'success',
          title: dateStr ? 'Visita Agendada!' : 'Agendamento Removido!',
          text: dateStr ? 'A data da visita foi agendada e o card movido para Agendamento.' : 'A data da visita foi removida.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar a data da visita.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateDataAgendamento = async (proposalId: number, dateStr: string) => {
    setUpdatingId(proposalId);
    try {
      const res = await fetch('/api/user/negocios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, dataAgendamento: dateStr || null })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(prev => 
          prev.map(p => p.proposal_id === proposalId ? { ...p, data_agendamento: dateStr || null } : p)
        );
        if (selectedProposal && selectedProposal.proposal_id === proposalId) {
          setSelectedProposal((prev: any) => ({ ...prev, data_agendamento: dateStr || null }));
        }
        Swal.fire({
          icon: 'success',
          title: dateStr ? 'Agendamento do Card Atualizado!' : 'Agendamento Removido!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar o agendamento.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenScheduleCardModal = (proposal: any) => {
    const currentVal = proposal.data_agendamento 
      ? new Date(new Date(proposal.data_agendamento).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
      : '';

    Swal.fire({
      title: 'Agendamento do Card',
      html: `
        <div style="font-family: 'Outfit', sans-serif; text-align: left;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px;">Selecione a data e hora do agendamento:</label>
          <input 
            type="datetime-local" 
            id="swal-data-agendamento" 
            class="swal2-input" 
            value="${currentVal}"
            style="margin: 0; width: 100%; box-sizing: border-box; border-radius: 8px; border: 1px solid #cbd5e1; padding: 10px;"
          />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar Agendamento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7f34e6',
      cancelButtonColor: '#cbd5e1',
      showDenyButton: proposal.data_agendamento ? true : false,
      denyButtonText: 'Remover Agendamento',
      denyButtonColor: '#ef4444',
      preConfirm: () => {
        const inputVal = (document.getElementById('swal-data-agendamento') as HTMLInputElement)?.value;
        return inputVal;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await handleUpdateDataAgendamento(proposal.proposal_id, result.value);
      } else if (result.isDenied) {
        await handleUpdateDataAgendamento(proposal.proposal_id, '');
      }
    });
  };

  const formatBRL = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newEtapa: string) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;
    const proposalId = Number(idStr);
    
    const prop = proposals.find(p => p.proposal_id === proposalId);
    if (!prop || prop.etapa === newEtapa) return;

    await handleUpdateEtapa(proposalId, newEtapa);
  };

  const handleOpenCreateLeadModal = (prefill?: { name: string; email: string; phone: string }) => {
    if (myProperties.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Nenhum Imóvel Encontrado',
        text: 'Você precisa ter pelo menos um imóvel cadastrado e ativo para criar uma nova oportunidade.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    const optionsHtml = myProperties.map(p => 
      `<option value="${p.id}">ID: #${p.id} - ${p.nome} (${p.operacao_nome || ''})</option>`
    ).join('');

    // Get unique leads/contacts from current proposals
    const uniqueLeadsMap = new Map();
    proposals.forEach(p => {
      const name = p.sender_name || '';
      const email = p.sender_email || '';
      const phone = p.sender_phone || '';
      const key = `${name.toLowerCase()}|${email.toLowerCase()}|${phone}`;
      if (name && !uniqueLeadsMap.has(key)) {
        uniqueLeadsMap.set(key, { name, email, phone });
      }
    });
    const uniqueLeads = Array.from(uniqueLeadsMap.values()) as Array<{name: string, email: string, phone: string}>;

    // Format prefill phone
    let prefillPhoneFormatted = '';
    if (prefill?.phone) {
      const cleaned = prefill.phone.replace(/\D/g, '');
      if (cleaned.length === 11) {
        prefillPhoneFormatted = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (cleaned.length === 10) {
        prefillPhoneFormatted = cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        prefillPhoneFormatted = prefill.phone;
      }
    }

    Swal.fire({
      title: 'Nova Oportunidade',
      html: `
        <div style="text-align: left; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; gap: 14px; position: relative;">
          <div style="position: relative;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Buscar Lead/Cliente Existente</label>
            <input id="swal-lead-search" class="swal2-input" placeholder="Buscar por nome ou telefone..." style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
            <div id="swal-lead-dropdown" style="display: none; position: absolute; top: 68px; left: 0; right: 0; background: white; border: 1px solid #cbd5e1; border-radius: 8px; max-height: 180px; overflow-y: auto; z-index: 10000; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);"></div>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Nome do Cliente *</label>
            <input id="swal-lead-name" class="swal2-input" placeholder="Nome Completo" value="${prefill?.name || ''}" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="swal2-grid-mobile">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">E-mail</label>
              <input id="swal-lead-email" type="email" class="swal2-input" placeholder="email@exemplo.com" value="${prefill?.email || ''}" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Telefone / Celular</label>
              <input id="swal-lead-phone" class="swal2-input" placeholder="(00) 00000-0000" value="${prefillPhoneFormatted}" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
            </div>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Imóvel de Interesse *</label>
            <select id="swal-lead-property" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px; border: 1px solid #d9d9d9;">
              <option value="">Selecione o imóvel...</option>
              ${optionsHtml}
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Tipo de Transação</label>
              <select id="swal-lead-operation" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px; border: 1px solid #d9d9d9;">
                <option value="venda">Venda</option>
                <option value="locacao">Locação</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Valor da Proposta (R$)</label>
              <input id="swal-lead-value" type="number" step="0.01" class="swal2-input" placeholder="0,00" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
            </div>
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Condições de Pagamento / Observações</label>
            <textarea id="swal-lead-conditions" class="swal2-textarea" placeholder="Descreva as condições..." style="margin: 0; width: 100%; box-sizing: border-box; border-radius: 8px; font-size: 14px; height: 70px;"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Cadastrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7F34E6',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      didOpen: () => {
        const searchInput = document.getElementById('swal-lead-search') as HTMLInputElement;
        const dropdown = document.getElementById('swal-lead-dropdown') as HTMLDivElement;
        const nameInput = document.getElementById('swal-lead-name') as HTMLInputElement;
        const emailInput = document.getElementById('swal-lead-email') as HTMLInputElement;
        const phoneInput = document.getElementById('swal-lead-phone') as HTMLInputElement;

        const renderDropdown = (query: string) => {
          const filtered = uniqueLeads.filter(lead => {
            const name = lead.name.toLowerCase();
            const phone = (lead.phone || '').toLowerCase();
            return name.includes(query) || phone.includes(query);
          });

          if (filtered.length === 0 || query === '') {
            dropdown.style.display = 'none';
            return;
          }

          dropdown.innerHTML = filtered.map(lead => {
            const originalIdx = uniqueLeads.indexOf(lead);
            return `
              <div class="swal-dropdown-item" data-idx="${originalIdx}" style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: left; transition: background 0.2s;">
                <strong>${lead.name}</strong> <span style="color: #64748b; font-size: 11px;">(${lead.phone || 'Sem telefone'})</span>
              </div>
            `;
          }).join('');
          dropdown.style.display = 'block';

          // Add click listeners to items
          const items = dropdown.querySelectorAll('.swal-dropdown-item');
          items.forEach(item => {
            item.addEventListener('mouseover', () => {
              (item as HTMLElement).style.backgroundColor = '#f1f5f9';
            });
            item.addEventListener('mouseout', () => {
              (item as HTMLElement).style.backgroundColor = 'transparent';
            });
            item.addEventListener('click', () => {
              const idx = parseInt((item as HTMLElement).getAttribute('data-idx') || '0');
              const selectedLead = uniqueLeads[idx];
              if (selectedLead) {
                searchInput.value = selectedLead.name;
                nameInput.value = selectedLead.name;
                emailInput.value = selectedLead.email || '';
                if (selectedLead.phone) {
                  let cleaned = selectedLead.phone.replace(/\D/g, '');
                  if (cleaned.length === 11) {
                    phoneInput.value = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                  } else if (cleaned.length === 10) {
                    phoneInput.value = cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                  } else {
                    phoneInput.value = selectedLead.phone;
                  }
                } else {
                  phoneInput.value = '';
                }
              }
              dropdown.style.display = 'none';
            });
          });
        };

        if (searchInput) {
          searchInput.addEventListener('input', () => {
            renderDropdown(searchInput.value.toLowerCase());
          });

          // Close dropdown when clicking outside
          document.addEventListener('click', (e) => {
            if (e.target !== searchInput && e.target !== dropdown) {
              dropdown.style.display = 'none';
            }
          });
        }
      },
      preConfirm: () => {
        const name = (document.getElementById('swal-lead-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-lead-email') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-lead-phone') as HTMLInputElement).value;
        const propertyId = (document.getElementById('swal-lead-property') as HTMLSelectElement).value;
        const operationType = (document.getElementById('swal-lead-operation') as HTMLSelectElement).value;
        const value = (document.getElementById('swal-lead-value') as HTMLInputElement).value;
        const conditions = (document.getElementById('swal-lead-conditions') as HTMLTextAreaElement).value;

        if (!name || !propertyId) {
          Swal.showValidationMessage('Por favor, preencha o Nome e o Imóvel de Interesse.');
          return false;
        }

        return {
          name,
          email,
          phone,
          propertyId,
          operationType,
          value,
          conditions
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const payload = result.value;
        try {
          const res = await fetch('/api/user/negocios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: payload.name,
              email: payload.email,
              phone: payload.phone.replace(/\D/g, ''),
              propertyId: payload.propertyId,
              value: payload.value ? Number(payload.value) : null,
              conditions: payload.conditions,
              operationType: payload.operationType,
              etapa: 'novo'
            })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Lead Cadastrado! 🎉',
              text: 'A nova oportunidade foi cadastrada com sucesso.',
              confirmButtonColor: '#7F34E6'
            });
            await fetchBusinessData();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Erro ao Cadastrar',
              text: data.error || 'Não foi possível registrar o lead.',
              confirmButtonColor: '#7F34E6'
            });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro de conexão com o servidor.',
            confirmButtonColor: '#7F34E6'
          });
        }
      }
    });
  };

  const handlePrintAgendamentos = (cards: any[]) => {
    const sortedCards = [...cards].sort((a, b) => {
      if (!a.data_visita) return 1;
      if (!b.data_visita) return -1;
      return new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime();
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Bloqueador de Popups Ativo',
        text: 'Por favor, permita popups para este site para imprimir o relatório.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    const rowsHtml = sortedCards.map((p, idx) => {
      const dateFormatted = p.data_visita 
        ? new Date(p.data_visita).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Não agendado';

      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${dateFormatted}</strong></td>
          <td>
            <div class="client-name">${p.sender_social_name || p.sender_name || 'Anônimo'}</div>
            <div class="client-detail">${p.sender_email || ''}</div>
            <div class="client-detail">${p.sender_phone || ''}</div>
          </td>
          <td>
            <div class="property-id">ID: #${p.property_id}</div>
            <div class="property-name">${p.property_name}</div>
            <div class="property-detail">${p.operacao_nome || ''} • ${p.tipo_nome || ''}</div>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Agendamentos - HV5 Imóveis</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Outfit', sans-serif;
            color: #334155;
            margin: 0;
            background-color: #fff;
          }
          #pdf-container {
            padding: 20px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
          }
          .logo {
            height: 55px;
            object-fit: contain;
          }
          .title-area {
            text-align: right;
          }
          .title-area h1 {
            margin: 0;
            font-size: 22px;
            color: #0f172a;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }
          .title-area p {
            margin: 4px 0 0 0;
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px;
            text-align: left;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background-color: #fafbfc;
          }
          .client-name {
            font-weight: 700;
            color: #0f172a;
          }
          .client-detail, .property-detail {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .property-id {
            font-size: 10px;
            font-weight: 800;
            color: #7f34e6;
          }
          .property-name {
            font-weight: 600;
            color: #1e293b;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="loader" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; font-family: 'Outfit', sans-serif;">
          <div style="width: 50px; height: 50px; border: 5px solid #f3e8ff; border-top: 5px solid #7f34e6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 20px; font-weight: 600; color: #7f34e6; font-size: 16px;">Gerando relatório em PDF...</p>
        </div>

        <div id="pdf-container" style="position: absolute; left: -9999px; top: -9999px; width: 790px;">
          <div class="header">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <img src="/logo_hv5_1024.png" class="logo" alt="HV5 Logo" />
              <span style="font-size: 11px; font-weight: 700; color: #7f34e6; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">HV5 Imóveis</span>
            </div>
            <div class="title-area">
              <h1>Agendamento de Visitas</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569; font-weight: 600;">Controle de Agendamentos</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 25%">Data/Hora Agendamento</th>
                <th style="width: 35%">Dados do Cliente</th>
                <th style="width: 35%">Imóvel de Interesse</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            HV5 Imóveis &copy; ${new Date().getFullYear()} - Todos os direitos reservados.
          </div>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          window.onload = function() {
            function checkLibrary() {
              if (typeof html2pdf !== 'undefined') {
                generatePDF();
              } else {
                setTimeout(checkLibrary, 50);
              }
            }
            checkLibrary();
          };

          function generatePDF() {
            const element = document.getElementById('pdf-container');
            element.style.position = 'static';
            element.style.left = '0';
            element.style.top = '0';

            const opt = {
              margin:       10,
              filename:     'relatorio-agendamentos.pdf',
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().from(element).set(opt).toPdf().output('bloburl').then(function(blobUrl) {
              window.location.replace(blobUrl);
            }).catch(function(err) {
              console.error(err);
              document.getElementById('loader').style.display = 'none';
              window.print();
            });
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleNewPhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
    if (cleaned.length === 11) {
      setNewLeadPhone(cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'));
    } else if (cleaned.length === 10) {
      setNewLeadPhone(cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'));
    } else {
      setNewLeadPhone(val);
    }
  };

  const handleSaveLeadFromDrawer = async () => {
    if (!newLeadName) {
      Swal.fire({
        icon: 'error',
        title: 'Campo Obrigatório',
        text: 'Por favor, preencha o Nome do Cliente.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    const defaultPropertyId = myProperties[0]?.id;
    if (!defaultPropertyId) {
      Swal.fire({
        icon: 'error',
        title: 'Nenhum Imóvel Encontrado',
        text: 'Você precisa ter pelo menos um imóvel cadastrado e ativo para registrar um lead.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    try {
      const res = await fetch('/api/user/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName,
          email: newLeadEmail || '',
          phone: newLeadPhone.replace(/\D/g, ''),
          propertyId: defaultPropertyId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Lead Cadastrado! 🎉',
          text: 'O lead foi cadastrado com sucesso.',
          confirmButtonColor: '#7F34E6',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Reset form
        setNewLeadName('');
        setNewLeadEmail('');
        setNewLeadPhone('');
        
        // Refresh leads list
        await fetchBusinessData();
        await fetchLeadsData();
        
        // Return to list mode
        setDrawerMode('list');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro ao Cadastrar',
          text: data.error || 'Não foi possível registrar o lead.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    }
  };

  // Get unique leads/contacts from current proposals and historical leads
  const uniqueLeadsMap = new Map();
  proposals.forEach(p => {
    const name = p.sender_name || '';
    const email = p.sender_email || '';
    const phone = p.sender_phone || '';
    const key = `${name.toLowerCase()}|${email.toLowerCase()}|${phone}`;
    if (name && !uniqueLeadsMap.has(key)) {
      uniqueLeadsMap.set(key, { 
        name, 
        email, 
        phone,
        created_at: p.created_at,
        proposalsCount: 1,
        properties: p.property_id ? [{ id: p.property_id, name: p.property_name }] : []
      });
    } else if (name) {
      const existing = uniqueLeadsMap.get(key);
      existing.proposalsCount += 1;
      if (p.property_id && !existing.properties.some((prop: any) => prop.id === p.property_id)) {
        existing.properties.push({ id: p.property_id, name: p.property_name });
      }
    }
  });

  historicalLeads.forEach(l => {
    const name = l.sender_name || '';
    const email = l.sender_email || '';
    const phone = l.sender_phone || '';
    const key = `${name.toLowerCase()}|${email.toLowerCase()}|${phone}`;
    if (name && !uniqueLeadsMap.has(key)) {
      uniqueLeadsMap.set(key, {
        name,
        email,
        phone,
        created_at: l.created_at,
        proposalsCount: 0,
        properties: l.property_id ? [{ id: l.property_id, name: l.property_name }] : []
      });
    } else if (name) {
      const existing = uniqueLeadsMap.get(key);
      if (l.property_id && !existing.properties.some((prop: any) => prop.id === l.property_id)) {
        existing.properties.push({ id: l.property_id, name: l.property_name });
      }
    }
  });
  const uniqueLeads = Array.from(uniqueLeadsMap.values()) as Array<{
    name: string;
    email: string;
    phone: string;
    created_at: string;
    proposalsCount: number;
    properties: Array<{ id: number; name: string }>;
  }>;

  const filteredLeads = uniqueLeads.filter(lead => {
    const query = leadsSearchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.phone && lead.phone.includes(query))
    );
  });

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#f8fafc', minHeight: '90vh', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* Header section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
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
                <Kanban size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                  Mural de Atendimento
                </h1>
                <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Visualize de forma rápida e ampla todas as pendências e negociações ativas no funil fixo.
                </p>
              </div>
            </div>

            {isAdvertiser && authenticated && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsLeadsDrawerOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#7F34E6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontWeight: 650,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(127, 52, 230, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Users size={18} />
                  Gerenciar Leads
                </button>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: '#7F34E6' }} />
              <p style={{ color: '#64748b', fontWeight: 500 }}>Carregando mural...</p>
            </div>
          ) : authenticated === false ? (
            /* Restricted Auth State */
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
                Você precisa estar conectado à sua conta para gerenciar e acompanhar seu mural de atendimento.
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
                  fontWeight: 700, 
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Fazer Login
              </button>
            </div>
          ) : !isAdvertiser ? (
            /* Non-Advertiser Screen */
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '24px', 
              padding: '60px 40px', 
              textAlign: 'center', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #e2e8f0',
              maxWidth: '600px',
              margin: '40px auto'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Acesso Restrito a Anunciantes</h2>
              <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
                Apenas corretores, proprietários com CPF validado ou administradores podem acessar o Mural de Atendimento.
              </p>
              <a 
                href="/meu-perfil" 
                style={{ 
                  backgroundColor: '#7F34E6', 
                  color: 'white', 
                  textDecoration: 'none',
                  borderRadius: '12px', 
                  padding: '12px 24px', 
                  fontWeight: 700, 
                  display: 'inline-block'
                }}
              >
                Validar CPF / Perfil
              </a>
            </div>
          ) : (
            /* Mural Kanban Board (Full-screen Fixed Columns Layout) */
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '16px', 
              alignItems: 'flex-start',
              minHeight: '650px'
            }}>
              {etapas.map((stageObj) => {
                const stage = stageObj.sigla;
                let stageCards = proposals.filter((p) => (p.etapa || 'novo') === stage);
                if (stage === 'agendamento') {
                  stageCards.sort((a, b) => {
                    if (!a.data_visita) return 1;
                    if (!b.data_visita) return -1;
                    return new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime();
                  });
                }

                return (
                  <div 
                    key={stage} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      border: `1px solid #e2e8f0`,
                      minHeight: '600px',
                      maxHeight: '80vh',
                      overflowY: 'auto'
                    }}
                  >
                    {/* Column Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      paddingBottom: '12px', 
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '1rem',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: stageObj.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>{stageObj.icon}</span>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {stageObj.nome}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {stage === 'novo' && (
                          <button
                            onClick={handleOpenCreateLeadModal}
                            title="Novo Atendimento Manual"
                            style={{
                              border: 'none',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              borderRadius: '6px',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              marginRight: '2px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
                          >
                            <Plus size={15} />
                          </button>
                        )}
                        {stage === 'agendamento' && stageCards.length > 0 && (
                          <button
                            onClick={() => handlePrintAgendamentos(stageCards)}
                            title="Imprimir Agendamentos"
                            style={{
                              border: 'none',
                              background: 'rgba(127, 52, 230, 0.1)',
                              color: '#7f34e6',
                              borderRadius: '6px',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              marginRight: '2px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 52, 230, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 52, 230, 0.1)'}
                          >
                            <Printer size={15} />
                          </button>
                        )}
                        <span style={{
                          fontSize: '0.75rem',
                          backgroundColor: stageObj.bg,
                          color: stageObj.text,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontWeight: 700
                        }}>
                          {stageCards.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Cards list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      {stageCards.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 10px',
                          border: '2px dashed #f1f5f9',
                          borderRadius: '16px',
                          color: '#94a3b8',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          backgroundColor: '#fafafa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 1
                        }}>
                          Sem pendências
                        </div>
                      ) : (
                        stageCards.map((p) => {
                          const isProposal = p.tipo === 'proposta' || Number(p.valor) > 0;
                          return (
                            <div 
                              key={p.proposal_id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, p.proposal_id)}
                              style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '14px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.015)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 52, 230, 0.05)';
                                e.currentTarget.style.borderColor = '#7f34e6';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.015)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                              }}
                              onClick={() => {
                                setSelectedProposal(p);
                                setModalNotes(p.anotacoes_internas || '');
                                setShowProposalDetailModal(true);
                                setShowProposalDetails(false);
                                setShowChat(false);
                              }}
                            >
                              {/* Property Header info inside Card */}
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {p.photo ? (
                                  <img 
                                    src={p.photo} 
                                    alt={p.property_name} 
                                    style={{ width: '44px', height: '33px', borderRadius: '8px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{ width: '44px', height: '33px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                    🏠
                                  </div>
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                                    ID: #{p.property_id}
                                  </span>
                                  <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.property_name}
                                  </span>
                                </div>
                              </div>

                              {/* Proponent Name */}
                              <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '8px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                  {p.sender_social_name || p.sender_name || 'Anônimo'}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>

                              {/* Badge & Value */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: isProposal ? 'rgba(127, 52, 230, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                    color: isProposal ? '#7f34e6' : '#10b981'
                                  }}>
                                    {isProposal ? 'Proposta' : 'Contato'}
                                  </span>

                                  {isProposal && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: p.status === 'aceita' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'recusada' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                      color: p.status === 'aceita' ? '#10b981' : p.status === 'recusada' ? '#ef4444' : '#f59e0b',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}>
                                      {p.status === 'aceita' ? '✓ Aceita' : p.status === 'recusada' ? '✗ Recusada' : '⧗ Pendente'}
                                    </span>
                                  )}
                                </div>

                                {isProposal && (
                                  <strong style={{ fontSize: '0.85rem', color: '#7f34e6', fontWeight: 800 }}>
                                    {formatBRL(p.valor)}
                                  </strong>
                                )}
                              </div>

                              {p.data_visita && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  fontSize: '0.725rem', 
                                  color: '#b45309', 
                                  backgroundColor: '#fffbeb', 
                                  border: '1px solid #fef3c7',
                                  padding: '6px 10px', 
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  marginTop: '2px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={12} style={{ color: '#d97706' }} />
                                    <span>Visita: {new Date(p.data_visita).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                  </div>
                                  <span>{new Date(p.data_visita).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}

                              {/* Quick Action Icons & Stage shifting */}
                              <div 
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  borderTop: '1px solid #f1f5f9', 
                                  paddingTop: '8px', 
                                  marginTop: '2px' 
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {p.sender_phone && (
                                    <a 
                                      href={`https://wa.me/55${p.sender_phone.replace(/\D/g, '')}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{
                                        color: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px',
                                        borderRadius: '6px',
                                        backgroundColor: '#e6fbf3',
                                        transition: 'background-color 0.2s'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d1fae5'}
                                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e6fbf3'}
                                    >
                                      <Phone size={12} />
                                    </a>
                                  )}
                                  
                                  <button
                                    title="Abrir Chat com Cliente"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProposal(p);
                                      setShowChat(true);
                                      fetchChatMessages(p.proposal_id);
                                    }}
                                    style={{
                                      color: '#7f34e6',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '4px',
                                      borderRadius: '6px',
                                      backgroundColor: 'rgba(127, 52, 230, 0.08)',
                                      border: 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      position: 'relative'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 52, 230, 0.15)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 52, 230, 0.08)'}
                                  >
                                    <MessageSquare size={12} />
                                    {p.unread_messages > 0 && (
                                      <span style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.55rem',
                                        fontWeight: 900,
                                        borderRadius: '50%',
                                        width: '8px',
                                        height: '8px',
                                        border: '1.5px solid white'
                                      }} />
                                    )}
                                  </button>

                                  {isProposal && p.status?.toLowerCase() === 'pendente' && (
                                    <button
                                      title="Responder Proposta"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProposal(p);
                                        setShowRespondProposalModal(true);
                                      }}
                                      style={{
                                        color: '#d97706',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px',
                                        borderRadius: '6px',
                                        backgroundColor: '#fef3c7',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fde68a'}
                                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                                    >
                                      <CheckSquare size={12} />
                                    </button>
                                  )}
                                  {p.etapa !== 'novo' && (
                                    <>
                                      <button
                                        title="Registrar tentativa de contato"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenContactAttemptsModal(p);
                                        }}
                                        style={{
                                          color: '#3b82f6',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '4px',
                                          borderRadius: '6px',
                                          backgroundColor: '#eff6ff',
                                          border: 'none',
                                          cursor: 'pointer',
                                          transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                      >
                                        <PhoneCall size={12} />
                                      </button>
                                      <button
                                        title="Agendar card"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenScheduleCardModal(p);
                                        }}
                                        style={{
                                          color: '#059669',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '4px',
                                          borderRadius: '6px',
                                          backgroundColor: '#ecfdf5',
                                          border: 'none',
                                          cursor: 'pointer',
                                          transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d1fae5'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                                      >
                                        <Calendar size={12} />
                                      </button>
                                      <button
                                        title="Ver histórico"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenTimelineLogsModal(p);
                                        }}
                                        style={{
                                          color: '#7f34e6',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '4px',
                                          borderRadius: '6px',
                                          backgroundColor: '#f3e8ff',
                                          border: 'none',
                                          cursor: 'pointer',
                                          transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9d5ff'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}
                                      >
                                        <FileText size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                                {p.data_agendamento && (
                                  <span style={{ 
                                    fontSize: '0.675rem', 
                                    fontWeight: 700, 
                                    color: '#059669', 
                                    backgroundColor: '#ecfdf5', 
                                    padding: '3px 8px', 
                                    borderRadius: '12px',
                                    fontFamily: 'Outfit, sans-serif'
                                  }}>
                                    {new Date(p.data_agendamento).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Centralized Proposal Details Modal ("Card de Atendimento") */}
      {showProposalDetailModal && selectedProposal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30000,
          padding: '20px'
        }} onClick={() => setShowProposalDetailModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '28px',
            width: '100%',
            maxWidth: '680px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ 
              padding: '24px 28px', 
              borderBottom: '1px solid #f1f5f9', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 800, 
                    color: '#7f34e6', 
                    backgroundColor: 'rgba(127, 52, 230, 0.08)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    display: 'inline-block'
                  }}>
                    {selectedProposal.tipo === 'proposta' || Number(selectedProposal.valor) > 0 ? 'Ficha de Proposta' : 'Ficha de Contato'}
                  </span>

                  {(selectedProposal.tipo === 'proposta' || Number(selectedProposal.valor) > 0) && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: selectedProposal.status === 'aceita' ? 'rgba(16, 185, 129, 0.1)' : selectedProposal.status === 'recusada' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: selectedProposal.status === 'aceita' ? '#10b981' : selectedProposal.status === 'recusada' ? '#ef4444' : '#f59e0b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      {selectedProposal.status === 'aceita' ? '✓ Aceita' : selectedProposal.status === 'recusada' ? '✗ Recusada' : '⧗ Pendente'}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Oportunidade #{selectedProposal.proposal_id}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setShowChat(true)}
                  title="Abrir Chat com Cliente"
                  style={{
                    border: 'none',
                    background: 'rgba(127, 52, 230, 0.08)',
                    cursor: 'pointer',
                    color: '#7f34e6',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(127, 52, 230, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(127, 52, 230, 0.08)';
                  }}
                >
                  <MessageSquare size={16} /> Chat
                  {selectedProposal.unread_messages > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white'
                    }}>
                      {selectedProposal.unread_messages}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setShowProposalDetailModal(false)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Grid Client & Property details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Client Box */}
                <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Dados do Cliente
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                      {selectedProposal.sender_name || 'Não informado'}
                    </span>
                    {selectedProposal.sender_email && (
                      <span style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} /> {selectedProposal.sender_email}
                      </span>
                    )}
                    {selectedProposal.sender_phone && (
                      <span style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} /> {selectedProposal.sender_phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Property Box */}
                <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Imóvel de Interesse
                  </span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {selectedProposal.photo && (
                      <img 
                        src={selectedProposal.photo} 
                        alt={selectedProposal.property_name} 
                        style={{ width: '50px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, display: 'block' }}>
                        ID: #{selectedProposal.property_id}
                      </span>
                      <a 
                        href={`/imoveis/${selectedProposal.property_id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 800, 
                          color: '#7f34e6', 
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {selectedProposal.property_name} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit & Card Scheduling Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Agendamento do Card */}
                <div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    <Calendar size={14} style={{ color: '#7f34e6' }} /> Agendamento do Card (Controle Interno)
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="datetime-local"
                      value={selectedProposal.data_agendamento ? new Date(new Date(selectedProposal.data_agendamento).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleUpdateDataAgendamento(selectedProposal.proposal_id, e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: 'white',
                        color: '#1e293b'
                      }}
                    />
                    {selectedProposal.data_agendamento && (
                      <button
                        onClick={() => handleUpdateDataAgendamento(selectedProposal.proposal_id, '')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: '1px solid #ef4444',
                          backgroundColor: 'white',
                          color: '#ef4444',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Compromisso / Visita ao Imóvel */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    <Calendar size={14} style={{ color: '#7f34e6' }} /> Compromisso / Visita ao Imóvel (Externo)
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="datetime-local"
                      value={selectedProposal.data_visita ? new Date(new Date(selectedProposal.data_visita).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleUpdateDataVisita(selectedProposal.proposal_id, e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: 'white',
                        color: '#1e293b'
                      }}
                    />
                    {selectedProposal.data_visita && (
                      <button
                        onClick={() => handleUpdateDataVisita(selectedProposal.proposal_id, '')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: '1px solid #ef4444',
                          backgroundColor: 'white',
                          color: '#ef4444',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>


              {/* Message Details */}
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Dúvida / Mensagem Inicial
                </span>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                  {selectedProposal.mensagem || 'Sem mensagem inicial.'}
                </div>
              </div>

              {/* Internal Notes area */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Anotações Internas (Corretor)
                </span>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Escreva aqui anotações internas sobre este cliente, visitas agendadas, feedbacks, etc. (Apenas você poderá ler)"
                  style={{
                    width: '100%',
                    height: '100px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    fontSize: '0.85rem',
                    color: '#334155',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    onClick={() => handleUpdateNotes(selectedProposal.proposal_id, modalNotes)}
                    style={{
                      backgroundColor: '#7F34E6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Salvar Notas
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Dedicated Chat overlay modal */}
      {showChat && selectedProposal && (
        <div 
          onClick={() => setShowChat(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '460px',
              height: '520px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850, color: '#1e293b' }}>
                  Conversa com {selectedProposal.sender_name || 'Cliente'}
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                  Atendimento #{selectedProposal.proposal_id}
                </span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ 
              flex: 1, 
              backgroundColor: '#f8fafc', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}>
              {loadingChat ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', fontSize: '0.85rem', color: '#64748b' }}>
                  Carregando mensagens...
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Nenhuma mensagem enviada ainda. Use o campo abaixo para iniciar a conversa!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_type === 'corretor';
                  return (
                    <div key={msg.id} style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      backgroundColor: isMe ? '#7f34e6' : 'white',
                      color: isMe ? 'white' : '#1e293b',
                      padding: '10px 14px',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      maxWidth: '80%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                      position: 'relative'
                    }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {msg.mensagem}
                      </p>
                      <div style={{ 
                        fontSize: '0.65rem', 
                        color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8', 
                        textAlign: 'right', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px'
                      }}>
                        <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {msg.lida ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Digite uma mensagem..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                style={{
                  backgroundColor: '#7F34E6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Proposal Modal */}
      {showRespondProposalModal && selectedProposal && (
        <div 
          onClick={() => setShowRespondProposalModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease-out',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850, color: '#1e293b' }}>
                  Responder Proposta Recebida
                </h4>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                  Cliente: {selectedProposal.sender_name || 'Não informado'}
                </span>
              </div>
              <button
                onClick={() => setShowRespondProposalModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(127, 52, 230, 0.04)', border: '1px dashed #c084fc', padding: '14px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Valor Oferecido
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#7f34e6', fontWeight: 850 }}>
                  {formatBRL(selectedProposal.valor)}
                </strong>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Condições de Pagamento / Proposta
                </span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedProposal.condicoes || 'Nenhuma condição especial informada.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={async () => {
                    await handleUpdateStatus(selectedProposal.proposal_id, 'recusada');
                    setShowRespondProposalModal(false);
                  }}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <X size={16} /> Recusar
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStatus(selectedProposal.proposal_id, 'aceita');
                    setShowRespondProposalModal(false);
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Check size={16} /> Aceitar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer overlay */}
      {isLeadsDrawerOpen && (
        <div 
          onClick={() => setIsLeadsDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 30000,
            transition: 'all 0.3s ease-in-out'
          }}
        />
      )}

      {/* Drawer Container */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isLeadsDrawerOpen ? 0 : '-500px',
        width: '500px',
        maxWidth: '100%',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.1)',
        zIndex: 30001,
        transition: 'right 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Outfit', sans-serif"
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Gerenciador de Leads
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Visualização e consulta dos leads cadastrados na plataforma
            </p>
          </div>
          <button 
            onClick={() => setIsLeadsDrawerOpen(false)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Conditional Content based on drawerMode */}
        {drawerMode === 'list' ? (
          <>
            {/* Search & Action bar */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={leadsSearchQuery}
                  onChange={(e) => setLeadsSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                onClick={() => setDrawerMode('create')}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)',
                  transition: 'background-color 0.2s'
                }}
              >
                <Plus size={16} /> Cadastrar Novo Lead
              </button>
            </div>

            {/* Leads List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {filteredLeads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhum lead encontrado.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredLeads.map((lead, idx) => {
                    const waPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
                    return (
                      <div 
                        key={idx}
                        style={{
                          border: '1px solid #f1f5f9',
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{lead.name}</h4>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569' }}>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none' }}>
                              <Mail size={14} /> {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                <Phone size={14} /> {lead.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
                              </span>
                              {waPhone && (
                                <a 
                                  href={`https://wa.me/55${waPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#10b981',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  WhatsApp <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Create Lead View Form */
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button 
              onClick={() => setDrawerMode('list')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
                alignSelf: 'flex-start'
              }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Nome do Cliente *</label>
                <input 
                  type="text"
                  placeholder="Nome Completo" 
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>E-mail</label>
                <input 
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Telefone / Celular</label>
                <input 
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={newLeadPhone}
                  onChange={(e) => handleNewPhoneChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={handleSaveLeadFromDrawer}
                style={{
                  backgroundColor: '#7F34E6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 4px 12px rgba(127, 52, 230, 0.2)',
                  transition: 'opacity 0.2s'
                }}
              >
                Cadastrar Lead
              </button>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .swal2-container {
          z-index: 999999 !important;
        }
      ` }} />
      <Footer />
    </>
  );
}
