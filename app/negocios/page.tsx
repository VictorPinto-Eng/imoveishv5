'use client'

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Briefcase, Loader2, Calendar, Mail, Phone, ExternalLink, 
  Check, X, MessageSquare, AlertCircle, FileText, ArrowRight, ArrowLeft, Clock, CheckSquare, 
  UserCircle2, UserPlus, ShieldAlert, Home, DollarSign, Sparkles, Info,
  Menu, ChevronLeft, ChevronRight, Eye, Pencil, Printer, Plus, PhoneCall
} from 'lucide-react';
import Link from 'next/link';
import { fire, showLoading, close, showValidationMessage } from '@/lib/swal';

type TabType = 'propostas' | 'leads' | 'cadastro' | 'clientes' | 'apoio';

export default function NegociosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('propostas');
  const [proposals, setProposals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [myProperties, setMyProperties] = useState<any[]>([]);
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
        fire({
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

  // Logging and Contact attempts states
  const [proposalLogs, setProposalLogs] = useState<any[]>([]);
  const [proposalAttempts, setProposalAttempts] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [meioContato, setMeioContato] = useState<string>('WhatsApp');
  const [resultadoContato, setResultadoContato] = useState<string>('Mensagem enviada');
  const [detalhesContato, setDetalhesContato] = useState<string>('');
  const [submittingAttempt, setSubmittingAttempt] = useState<boolean>(false);
  const [etapas, setEtapas] = useState<any[]>([
    { nome: 'Novo', sigla: 'novo', ordem: 1 },
    { nome: 'Contato', sigla: 'contato', ordem: 2 },
    { nome: 'Agendamento', sigla: 'agendamento', ordem: 3 },
    { nome: 'Proposta', sigla: 'proposta', ordem: 4 },
    { nome: 'Fechamento', sigla: 'fechamento', ordem: 5 }
  ]);

  // Form State (for Proposals / Site contacts)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formOperationType, setFormOperationType] = useState<'locacao' | 'venda'>('locacao');
  const [formValue, setFormValue] = useState('');
  const [formConditions, setFormConditions] = useState('');
  const [formEtapa, setFormEtapa] = useState<string>('novo');
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Customer Management State
  const [customers, setCustomers] = useState<any[]>([]);
  const [civilStates, setCivilStates] = useState<any[]>([]);
  const [personTypes, setPersonTypes] = useState<any[]>([
    { id_tppessoa: 2, descricao: 'FISICA', sigla: 'F' },
    { id_tppessoa: 1, descricao: 'JURIDICA', sigla: 'J' }
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Support Tables State
  const [supportTable, setSupportTable] = useState<'ramosativ' | 'apopais' | 'apoestado' | 'apocidade' | 'apobairro'>('ramosativ');
  const [supportList, setSupportList] = useState<any[]>([]);
  const [supportSearch, setSupportSearch] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportView, setSupportView] = useState<'list' | 'cadastro'>('list');
  const [isSupportMenuExpanded, setIsSupportMenuExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lists for Support Form Selects
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);

  // Naturalidade state variables
  const [formNatEstadoId, setFormNatEstadoId] = useState('');
  const [formNatCidadeId, setFormNatCidadeId] = useState('');
  const [natStatesList, setNatStatesList] = useState<any[]>([]);
  const [loadingNatStates, setLoadingNatStates] = useState(false);
  const [natCitiesList, setNatCitiesList] = useState<any[]>([]);
  const [loadingNatCities, setLoadingNatCities] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Address cascading dropdowns
  const [formAddrEstadoId, setFormAddrEstadoId] = useState('');
  const [formAddrCidadeId, setFormAddrCidadeId] = useState('');
  const [formAddrBairroId, setFormAddrBairroId] = useState('');
  const [addrEstadosList, setAddrEstadosList] = useState<any[]>([]);
  const [addrCidadesList, setAddrCidadesList] = useState<any[]>([]);
  const [addrBairrosList, setAddrBairrosList] = useState<any[]>([]);
  const [loadingAddrCidades, setLoadingAddrCidades] = useState(false);
  const [loadingAddrBairros, setLoadingAddrBairros] = useState(false);

  // Support Form Fields
  const [supportFormNome, setSupportFormNome] = useState('');
  const [supportFormSigla, setSupportFormSigla] = useState('');
  const [supportFormCodAtiv, setSupportFormCodAtiv] = useState('');
  const [supportFormTpPessoa, setSupportFormTpPessoa] = useState('');
  const [supportFormPaisId, setSupportFormPaisId] = useState('');
  const [supportFormEstadoId, setSupportFormEstadoId] = useState('');
  const [supportFormCidadeId, setSupportFormCidadeId] = useState('');
  const [supportFormCodigoIbge, setSupportFormCodigoIbge] = useState('');
  const [supportFormNacionalidade, setSupportFormNacionalidade] = useState('');
  const [clientesView, setClientesView] = useState<'list' | 'detail' | 'cadastro'>('list');
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnae, setLoadingCnae] = useState(false);

  // Customer Form State
  const [formCustName, setFormCustName] = useState('');
  const [formCustEmail, setFormCustEmail] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formTpPessoa, setFormTpPessoa] = useState<string>('2');
  const [formCnpjCpf, setFormCnpjCpf] = useState('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formNacionalidade, setFormNacionalidade] = useState('');
  const [formNaturalidade, setFormNaturalidade] = useState('');
  const [formEstadoCivilId, setFormEstadoCivilId] = useState('');
  const [formRegimeBens, setFormRegimeBens] = useState('');
  const [regimesList, setRegimesList] = useState<any[]>([]);
  const [formProfissao, setFormProfissao] = useState('');
  const [professionsList, setProfessionsList] = useState<any[]>([]);
  const [loadingProfessions, setLoadingProfessions] = useState(false);
  const [professionSearchQuery, setProfessionSearchQuery] = useState('');
  const [isProfessionDropdownOpen, setIsProfessionDropdownOpen] = useState(false);
  const [formIdentidade, setFormIdentidade] = useState('');
  const [formEmissor, setFormEmissor] = useState('');
  const [formEmissorUf, setFormEmissorUf] = useState('');
  const [formDtEmissaoRg, setFormDtEmissaoRg] = useState('');

  // Spouse Form State
  const [formConjugeNome, setFormConjugeNome] = useState('');
  const [conjugeProfessionsList, setConjugeProfessionsList] = useState<any[]>([]);
  const [loadingConjugeProfessions, setLoadingConjugeProfessions] = useState(false);
  const [conjugeProfessionSearchQuery, setConjugeProfessionSearchQuery] = useState('');
  const [isConjugeProfessionDropdownOpen, setIsConjugeProfessionDropdownOpen] = useState(false);
  const [formConjugeCpf, setFormConjugeCpf] = useState('');
  const [formConjugeNascimento, setFormConjugeNascimento] = useState('');
  const [formConjugeProfissao, setFormConjugeProfissao] = useState('');
  const [formConjugeIdentidade, setFormConjugeIdentidade] = useState('');
  const [formConjugeEmissor, setFormConjugeEmissor] = useState('');
  const [formConjugeEmissorUf, setFormConjugeEmissorUf] = useState('');

  // Dropdown Active Indices for Arrow Key Navigation
  const [activeProfessionIndex, setActiveProfessionIndex] = useState(-1);
  const [activeConjugeProfessionIndex, setActiveConjugeProfessionIndex] = useState(-1);
  const [activeCityIndex, setActiveCityIndex] = useState(-1);

  // Address Form State
  const [formCep, setFormCep] = useState('');
  const [formLogradouro, setFormLogradouro] = useState('');
  const [formNumero, setFormNumero] = useState('');
  const [formComplemento, setFormComplemento] = useState('');
  const [formBairro, setFormBairro] = useState('');
  const [formCidade, setFormCidade] = useState('');
  const [formEstado, setFormEstado] = useState('');

  // Dropdown Keyboard Navigation Event Handlers & Scroll Synchronization
  const handleProfessionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = professionsList.filter(p =>
      p.nome.toLowerCase().includes(professionSearchQuery.toLowerCase())
    );

    if (!isProfessionDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsProfessionDropdownOpen(true);
        setActiveProfessionIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveProfessionIndex(prev => {
        const next = prev + 1;
        return next < filtered.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveProfessionIndex(prev => {
        const next = prev - 1;
        return next >= 0 ? next : -1;
      });
    } else if (e.key === 'Enter') {
      if (activeProfessionIndex >= 0 && activeProfessionIndex < filtered.length) {
        e.preventDefault();
        const selected = filtered[activeProfessionIndex];
        setProfessionSearchQuery(selected.nome);
        setFormFormProfissaoWithIndexReset(String(selected.id_ramosativ), selected.nome);
      }
    } else if (e.key === 'Escape') {
      setIsProfessionDropdownOpen(false);
      setActiveProfessionIndex(-1);
    }
  };

  const setFormFormProfissaoWithIndexReset = (idVal: string, nameVal: string) => {
    setProfessionSearchQuery(nameVal);
    setFormProfissao(idVal);
    setIsProfessionDropdownOpen(false);
    setActiveProfessionIndex(-1);
  };

  const handleConjugeProfessionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = conjugeProfessionsList.filter(p =>
      p.nome.toLowerCase().includes(conjugeProfessionSearchQuery.toLowerCase())
    );

    if (!isConjugeProfessionDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsConjugeProfessionDropdownOpen(true);
        setActiveConjugeProfessionIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveConjugeProfessionIndex(prev => {
        const next = prev + 1;
        return next < filtered.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveConjugeProfessionIndex(prev => {
        const next = prev - 1;
        return next >= 0 ? next : -1;
      });
    } else if (e.key === 'Enter') {
      if (activeConjugeProfessionIndex >= 0 && activeConjugeProfessionIndex < filtered.length) {
        e.preventDefault();
        const selected = filtered[activeConjugeProfessionIndex];
        setConjugeProfessionSearchQuery(selected.nome);
        setFormConjugeProfissao(String(selected.id_ramosativ));
        setIsConjugeProfessionDropdownOpen(false);
        setActiveConjugeProfessionIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setIsConjugeProfessionDropdownOpen(false);
      setActiveConjugeProfessionIndex(-1);
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = natCitiesList.filter(cid =>
      cid.descricao.toLowerCase().includes(citySearchQuery.toLowerCase())
    );

    if (!isCityDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsCityDropdownOpen(true);
        setActiveCityIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCityIndex(prev => {
        const next = prev + 1;
        return next < filtered.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCityIndex(prev => {
        const next = prev - 1;
        return next >= 0 ? next : -1;
      });
    } else if (e.key === 'Enter') {
      if (activeCityIndex >= 0 && activeCityIndex < filtered.length) {
        e.preventDefault();
        const selected = filtered[activeCityIndex];
        setCitySearchQuery(selected.descricao);
        setFormNatCidadeId(String(selected.id));
        setIsCityDropdownOpen(false);
        setActiveCityIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setIsCityDropdownOpen(false);
      setActiveCityIndex(-1);
    }
  };

  useEffect(() => {
    if (activeProfessionIndex >= 0) {
      const container = document.getElementById('primary-profession-dropdown');
      if (container) {
        const activeItem = container.children[activeProfessionIndex] as HTMLElement;
        if (activeItem) {
          container.scrollTop = activeItem.offsetTop - container.clientHeight / 2 + activeItem.clientHeight / 2;
        }
      }
    }
  }, [activeProfessionIndex]);

  useEffect(() => {
    if (activeConjugeProfessionIndex >= 0) {
      const container = document.getElementById('conjuge-profession-dropdown');
      if (container) {
        const activeItem = container.children[activeConjugeProfessionIndex] as HTMLElement;
        if (activeItem) {
          container.scrollTop = activeItem.offsetTop - container.clientHeight / 2 + activeItem.clientHeight / 2;
        }
      }
    }
  }, [activeConjugeProfessionIndex]);

  useEffect(() => {
    if (activeCityIndex >= 0) {
      const container = document.getElementById('city-dropdown');
      if (container) {
        const activeItem = container.children[activeCityIndex] as HTMLElement;
        if (activeItem) {
          container.scrollTop = activeItem.offsetTop - container.clientHeight / 2 + activeItem.clientHeight / 2;
        }
      }
    }
  }, [activeCityIndex]);

  const fetchBusinessData = async () => {
    try {
      const res = await fetch('/api/user/negocios');
      const data = await res.json();
      if (res.ok && data.success) {
        setProposals(data.atendimentos || []);
        if (data.etapas && data.etapas.length > 0) {
          setEtapas(data.etapas);
        }
        setLeads([]);
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
        fire({
          icon: 'success',
          title: 'Registrado!',
          text: 'Tentativa de contato gravada com sucesso.',
          confirmButtonColor: '#7F34E6'
        });
        await fetchProposalLogs(selectedProposal.proposal_id);
      } else {
        fire({
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
    fire({
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
      fire({
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
    fire({
      title: 'Carregando...',
      allowOutsideClick: false,
      didOpen: () => {
        showLoading();
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

      fire({
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
            close();
            handleTriggerContactAttemptSwal(proposal.proposal_id);
          });
          document.getElementById('swal-btn-generate-pdf')?.addEventListener('click', () => {
            handleGenerateContactAttemptsPDF(proposal, sortedAttempts);
          });
        }
      });

    } catch (err: any) {
      console.error(err);
      fire({
        icon: 'error',
        title: 'Erro',
        text: err.message || 'Não foi possível carregar as tentativas de contato.',
        confirmButtonColor: '#7F34E6'
      });
    }
  };

  const handleOpenTimelineLogsModal = async (proposal: any) => {
    fire({
      title: 'Carregando...',
      allowOutsideClick: false,
      didOpen: () => {
        showLoading();
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

      fire({
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
      fire({
        icon: 'error',
        title: 'Erro',
        text: err.message || 'Não foi possível carregar o histórico de acompanhamento.',
        confirmButtonColor: '#7F34E6'
      });
    }
  };

  useEffect(() => {
    if (showProposalDetailModal && selectedProposal?.proposal_id) {
      fetchProposalLogs(selectedProposal.proposal_id);
      fetchChatMessages(selectedProposal.proposal_id);
    }
  }, [showProposalDetailModal, selectedProposal?.proposal_id]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/user/clientes');
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomers(data.list || []);
        if (data.list && data.list.length > 0) {
          setSelectedCustomer(data.list[0]);
        } else {
          setSelectedCustomer(null);
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchCivilStates = async () => {
    try {
      const res = await fetch('/api/user/clientes?type=estados-civis');
      const data = await res.json();
      if (res.ok && data.success) {
        setCivilStates(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching civil states:', err);
    }
  };

  const fetchRegimesList = async () => {
    try {
      const res = await fetch('/api/user/clientes?type=regime-bens');
      const data = await res.json();
      if (res.ok && data.success) {
        setRegimesList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching regimes:', err);
    }
  };

  const fetchConjugeProfessionsList = async () => {
    setLoadingConjugeProfessions(true);
    try {
      const res = await fetch('/api/user/apoio?table=ramosativ&idTpPessoa=2', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setConjugeProfessionsList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching conjuge professions:', err);
    } finally {
      setLoadingConjugeProfessions(false);
    }
  };

  const fetchPersonTypes = async () => {
    try {
      const res = await fetch('/api/user/clientes?type=tppessoa', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success && data.list && data.list.length > 0) {
        setPersonTypes(data.list);
        const pf = data.list.find((pt: any) => pt.descricao === 'FISICA' || pt.sigla === 'F');
        if (pf) {
          setFormTpPessoa(String(pf.id_tppessoa));
        }
      }
    } catch (err) {
      console.error('Error fetching person types:', err);
    }
  };

  const fetchSupportData = async (table: string, search: string = '') => {
    const cleanSearch = search.trim();
    if (cleanSearch.length < 3) {
      setSupportList([]);
      return;
    }
    setLoadingSupport(true);
    try {
      const res = await fetch(`/api/user/apoio?table=${table}&search=${encodeURIComponent(cleanSearch)}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportList(data.list || []);
      }
    } catch (err) {
      console.error(`Error fetching support table ${table}:`, err);
    } finally {
      setLoadingSupport(false);
    }
  };

  const fetchCountriesList = async () => {
    try {
      const res = await fetch('/api/user/apoio?table=apopais', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) setCountriesList(data.list || []);
    } catch (err) {}
  };

  const fetchStatesList = async () => {
    try {
      const res = await fetch('/api/user/apoio?table=apoestado', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) setStatesList(data.list || []);
    } catch (err) {}
  };

  const fetchCitiesList = async () => {
    try {
      const res = await fetch('/api/user/apoio?table=apocidade', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) setCitiesList(data.list || []);
    } catch (err) {}
  };

  const fetchNatStates = async (paisId: string) => {
    if (!paisId) {
      setNatStatesList([]);
      return;
    }
    setLoadingNatStates(true);
    try {
      const res = await fetch(`/api/user/apoio?table=apoestado&paisId=${paisId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setNatStatesList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching naturalidade states:', err);
    } finally {
      setLoadingNatStates(false);
    }
  };

  useEffect(() => {
    if (formNacionalidade) {
      fetchNatStates(formNacionalidade);
    } else {
      setNatStatesList([]);
    }
  }, [formNacionalidade]);

  const fetchProfessionsList = async (tpPessoaId: string) => {
    if (!tpPessoaId) {
      setProfessionsList([]);
      return;
    }
    setLoadingProfessions(true);
    try {
      const res = await fetch(`/api/user/apoio?table=ramosativ&idTpPessoa=${tpPessoaId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfessionsList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching professions list:', err);
    } finally {
      setLoadingProfessions(false);
    }
  };

  useEffect(() => {
    if (formTpPessoa) {
      fetchProfessionsList(formTpPessoa);
    } else {
      setProfessionsList([]);
    }
  }, [formTpPessoa]);

  const fetchNatCities = async (estadoId: string) => {
    if (!estadoId) {
      setNatCitiesList([]);
      return;
    }
    setLoadingNatCities(true);
    try {
      const res = await fetch(`/api/user/apoio?table=apocidade&estadoId=${estadoId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setNatCitiesList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching naturalidade cities:', err);
    } finally {
      setLoadingNatCities(false);
    }
  };

  useEffect(() => {
    if (formNatEstadoId) {
      fetchNatCities(formNatEstadoId);
    } else {
      setNatCitiesList([]);
    }
  }, [formNatEstadoId]);

  // Fetch Brazilian states for address dropdown (pais_id=1 assumed = Brasil)
  const fetchAddrEstados = async () => {
    try {
      // Fetch all states (no paisId filter - get all to allow manual state selection)
      const res = await fetch(`/api/user/apoio?table=apoestado`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddrEstadosList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching address states:', err);
    }
  };

  const fetchAddrCidades = async (estadoId: string) => {
    if (!estadoId) { setAddrCidadesList([]); setAddrBairrosList([]); return; }
    setLoadingAddrCidades(true);
    try {
      const res = await fetch(`/api/user/apoio?table=apocidade&estadoId=${estadoId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddrCidadesList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching address cities:', err);
    } finally {
      setLoadingAddrCidades(false);
    }
  };

  const fetchAddrBairros = async (cidadeId: string) => {
    if (!cidadeId) { setAddrBairrosList([]); return; }
    setLoadingAddrBairros(true);
    try {
      const res = await fetch(`/api/user/apoio?table=apobairro&cidadeId=${cidadeId}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddrBairrosList(data.list || []);
      }
    } catch (err) {
      console.error('Error fetching address bairros:', err);
    } finally {
      setLoadingAddrBairros(false);
    }
  };

  useEffect(() => { fetchAddrEstados(); }, []);

  useEffect(() => {
    if (formAddrEstadoId) {
      fetchAddrCidades(formAddrEstadoId);
    } else {
      setAddrCidadesList([]);
      setAddrBairrosList([]);
      setFormAddrCidadeId('');
      setFormAddrBairroId('');
    }
  }, [formAddrEstadoId]);

  useEffect(() => {
    if (formAddrCidadeId) {
      fetchAddrBairros(formAddrCidadeId);
    } else {
      setAddrBairrosList([]);
      setFormAddrBairroId('');
    }
  }, [formAddrCidadeId]);

  useEffect(() => {
    if (activeTab === 'apoio') {
      setIsSupportMenuExpanded(true);
      setSupportView('list');
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'apoio') {
      const delayDebounce = setTimeout(() => {
        fetchSupportData(supportTable, supportSearch);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [supportSearch, supportTable, activeTab]);

  // Reset search input and list when support table type changes
  useEffect(() => {
    setSupportSearch('');
    setSupportList([]);
  }, [supportTable]);

  useEffect(() => {
    const isMarried = formEstadoCivilId === '2' || formEstadoCivilId === '6';
    if (!isMarried) {
      setFormRegimeBens('');
    }
  }, [formEstadoCivilId]);

  useEffect(() => {
    if (showSupportModal) {
      if (supportTable === 'apoestado') {
        fetchCountriesList();
      } else if (supportTable === 'apocidade') {
        fetchStatesList();
      } else if (supportTable === 'apobairro') {
        fetchStatesList();
        fetchCitiesList();
      }
    }
  }, [showSupportModal, supportTable]);

  const handleSearchCnae = async () => {
    const clean = supportFormCodAtiv.replace(/\D/g, '');
    if (!clean || (clean.length !== 5 && clean.length !== 7)) {
      fire({
        icon: 'warning',
        title: 'Código Inválido',
        text: 'Por favor, digite um código de 5 ou 7 dígitos (ex: 4520-0 ou 4520-0/01).',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    setLoadingCnae(true);
    try {
      const url = clean.length === 5 
        ? `https://servicodados.ibge.gov.br/api/v2/cnae/classes/${clean}`
        : `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses/${clean}`;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error('CNAE não encontrado');
      
      const data = await res.json();
      if (!data || !data.descricao) {
        throw new Error('Descrição não encontrada no retorno da API');
      }

      // Convert to UPPER CASE without accents
      const formattedName = data.descricao
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();

      setSupportFormNome(formattedName);
      
      fire({
        icon: 'success',
        title: 'CNAE Encontrado',
        text: `Atividade preenchida: "${formattedName}"`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error(err);
      fire({
        icon: 'error',
        title: 'Erro na busca',
        text: 'Não foi possível encontrar uma atividade econômica com o código informado.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setLoadingCnae(false);
    }
  };

  const handleCreateSupportRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { table: supportTable };

    if (supportTable === 'ramosativ') {
      if (!supportFormNome) return alertError('Nome é obrigatório');
      if (!supportFormTpPessoa) return alertError('Tipo de Pessoa é obrigatório');
      payload.nome = supportFormNome;
      payload.codativ = supportFormCodAtiv;
      payload.idTpPessoa = supportFormTpPessoa;
    } else if (supportTable === 'apopais') {
      if (!supportFormNome || !supportFormSigla || !supportFormNacionalidade) {
        return alertError('Nome, Sigla e Nacionalidade são obrigatórios');
      }
      payload.nome = supportFormNome;
      payload.sigla = supportFormSigla;
      payload.nacionalidade = supportFormNacionalidade;
    } else if (supportTable === 'apoestado') {
      if (!supportFormNome || !supportFormSigla || !supportFormPaisId) return alertError('Nome, Sigla e País são obrigatórios');
      payload.nome = supportFormNome;
      payload.sigla = supportFormSigla;
      payload.paisId = supportFormPaisId;
      payload.codigoIbge = supportFormCodigoIbge;
    } else if (supportTable === 'apocidade') {
      if (!supportFormNome || !supportFormEstadoId) return alertError('Nome e Estado são obrigatórios');
      payload.descricao = supportFormNome;
      payload.estadoId = supportFormEstadoId;
      payload.codigoIbge = supportFormCodigoIbge;
    } else if (supportTable === 'apobairro') {
      if (!supportFormNome || !supportFormCidadeId || !supportFormEstadoId) return alertError('Nome, Cidade e Estado são obrigatórios');
      payload.descricao = supportFormNome;
      payload.cidadeId = supportFormCidadeId;
      payload.estadoId = supportFormEstadoId;
    }

    try {
      const res = await fetch('/api/user/apoio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fire({
          icon: 'success',
          title: 'Sucesso!',
          text: data.message || 'Registro cadastrado com sucesso!',
          confirmButtonColor: '#7F34E6'
        });
        const addedName = supportFormNome || supportFormSigla;
        setSupportSearch(addedName);
        setSupportView('list');
        setSupportFormNome('');
        setSupportFormSigla('');
        setSupportFormCodAtiv('');
        setSupportFormTpPessoa('');
        setSupportFormPaisId('');
        setSupportFormEstadoId('');
        setSupportFormCidadeId('');
        setSupportFormCodigoIbge('');
        setSupportFormNacionalidade('');
      } else {
        alertError(data.error || 'Erro ao cadastrar registro');
      }
    } catch (err) {
      console.error(err);
      alertError('Erro ao conectar com o servidor');
    }
  };

  const alertError = (msg: string) => {
    fire({
      icon: 'error',
      title: 'Erro',
      text: msg,
      confirmButtonColor: '#7F34E6'
    });
  };

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
          await Promise.all([
            fetchBusinessData(),
            fetchCustomers(),
            fetchCivilStates(),
            fetchRegimesList(),
            fetchConjugeProfessionsList(),
            fetchPersonTypes(),
            fetchStatesList(),
            fetchCountriesList()
          ]);

          // Fetch owner's properties for the dropdown select
          const propRes = await fetch('/api/user/imoveis');
          const propData = await propRes.json();
          if (propRes.ok && propData.success) {
            setMyProperties(propData.imoveis || []);
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

  const handleUpdateStatus = async (proposalId: number, newStatus: 'aceita' | 'recusada') => {
    const actionText = newStatus === 'aceita' ? 'aceitar' : 'recusar';
    const confirmColor = newStatus === 'aceita' ? '#10b981' : '#ef4444';

    const confirmResult = await fire({
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
        fire({
          icon: 'success',
          title: 'Sucesso!',
          text: `A proposta foi marcada como ${newStatus === 'aceita' ? 'aceita' : 'recusada'}.`,
          confirmButtonColor: '#7F34E6'
        });
      } else {
        fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar a proposta.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
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
      } else {
        fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar o estágio da negociação.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
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
        fire({
          icon: 'success',
          title: 'Notas Salvas!',
          text: 'As anotações internas foram salvas com sucesso.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar as anotações.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
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
        fire({
          icon: 'success',
          title: dateStr ? 'Visita Agendada!' : 'Agendamento Removido!',
          text: dateStr ? 'A data da visita foi agendada e o card movido para Agendamento.' : 'A data da visita foi removida.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar a data da visita.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
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
        fire({
          icon: 'success',
          title: dateStr ? 'Agendamento do Card Atualizado!' : 'Agendamento Removido!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        fire({
          icon: 'error',
          title: 'Erro',
          text: data.error || 'Não foi possível atualizar o agendamento do card.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
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

    fire({
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

  const handlePrintAgendamentos = (cards: any[]) => {    const sortedCards = [...cards].sort((a, b) => {
      if (!a.data_visita) return 1;
      if (!b.data_visita) return -1;
      return new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime();
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      fire({
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

  const handleEditClick = (c: any) => {
    setEditingCustomerId(c.idcustomer);
    setFormCustName(c.nome || '');
    setFormTpPessoa(c.id_tppessoa ? String(c.id_tppessoa) : '2');
    setFormCnpjCpf(c.cnpjcpf ? formatDoc(c.cnpjcpf) : '');
    setFormCustEmail(c.email || '');
    setFormCustPhone(c.cel ? formatPhone(c.cel) : '');
    setFormNascimento(c.nascimento ? new Date(c.nascimento).toLocaleDateString('pt-BR') : '');
    
    // Nacionalidade & Naturalidade
    setFormNacionalidade(c.nacionalidade ? String(c.nacionalidade) : '');
    setFormNatEstadoId(c.naturalidade_uf ? String(c.naturalidade_uf) : '');
    setFormNatCidadeId(c.naturalidade_cidade ? String(c.naturalidade_cidade) : '');
    setCitySearchQuery(c.naturalidade_cidade_nome || '');
    
    setFormEstadoCivilId(c.estadocivil_id ? String(c.estadocivil_id) : '');
    setFormRegimeBens(c.regime_bens_id ? String(c.regime_bens_id) : '');
    
    // Profession
    setFormProfissao(c.profissao ? String(c.profissao) : '');
    setProfessionSearchQuery(c.profissao_nome || '');
    
    setFormIdentidade(c.identidade || '');
    setFormEmissor(c.emissor || '');
    setFormEmissorUf(c.emissor_uf ? String(c.emissor_uf) : '');
    setFormDtEmissaoRg(c.dt_emissao_rg ? new Date(c.dt_emissao_rg).toLocaleDateString('pt-BR') : '');
    
    // Spouse
    setFormConjugeNome(c.conjuge_nome || '');
    setFormConjugeCpf(c.conjuge_cpf ? formatCPF(c.conjuge_cpf) : '');
    setFormConjugeNascimento(c.conjuge_nascimento ? new Date(c.conjuge_nascimento).toLocaleDateString('pt-BR') : '');
    
    // Match spouse profession by name in the list
    if (c.conjuge_profissao) {
      setConjugeProfessionSearchQuery(c.conjuge_profissao);
      const matchConj = conjugeProfessionsList.find(p => p.nome === c.conjuge_profissao);
      if (matchConj) {
        setFormConjugeProfissao(String(matchConj.id_ramosativ));
      } else {
        setFormConjugeProfissao('');
      }
    } else {
      setConjugeProfessionSearchQuery('');
      setFormConjugeProfissao('');
    }
    
    setFormConjugeIdentidade(c.conjuge_identidade || '');
    setFormConjugeEmissor(c.conjuge_emissor || '');
    setFormConjugeEmissorUf(c.conjuge_emissor_uf || '');
    
    // Address
    setFormCep(c.cep ? formatCEP(c.cep) : '');
    setFormLogradouro(c.logradouro || '');
    setFormNumero(c.numero || '');
    setFormComplemento(c.complemento || '');
    setFormBairro(c.bairro_nome || '');
    setFormCidade(c.cidade_nome || '');
    setFormEstado(c.estado_uf || '');
    // Address cascading IDs
    const addrEstadoIdStr = c.estado_id ? String(c.estado_id) : '';
    const addrCidadeIdStr = c.cidade_id ? String(c.cidade_id) : '';
    const addrBairroIdStr = c.bairro_id ? String(c.bairro_id) : '';
    setFormAddrEstadoId(addrEstadoIdStr);
    setFormAddrCidadeId(addrCidadeIdStr);
    setFormAddrBairroId(addrBairroIdStr);
    // Pre-load cidade and bairro lists for the cascading selects
    if (addrEstadoIdStr) fetchAddrCidades(addrEstadoIdStr);
    if (addrCidadeIdStr) fetchAddrBairros(addrCidadeIdStr);
    
    setClientesView('cadastro');
    setWizardStep(1);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustName || !formCnpjCpf) {
      fire({
        icon: 'warning',
        title: 'Campos Obrigatórios',
        text: 'Por favor, preencha o Nome e o CPF/CNPJ.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = editingCustomerId !== null;
      const method = isEdit ? 'PUT' : 'POST';
      const bodyPayload: any = {
        tpPessoa: formTpPessoa,
        nome: formCustName,
        cnpjcpf: formCnpjCpf.replace(/\D/g, ''),
        email: formCustEmail,
        cel: formCustPhone.replace(/\D/g, ''),
        nascimento: parseDateToISO(formNascimento),
        nacionalidade: formNacionalidade,
        naturalidade: formNaturalidade,
        naturalidadeCidadeId: formNatCidadeId,
        naturalidadeUfId: formNatEstadoId,
        estadoCivilId: formEstadoCivilId,
        regimeBens: formRegimeBens,
        profissao: formProfissao,
        identidade: formIdentidade,
        emissor: formEmissor,
        emissorUf: formEmissorUf,
        dtEmissaoRg: parseDateToISO(formDtEmissaoRg),
        conjugeNome: formConjugeNome,
        conjugeCpf: formConjugeCpf.replace(/\D/g, ''),
        conjugeNascimento: parseDateToISO(formConjugeNascimento),
        conjugeProfissao: formConjugeProfissao,
        conjugeIdentidade: formConjugeIdentidade,
        conjugeEmissor: formConjugeEmissor,
        conjugeEmissorUf: formConjugeEmissorUf,
        cep: formCep.replace(/\D/g, ''),
        logradouro: formLogradouro,
        numero: formNumero,
        complemento: formComplemento,
        bairro: formBairro,
        cidade: formCidade,
        estado: formEstado,
        estadoId: formAddrEstadoId || null,
        cidadeId: formAddrCidadeId || null,
        bairroId: formAddrBairroId || null
      };

      if (isEdit) {
        bodyPayload.idcustomer = editingCustomerId;
      }

      const res = await fetch('/api/user/clientes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fire({
          icon: 'success',
          title: isEdit ? 'Cliente Atualizado! 🎉' : 'Cliente Cadastrado! 🎉',
          text: isEdit ? 'O cadastro do cliente foi atualizado com sucesso.' : 'O cliente foi registrado com sucesso para geração de contratos.',
          confirmButtonColor: '#7F34E6'
        });

        // Reset Form
        setFormCustName('');
        setFormCnpjCpf('');
        setFormCustEmail('');
        setFormCustPhone('');
        setFormNascimento('');
        setFormNacionalidade('');
        setFormNaturalidade('');
        setFormNatEstadoId('');
        setFormNatCidadeId('');
        setCitySearchQuery('');
        setFormEstadoCivilId('');
        setFormRegimeBens('');
        setFormProfissao('');
        setProfessionSearchQuery('');
        setFormIdentidade('');
        setFormEmissor('');
        setFormEmissorUf('');
        setFormDtEmissaoRg('');
        setFormConjugeNome('');
        setFormConjugeCpf('');
        setFormConjugeNascimento('');
        setFormConjugeProfissao('');
        setConjugeProfessionSearchQuery('');
        setFormConjugeIdentidade('');
        setFormConjugeEmissor('');
        setFormConjugeEmissorUf('');
        setFormCep('');
        setFormLogradouro('');
        setFormNumero('');
        setFormComplemento('');
        setFormBairro('');
        setFormCidade('');
        setFormEstado('');
        setFormAddrEstadoId('');
        setFormAddrCidadeId('');
        setFormAddrBairroId('');
        setAddrCidadesList([]);
        setAddrBairrosList([]);
        setEditingCustomerId(null);

        setWizardStep(1);
        setClientesView('list');
        await fetchCustomers();
      } else {
        fire({
          icon: 'error',
          title: isEdit ? 'Erro ao Atualizar' : 'Erro ao Cadastrar',
          text: data.error || 'Não foi possível salvar os dados do cliente.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupLeadSwal = () => {
    if (proposals.length === 0) {
      fire({
        icon: 'info',
        title: 'Nenhum Lead Disponível',
        text: 'Não há leads cadastrados no funil. Deseja cadastrar um novo?',
        showCancelButton: true,
        confirmButtonText: 'Cadastrar Lead',
        cancelButtonText: 'Fechar',
        confirmButtonColor: '#7F34E6',
        cancelButtonColor: '#64748b'
      }).then((result) => {
        if (result.isConfirmed) {
          handleOpenCreateLeadModal();
        }
      });
      return;
    }

    const optionsHtml = proposals.map(lead => {
      const valorStr = lead.valor && Number(lead.valor) > 0 
        ? Number(lead.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
        : 'Contato';
      return `<option value="${lead.proposal_id}">${lead.sender_name || 'Anônimo'} - ${lead.property_name || 'Imóvel'} (${valorStr})</option>`;
    }).join('');

    fire({
      title: 'Importar Lead Existente',
      html: `
        <div style="text-align: left; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; gap: 16px; padding: 10px 0;">
          <p style="font-size: 13px; color: #64748b; margin: 0;">Selecione um lead da lista para carregar automaticamente o Nome, E-mail e Telefone.</p>
          <div>
            <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 6px; text-transform: uppercase;">Selecionar Lead</label>
            <select id="swal-lookup-lead-select" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px; border: 1px solid #cbd5e1; outline: none; cursor: pointer; background-color: white;">
              <option value="">Selecione um lead...</option>
              ${optionsHtml}
            </select>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 12px; color: #64748b;">Não encontrou o lead na lista?</span>
            <button type="button" id="swal-btn-create-lead-new" style="background: rgba(16, 185, 129, 0.08); color: #10b981; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; alignItems: center; gap: 4px;">
              + Cadastrar Novo Lead
            </button>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Importar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7F34E6',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      didOpen: () => {
        const createBtn = document.getElementById('swal-btn-create-lead-new');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            close();
            setTimeout(() => {
              handleOpenCreateLeadModal();
            }, 250);
          });
        }
      },
      preConfirm: () => {
        const selectedId = (document.getElementById('swal-lookup-lead-select') as HTMLSelectElement).value;
        if (!selectedId) {
          showValidationMessage('Selecione um lead para importar ou cancele.');
          return false;
        }
        return selectedId;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const selectedId = result.value;
        const lead = proposals.find(p => String(p.proposal_id) === String(selectedId));
        if (lead) {
          setFormCustName(lead.sender_social_name || lead.sender_name || '');
          setFormCustEmail(lead.sender_email || '');
          setFormCustPhone(lead.sender_phone ? formatPhone(lead.sender_phone) : '');
          fire({
            icon: 'success',
            title: 'Dados Importados!',
            text: 'Nome, E-mail e Telefone preenchidos a partir do lead.',
            timer: 1500,
            showConfirmButton: false
          });
        }
      }
    });
  };

  const handleOpenCreateLeadModal = () => {
    if (myProperties.length === 0) {
      fire({
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

    fire({
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
            <input id="swal-lead-name" class="swal2-input" placeholder="Nome Completo" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="swal2-grid-mobile">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">E-mail</label>
              <input id="swal-lead-email" type="email" class="swal2-input" placeholder="email@exemplo.com" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase;">Telefone / Celular</label>
              <input id="swal-lead-phone" class="swal2-input" placeholder="(00) 00000-0000" style="margin: 0; width: 100%; box-sizing: border-box; height: 44px; border-radius: 8px; font-size: 14px;">
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
          showValidationMessage('Por favor, preencha o Nome e o Imóvel de Interesse.');
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
            fire({
              icon: 'success',
              title: 'Lead Cadastrado! 🎉',
              text: 'A nova oportunidade foi cadastrada com sucesso.',
              confirmButtonColor: '#7F34E6'
            });
            await fetchBusinessData();
            
            // Auto-populate customer fields
            setFormCustName(payload.name);
            if (payload.email) setFormCustEmail(payload.email);
            if (payload.phone) setFormCustPhone(formatPhone(payload.phone));
          } else {
            fire({
              icon: 'error',
              title: 'Erro ao Cadastrar',
              text: data.error || 'Não foi possível registrar o lead.',
              confirmButtonColor: '#7F34E6'
            });
          }
        } catch (err) {
          console.error(err);
          fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro de conexão com o servidor.',
            confirmButtonColor: '#7F34E6'
          });
        }
      }
    });
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'BUTTON' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      
      e.preventDefault();
      
      const form = e.currentTarget;
      const allElements = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        )
      ).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.tabIndex !== -1;
      });
      
      const index = allElements.indexOf(activeEl as any);
      if (index > -1 && index < allElements.length - 1) {
        allElements[index + 1].focus();
      }
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPropertyId) {
      fire({
        icon: 'warning',
        title: 'Campos Obrigatórios',
        text: 'Por favor, preencha o Nome e o Imóvel de Interesse.',
        confirmButtonColor: '#7F34E6'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user/negocios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone.replace(/\D/g, ''),
          propertyId: formPropertyId,
          value: formValue ? Number(formValue) : null,
          conditions: formConditions,
          operationType: formOperationType,
          etapa: formEtapa
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fire({
          icon: 'success',
          title: 'Lead Cadastrado! 🎉',
          text: 'O lead e a proposta foram registrados com sucesso.',
          confirmButtonColor: '#7F34E6'
        });

        // Reset Form
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormPropertyId('');
        setFormValue('');
        setFormConditions('');
        setFormEtapa('novo');

        setActiveTab('propostas');
        await fetchBusinessData();
      } else {
        fire({
          icon: 'error',
          title: 'Erro ao Cadastrar',
          text: data.error || 'Não foi possível registrar o lead.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (err) {
      console.error(err);
      fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro de conexão com o servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = formCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!res.ok) { console.error('[CEP] ViaCEP request failed', res.status); return; }
      const data = await res.json();
      if (data.erro) { console.warn('[CEP] CEP not found:', cleanCep); return; }

      console.log('[CEP] ViaCEP data:', data);

      setFormLogradouro(data.logradouro || '');
      setFormBairro(data.bairro || '');
      setFormCidade(data.localidade || '');
      setFormEstado(data.uf || '');

      const uf = (data.uf || '').toUpperCase();
      const localidade = data.localidade || '';
      const bairroNome = data.bairro || '';
      const ibgeCidadeCod = data.ibge || null;

      if (!uf) return;

      // 1. Find estado in our DB (fetch inline if list not loaded yet)
      let estadosList = addrEstadosList;
      if (!estadosList || estadosList.length === 0) {
        try {
          const estRes = await fetch('/api/user/apoio?table=apoestado', { cache: 'no-store' });
          const estData = await estRes.json();
          if (estRes.ok && estData.success) {
            estadosList = estData.list || [];
            setAddrEstadosList(estadosList);
          }
        } catch (_) {}
      }

      console.log('[CEP] estados list length:', estadosList.length, '| looking for UF:', uf);

      const estadoMatch = estadosList.find(
        (e: any) => e.sigla?.toUpperCase() === uf
      );
      if (!estadoMatch) {
        console.error('[CEP] Estado não encontrado no banco para UF:', uf);
        setFormAddrEstadoId('');
        setFormAddrCidadeId('');
        setFormAddrBairroId('');
        return;
      }
      console.log('[CEP] Estado encontrado:', estadoMatch);
      setFormAddrEstadoId(String(estadoMatch.id));

      // 2. Fetch cidades for this estado
      const cidadesRes = await fetch(`/api/user/apoio?table=apocidade&estadoId=${estadoMatch.id}`, { cache: 'no-store' });
      const cidadesData = await cidadesRes.json();
      let cidades: any[] = cidadesData.list || [];
      setAddrCidadesList(cidades);
      console.log('[CEP] cidades carregadas:', cidades.length, '| buscando:', localidade.toUpperCase());

      let cidadeId: string;
      const cidadeMatch = cidades.find(
        (c: any) => c.descricao?.toUpperCase() === localidade.toUpperCase()
      );

      if (cidadeMatch) {
        console.log('[CEP] Cidade encontrada:', cidadeMatch);
        cidadeId = String(cidadeMatch.id);
      } else if (localidade) {
        console.log('[CEP] Cidade não encontrada, criando:', localidade.toUpperCase());
        const createCidadeRes = await fetch('/api/user/apoio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'apocidade',
            descricao: localidade.toUpperCase(),
            estadoId: estadoMatch.id,
            codigoIbge: ibgeCidadeCod
          })
        });
        const createCidadeData = await createCidadeRes.json();
        console.log('[CEP] Criar cidade response:', createCidadeRes.status, createCidadeData);
        if (createCidadeRes.ok && createCidadeData.record) {
          const newCidade = createCidadeData.record;
          cidadeId = String(newCidade.id);
          // Deduplicate: remove any existing entry with same id before adding
          cidades = [...cidades.filter((c: any) => String(c.id) !== cidadeId), { ...newCidade, descricao: localidade.toUpperCase() }];
          setAddrCidadesList(cidades);
        } else {
          console.error('[CEP] Falhou ao criar cidade:', createCidadeData);
          setFormAddrCidadeId('');
          setAddrBairrosList([]);
          setFormAddrBairroId('');
          return;
        }
      } else {
        setFormAddrCidadeId('');
        setAddrBairrosList([]);
        setFormAddrBairroId('');
        return;
      }
      setFormAddrCidadeId(cidadeId);

      // 3. Fetch bairros for this cidade
      const bairrosRes = await fetch(`/api/user/apoio?table=apobairro&cidadeId=${cidadeId}`, { cache: 'no-store' });
      const bairrosData = await bairrosRes.json();
      let bairros: any[] = bairrosData.list || [];
      setAddrBairrosList(bairros);
      console.log('[CEP] bairros carregados:', bairros.length, '| buscando:', bairroNome.toUpperCase());

      let bairroId: string = '';
      if (bairroNome) {
        const bairroMatch = bairros.find(
          (b: any) => b.descricao?.toUpperCase() === bairroNome.toUpperCase()
        );

        if (bairroMatch) {
          console.log('[CEP] Bairro encontrado:', bairroMatch);
          bairroId = String(bairroMatch.id);
        } else {
          console.log('[CEP] Bairro não encontrado, criando:', bairroNome.toUpperCase());
          const createBairroRes = await fetch('/api/user/apoio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'apobairro',
              descricao: bairroNome.toUpperCase(),
              cidadeId: Number(cidadeId),
              estadoId: estadoMatch.id
            })
          });
          const createBairroData = await createBairroRes.json();
          console.log('[CEP] Criar bairro response:', createBairroRes.status, createBairroData);
          if (createBairroRes.ok && createBairroData.record) {
            const newBairro = createBairroData.record;
            bairroId = String(newBairro.id);
            // Deduplicate: remove any existing entry with same id before adding
            bairros = [...bairros.filter((b: any) => String(b.id) !== bairroId), { ...newBairro, descricao: bairroNome.toUpperCase() }];
            setAddrBairrosList(bairros);
          } else {
            console.error('[CEP] Falhou ao criar bairro:', createBairroData);
          }
        }
      }
      setFormAddrBairroId(bairroId);
      console.log('[CEP] IDs finais → estado:', estadoMatch.id, '| cidade:', cidadeId, '| bairro:', bairroId);
    } catch (err) {
      console.error('[CEP] Erro geral:', err);
    } finally {
      setLoadingCep(false);
    }
  };


  const formatBRL = (value: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
  };

  const formatPhoneProgressive = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const val = digits.slice(0, 11);
    if (val.length === 0) return '';
    if (val.length <= 2) return `(${val}`;
    if (val.length <= 6) return `(${val.slice(0, 2)}) ${val.slice(2)}`;
    if (val.length <= 10) return `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
    return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9)}`;
    }
    return cpf;
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12)}`;
    }
    return cnpj;
  };

  const formatCpfCnpjProgressive = (value: string, type: string) => {
    const digits = value.replace(/\D/g, '');
    if (type === '2') {
      // CPF: 000.000.000-00
      const val = digits.slice(0, 11);
      if (val.length <= 3) return val;
      if (val.length <= 6) return `${val.slice(0, 3)}.${val.slice(3)}`;
      if (val.length <= 9) return `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6)}`;
      return `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9)}`;
    } else {
      // CNPJ: 00.000.000/0000-00
      const val = digits.slice(0, 14);
      if (val.length <= 2) return val;
      if (val.length <= 5) return `${val.slice(0, 2)}.${val.slice(2)}`;
      if (val.length <= 8) return `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5)}`;
      if (val.length <= 12) return `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5, 8)}/${val.slice(8)}`;
      return `${val.slice(0, 2)}.${val.slice(2, 5)}.${val.slice(5, 8)}/${val.slice(8, 12)}-${val.slice(12)}`;
    }
  };

  const formatDateProgressive = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const val = digits.slice(0, 8);
    if (val.length <= 2) return val;
    if (val.length <= 4) return `${val.slice(0, 2)} / ${val.slice(2)}`;
    return `${val.slice(0, 2)} / ${val.slice(2, 4)} / ${val.slice(4)}`;
  };

  const parseDateToISO = (value: string) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const day = digits.substring(0, 2);
    const month = digits.substring(2, 4);
    const year = digits.substring(4, 8);
    return `${year}-${month}-${day}`;
  };

  const formatDoc = (doc: string) => {
    if (!doc) return '';
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) return formatCPF(cleaned);
    if (cleaned.length === 14) return formatCNPJ(cleaned);
    return doc;
  };

  const formatCEP = (cep: string) => {
    if (!cep) return '';
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
    }
    return cep;
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
            <Check size={14} /> Aceita
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
            <X size={14} /> Recusada
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
            <Loader2 size={12} className="animate-spin" /> Pendente
          </span>
        );
    }
  };

  const filteredSupportList = supportList.filter(item => {
    const term = supportSearch
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    
    const itemNome = (item.nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const itemCodAtiv = (item.codativ || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const itemSigla = (item.sigla || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const itemDescricao = (item.descricao || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (supportTable === 'ramosativ') {
      return itemNome.includes(term) || itemCodAtiv.includes(term);
    } else if (supportTable === 'apopais') {
      return itemNome.includes(term) || itemSigla.includes(term);
    } else if (supportTable === 'apoestado') {
      return itemNome.includes(term) || itemSigla.includes(term);
    } else {
      return itemDescricao.includes(term);
    }
  });

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', backgroundColor: '#f8fafc', paddingTop: '8px', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Header Panel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mobile-menu-toggle"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                color: '#475569',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginRight: '8px'
              }}
            >
              <Menu size={22} />
            </button>
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
              <Briefcase size={28} />
            </div>
            <div>
              <h1 className="negocios-title" style={{ fontSize: '2.25rem', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                Negócios
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Acompanhe e gerencie propostas, contatos e realize novos cadastros de leads.
              </p>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: '#7F34E6' }} />
              <p style={{ color: '#64748b', fontWeight: 500 }}>Carregando dados de negócios...</p>
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
                Você precisa estar conectado à sua conta para gerenciar e acompanhar seus negócios.
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
          ) : !isAdvertiser ? (
            /* Restricted Advertiser Role State */
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
              <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>📢</div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Perfil de Anunciante Necessário</h2>
              <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
                Esta área é exclusiva para proprietários e corretores gerenciarem contatos e propostas recebidos. 
                Complete seu cadastro e valide seu CPF/CRECI para começar a fazer negócios!
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                  href="/meu-perfil"
                  style={{ 
                    backgroundColor: '#7F34E6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '14px 24px', 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(127,52,230,0.3)'
                  }}
                >
                  Completar Perfil
                </Link>
                <Link 
                  href="/"
                  style={{ 
                    backgroundColor: 'white', 
                    color: '#64748b', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '14px 24px', 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Voltar ao Início
                </Link>
              </div>
            </div>
          ) : (
            /* Sidebar Layout wrapper */
            <div 
              className="negocios-container" 
              style={{
                display: 'grid',
                gridTemplateColumns: isSidebarCollapsed ? '80px 1fr' : '280px 1fr',
                gap: '32px',
                marginTop: '8px',
                transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Mobile Sidebar Overlay */}
              {isMobileMenuOpen && (
                <div 
                  className="mobile-menu-overlay"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}
              
              {/* Left Navigation Sidebar */}
              <aside 
                className={`negocios-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
                style={{
                  width: isSidebarCollapsed ? '80px' : '280px',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  padding: isSidebarCollapsed ? '24px 8px' : '24px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'padding 0.3s ease',
                  height: '100%',
                  boxSizing: 'border-box'
                }}>
                  {/* Top Sidebar Controls: Mobile Close (X) & Desktop Collapse/Expand */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: isSidebarCollapsed ? 'center' : 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '12px',
                    padding: '0 8px',
                    borderBottom: isSidebarCollapsed ? 'none' : '1px solid #f1f5f9',
                    paddingBottom: isSidebarCollapsed ? '0' : '12px'
                  }}>
                    {!isSidebarCollapsed && (
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Menu
                      </span>
                    )}
                    
                    {/* Desktop Toggle Button */}
                    <button 
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="desktop-sidebar-toggle"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#64748b', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '6px', 
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="mobile-sidebar-close"
                      style={{ 
                        display: 'none',
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: '#64748b', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '6px', 
                        borderRadius: '8px'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Category 1: Negociações & Site */}
                  {!isSidebarCollapsed && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', paddingLeft: '12px', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Negociações & Site
                    </span>
                  )}
                  
                  <button 
                    onClick={() => {
                      setActiveTab('propostas');
                      setIsMobileMenuOpen(false);
                      setIsSidebarCollapsed(true);
                    }}
                    title="Funil de Atendimento"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      gap: isSidebarCollapsed ? '0' : '12px',
                      border: 'none',
                      background: activeTab === 'propostas' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      color: activeTab === 'propostas' ? '#7F34E6' : '#475569',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                    className="sidebar-btn"
                  >
                    <Briefcase size={20} />
                    {!isSidebarCollapsed && <span>Funil de Atendimento</span>}
                    {!isSidebarCollapsed && (
                      <span style={{ 
                        marginLeft: 'auto', 
                        fontSize: '0.8rem', 
                        backgroundColor: activeTab === 'propostas' ? '#7F34E6' : '#f1f5f9', 
                        color: activeTab === 'propostas' ? 'white' : '#475569',
                        padding: '2px 8px', 
                        borderRadius: '999px',
                        fontWeight: 700 
                      }}>
                        {proposals.length}
                      </span>
                    )}
                  </button>

                  {/* Category 2: Leads Manuais */}
                  {!isSidebarCollapsed && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', paddingLeft: '12px', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Leads Manuais
                    </span>
                  )}

                  <button 
                    onClick={() => {
                      setActiveTab('cadastro');
                      setIsMobileMenuOpen(false);
                      setIsSidebarCollapsed(true);
                    }}
                    title="Capturar Lead"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      gap: isSidebarCollapsed ? '0' : '12px',
                      border: 'none',
                      background: activeTab === 'cadastro' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      color: activeTab === 'cadastro' ? '#7F34E6' : '#475569',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                    className="sidebar-btn"
                  >
                    <UserPlus size={20} />
                    {!isSidebarCollapsed && <span>Capturar Lead</span>}
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: isSidebarCollapsed ? '8px 4px' : '8px 12px' }}></div>

                  {/* Category 3: Clientes */}
                  {!isSidebarCollapsed && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', paddingLeft: '12px', marginBottom: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Clientes (Contratos)
                    </span>
                  )}

                  <button 
                    onClick={() => {
                      setActiveTab('clientes');
                      setClientesView('list');
                      setIsMobileMenuOpen(false);
                      setIsSidebarCollapsed(true);
                    }}
                    title="Cliente"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      gap: isSidebarCollapsed ? '0' : '12px',
                      border: 'none',
                      background: activeTab === 'clientes' ? 'rgba(16, 185, 129, 0.08)' : 'none',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: activeTab === 'clientes' ? '#10b981' : '#475569',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                    className="sidebar-btn-cad"
                  >
                    <Briefcase size={20} />
                    {!isSidebarCollapsed && <span>Cliente</span>}
                    {!isSidebarCollapsed && (
                      <span style={{ 
                        marginLeft: 'auto', 
                        fontSize: '0.8rem', 
                        backgroundColor: activeTab === 'clientes' ? '#10b981' : '#f1f5f9', 
                        color: activeTab === 'clientes' ? 'white' : '#475569',
                        padding: '2px 8px', 
                        borderRadius: '999px',
                        fontWeight: 700 
                      }}>
                        {customers.length}
                      </span>
                    )}
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: isSidebarCollapsed ? '8px 4px' : '8px 12px' }}></div>

                  {/* Category 4: Apoio (Collapsible or stacked icons) */}
                  {isSidebarCollapsed ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', alignItems: 'center' }}>
                      <button 
                        onClick={() => { setActiveTab('apoio'); setSupportTable('ramosativ'); setIsMobileMenuOpen(false); }} 
                        title="Atividade / Profissão" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: activeTab === 'apoio' && supportTable === 'ramosativ' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          color: activeTab === 'apoio' && supportTable === 'ramosativ' ? '#7F34E6' : '#64748b',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        className="sidebar-btn"
                      >
                        💼
                      </button>
                      <button 
                        onClick={() => { setActiveTab('apoio'); setSupportTable('apopais'); setIsMobileMenuOpen(false); }} 
                        title="País" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: activeTab === 'apoio' && supportTable === 'apopais' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          color: activeTab === 'apoio' && supportTable === 'apopais' ? '#7F34E6' : '#64748b',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        className="sidebar-btn"
                      >
                        🌍
                      </button>
                      <button 
                        onClick={() => { setActiveTab('apoio'); setSupportTable('apoestado'); setIsMobileMenuOpen(false); }} 
                        title="Estado" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: activeTab === 'apoio' && supportTable === 'apoestado' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          color: activeTab === 'apoio' && supportTable === 'apoestado' ? '#7F34E6' : '#64748b',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        className="sidebar-btn"
                      >
                        🏛️
                      </button>
                      <button 
                        onClick={() => { setActiveTab('apoio'); setSupportTable('apocidade'); setIsMobileMenuOpen(false); }} 
                        title="Cidade" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: activeTab === 'apoio' && supportTable === 'apocidade' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          color: activeTab === 'apoio' && supportTable === 'apocidade' ? '#7F34E6' : '#64748b',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        className="sidebar-btn"
                      >
                        🏙️
                      </button>
                      <button 
                        onClick={() => { setActiveTab('apoio'); setSupportTable('apobairro'); setIsMobileMenuOpen(false); }} 
                        title="Bairro" 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: activeTab === 'apoio' && supportTable === 'apobairro' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          color: activeTab === 'apoio' && supportTable === 'apobairro' ? '#7F34E6' : '#64748b',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        className="sidebar-btn"
                      >
                        🏘️
                      </button>
                    </div>
                  ) : (
                    <>
                      <div 
                        onClick={() => setIsSupportMenuExpanded(!isSupportMenuExpanded)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          paddingLeft: '12px', 
                          paddingRight: '12px',
                          marginBottom: '8px',
                          userSelect: 'none',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.75'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Menu de Apoio
                        </span>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: '#94a3b8', 
                          transform: isSupportMenuExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                          transition: 'transform 0.2s ease',
                          display: 'inline-block'
                        }}>
                          ▼
                        </span>
                      </div>

                      {isSupportMenuExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <button 
                            onClick={() => {
                              setActiveTab('apoio');
                              setSupportTable('ramosativ');
                              setIsMobileMenuOpen(false);
                              setIsSidebarCollapsed(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: activeTab === 'apoio' && supportTable === 'ramosativ' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                              padding: '6px 16px 6px 24px',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: activeTab === 'apoio' && supportTable === 'ramosativ' ? '#7F34E6' : '#64748b',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            className="sidebar-btn"
                          >
                            <span>💼 Atividade / Profissão</span>
                          </button>

                          <button 
                            onClick={() => {
                              setActiveTab('apoio');
                              setSupportTable('apopais');
                              setIsMobileMenuOpen(false);
                              setIsSidebarCollapsed(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: activeTab === 'apoio' && supportTable === 'apopais' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                              padding: '6px 16px 6px 24px',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: activeTab === 'apoio' && supportTable === 'apopais' ? '#7F34E6' : '#64748b',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            className="sidebar-btn"
                          >
                            <span>🌍 País</span>
                          </button>

                          <button 
                            onClick={() => {
                              setActiveTab('apoio');
                              setSupportTable('apoestado');
                              setIsMobileMenuOpen(false);
                              setIsSidebarCollapsed(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: activeTab === 'apoio' && supportTable === 'apoestado' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                              padding: '6px 16px 6px 24px',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: activeTab === 'apoio' && supportTable === 'apoestado' ? '#7F34E6' : '#64748b',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            className="sidebar-btn"
                          >
                            <span>🏛️ Estado</span>
                          </button>

                          <button 
                            onClick={() => {
                              setActiveTab('apoio');
                              setSupportTable('apocidade');
                              setIsMobileMenuOpen(false);
                              setIsSidebarCollapsed(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: activeTab === 'apoio' && supportTable === 'apocidade' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                              padding: '6px 16px 6px 24px',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: activeTab === 'apoio' && supportTable === 'apocidade' ? '#7F34E6' : '#64748b',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            className="sidebar-btn"
                          >
                            <span>🏙️ Cidade</span>
                          </button>

                          <button 
                            onClick={() => {
                              setActiveTab('apoio');
                              setSupportTable('apobairro');
                              setIsMobileMenuOpen(false);
                              setIsSidebarCollapsed(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              border: 'none',
                              background: activeTab === 'apoio' && supportTable === 'apobairro' ? 'rgba(127, 52, 230, 0.08)' : 'none',
                              padding: '6px 16px 6px 24px',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: activeTab === 'apoio' && supportTable === 'apobairro' ? '#7F34E6' : '#64748b',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            className="sidebar-btn"
                          >
                            <span>🏘️ Bairro</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </aside>

              {/* Right Content Area */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* TAB: RECEIVED PROPOSALS (KANBAN BOARD) */}
                {activeTab === 'propostas' && (
                  proposals.length === 0 ? (
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '24px', 
                      padding: '80px 40px', 
                      textAlign: 'center', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>📝</div>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Nenhum lead ou negócio no funil</h2>
                      <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
                        Você ainda não possui atendimentos ou propostas em andamento. Divulgue mais seus anúncios para atrair novos contatos!
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '600px', alignItems: 'flex-start' }} className="kanban-board">
                      {etapas.map((stageObj) => {
                        const stage = stageObj.sigla;
                        const stagesConfig: any = {
                          novo: { icon: '✨', bg: '#eff6ff' },
                          contato: { icon: '💬', bg: '#fef3c7' },
                          agendamento: { icon: '📅', bg: '#d1fae5' },
                          proposta: { icon: '📝', bg: '#f3e8ff' },
                          fechamento: { icon: '🤝', bg: '#fce7f3' }
                        };
                        const stageInfo = {
                          label: stageObj.nome,
                          icon: stagesConfig[stage]?.icon || '✨',
                          bg: stagesConfig[stage]?.bg || '#f1f5f9'
                        };
                        let stageCards = proposals.filter((p) => (p.etapa || 'novo') === stage);
                        if (stage === 'agendamento') {
                          stageCards.sort((a, b) => {
                            if (!a.data_visita) return 1;
                            if (!b.data_visita) return -1;
                            return new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime();
                          });
                        }
                        const listStages = etapas.map(e => e.sigla);

                        return (
                          <div 
                            key={stage} 
                            style={{
                              flex: '1',
                              minWidth: '280px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '20px',
                              padding: '18px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                              border: '1px solid #e2e8f0',
                              maxHeight: '75vh',
                              overflowY: 'auto'
                            }}
                            className="kanban-column"
                          >
                            {/* Column Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '1rem',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: stageInfo.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>{stageInfo.icon}</span>
                                <span style={{ fontWeight: 800, color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {stageInfo.label}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                  backgroundColor: '#e2e8f0',
                                  color: '#475569',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontWeight: 700
                                }}>
                                  {stageCards.length}
                                </span>
                              </div>
                            </div>

                            {/* Column Cards list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {stageCards.length === 0 ? (
                                <div style={{
                                  textAlign: 'center',
                                  padding: '30px 10px',
                                  border: '2px dashed #e2e8f0',
                                  borderRadius: '16px',
                                  color: '#94a3b8',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  backgroundColor: 'white'
                                }}>
                                  Nenhum card aqui
                                </div>
                              ) : (
                                stageCards.map((p) => {
                                  const isProposal = p.tipo === 'proposta' || Number(p.valor) > 0;
                                  return (
                                    <div 
                                      key={p.proposal_id}
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
                                          marginTop: '2px',
                                          width: '100%',
                                          boxSizing: 'border-box'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={12} style={{ color: '#d97706' }} />
                                            <span>Visita: {new Date(p.data_visita).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                          </div>
                                          <span>{new Date(p.data_visita).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      )}
                                      </div>

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

                                          {p.client_user_id != null && p.client_user_id > 0 && (
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
                                          )}

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

                                        {/* Move columns quickly */}
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                                          <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                              disabled={stage === 'novo'}
                                              onClick={() => {
                                                const prevIndex = listStages.indexOf(stage) - 1;
                                                handleUpdateEtapa(p.proposal_id, listStages[prevIndex]);
                                              }}
                                              style={{
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                padding: '2px 6px',
                                                cursor: 'pointer',
                                                color: '#64748b',
                                                opacity: stage === 'novo' ? 0.3 : 1
                                              }}
                                            >
                                              <ArrowLeft size={10} />
                                            </button>
                                            <button
                                              disabled={stage === 'fechamento'}
                                              onClick={() => {
                                                const nextIndex = listStages.indexOf(stage) + 1;
                                                handleUpdateEtapa(p.proposal_id, listStages[nextIndex]);
                                              }}
                                              style={{
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                padding: '2px 6px',
                                                cursor: 'pointer',
                                                color: '#64748b',
                                                opacity: stage === 'fechamento' ? 0.3 : 1
                                              }}
                                            >
                                              <ArrowRight size={10} />
                                            </button>
                                          </div>
                                        </div>
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
                  )
                )}

                {/* TAB: LEAD REGISTRATION FORM */}
                {activeTab === 'cadastro' && (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }} className="cadastro-tab-wrapper">
                    
                    {/* Premium Header Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(127, 52, 230, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)',
                      border: '1px solid rgba(127, 52, 230, 0.1)',
                      borderRadius: '24px',
                      padding: '24px 32px',
                      marginBottom: '28px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: '0 4px 20px -2px rgba(127, 52, 230, 0.02)'
                    }}>
                      <div>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          color: '#7F34E6',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          backgroundColor: 'rgba(127, 52, 230, 0.08)',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '8px'
                        }}>
                          <Sparkles size={12} /> Console de Registro
                        </span>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                          Cadastrar Lead & Proposta
                        </h2>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0 0' }}>
                          Gere leads manuais vinculados aos seus imóveis e centralize suas propostas comerciais.
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'white',
                        padding: '10px 16px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                        color: '#475569',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                        Pronto para cadastro
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.25fr 0.9fr',
                      gap: '32px',
                      alignItems: 'start'
                    }} className="cadastro-grid">
                      
                      {/* Left: Premium Form Card */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        padding: '36px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)'
                      }}>
                        
                        {myProperties.length === 0 ? (
                          <div style={{ 
                            backgroundColor: '#fffbeb', 
                            border: '1px solid #fef3c7', 
                            color: '#b45309', 
                            padding: '24px', 
                            borderRadius: '20px', 
                            display: 'flex', 
                            alignItems: 'start', 
                            gap: '14px',
                            lineHeight: 1.6,
                            fontSize: '0.925rem'
                          }}>
                            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                            <div>
                              <strong style={{ fontSize: '1rem', color: '#92400e' }}>Nenhum imóvel ativo encontrado!</strong><br />
                              Você precisa ter pelo menos um imóvel ativo cadastrado para associar este lead. 
                              Cadastre um imóvel na aba <Link href="/meus-imoveis/incluir" style={{ color: '#b45309', fontWeight: 800, textDecoration: 'underline' }}>Anunciar</Link> primeiro.
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            
                            {/* Section 1: Client Info */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(127, 52, 230, 0.08)', color: '#7F34E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <UserCircle2 size={18} />
                                </span>
                                <span style={{ fontWeight: 850, fontSize: '1rem', color: '#1e293b', letterSpacing: '-0.01em' }}>
                                  Dados do Proponente / Lead
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Name Input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Nome Completo *
                                  </label>
                                  <div style={{ position: 'relative' }}>
                                    <span style={{
                                      position: 'absolute',
                                      left: '16px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      color: focusedField === 'name' ? '#7F34E6' : '#94a3b8',
                                      display: 'flex',
                                      alignItems: 'center',
                                      transition: 'all 0.2s ease'
                                    }}>
                                      <UserCircle2 size={18} />
                                    </span>
                                    <input 
                                      type="text" 
                                      required
                                      value={formName}
                                      onChange={(e) => setFormName(e.target.value)}
                                      placeholder="Digite o nome completo do interessado..."
                                      style={{
                                        padding: '14px 16px 14px 46px',
                                        borderRadius: '12px',
                                        borderStyle: 'solid',
                                        borderWidth: '1px 1px 1px 3px',
                                        borderColor: focusedField === 'name' ? '#7F34E6' : '#e2e8f0 #e2e8f0 #e2e8f0 #cbd5e1',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        backgroundColor: '#f8fafc',
                                        boxShadow: focusedField === 'name' ? '0 0 0 4px rgba(127, 52, 230, 0.08), 0 4px 12px rgba(0,0,0,0.01)' : 'none'
                                      }}
                                      onFocus={() => setFocusedField('name')}
                                      onBlur={() => setFocusedField(null)}
                                    />
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="mobile-one-col">
                                  {/* Phone Input */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      WhatsApp / Telefone
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <span style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: focusedField === 'phone' ? '#7F34E6' : '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease'
                                      }}>
                                        <Phone size={18} />
                                      </span>
                                      <input 
                                        type="text" 
                                        value={formPhone}
                                        onChange={(e) => setFormPhone(formatPhoneProgressive(e.target.value))}
                                        placeholder="Ex: (81) 99999-9999"
                                        style={{
                                          padding: '14px 16px 14px 46px',
                                          borderRadius: '12px',
                                          borderStyle: 'solid',
                                          borderWidth: '1px 1px 1px 3px',
                                          borderColor: focusedField === 'phone' ? '#7F34E6' : '#e2e8f0 #e2e8f0 #e2e8f0 #cbd5e1',
                                          fontSize: '0.95rem',
                                          outline: 'none',
                                          width: '100%',
                                          boxSizing: 'border-box',
                                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                          backgroundColor: '#f8fafc',
                                          boxShadow: focusedField === 'phone' ? '0 0 0 4px rgba(127, 52, 230, 0.08), 0 4px 12px rgba(0,0,0,0.01)' : 'none'
                                        }}
                                        onFocus={() => setFocusedField('phone')}
                                        onBlur={() => setFocusedField(null)}
                                      />
                                    </div>
                                  </div>

                                  {/* Email Input */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      E-mail
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                      <span style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: focusedField === 'email' ? '#7F34E6' : '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease'
                                      }}>
                                        <Mail size={18} />
                                      </span>
                                      <input 
                                        type="email" 
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="Ex: cliente@email.com"
                                        style={{
                                          padding: '14px 16px 14px 46px',
                                          borderRadius: '12px',
                                          borderStyle: 'solid',
                                          borderWidth: '1px 1px 1px 3px',
                                          borderColor: focusedField === 'email' ? '#7F34E6' : '#e2e8f0 #e2e8f0 #e2e8f0 #cbd5e1',
                                          fontSize: '0.95rem',
                                          outline: 'none',
                                          width: '100%',
                                          boxSizing: 'border-box',
                                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                          backgroundColor: '#f8fafc',
                                          boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(127, 52, 230, 0.08), 0 4px 12px rgba(0,0,0,0.01)' : 'none'
                                        }}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Proposal Info */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Home size={18} />
                                </span>
                                <span style={{ fontWeight: 850, fontSize: '1rem', color: '#1e293b', letterSpacing: '-0.01em' }}>
                                  Detalhes da Proposta & Imóvel
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Property Select Dropdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Imóvel de Interesse *
                                  </label>
                                  <div style={{ position: 'relative' }}>
                                    <span style={{
                                      position: 'absolute',
                                      left: '16px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      color: focusedField === 'property' ? '#7F34E6' : '#94a3b8',
                                      display: 'flex',
                                      alignItems: 'center',
                                      pointerEvents: 'none',
                                      transition: 'all 0.2s ease'
                                    }}>
                                      <Home size={18} />
                                    </span>
                                    <select
                                      required
                                      value={formPropertyId}
                                      onChange={(e) => setFormPropertyId(e.target.value)}
                                      style={{
                                        padding: '14px 16px 14px 46px',
                                        borderRadius: '12px',
                                        borderStyle: 'solid',
                                        borderWidth: '1px 1px 1px 3px',
                                        borderColor: focusedField === 'property' ? '#7F34E6' : '#e2e8f0 #e2e8f0 #e2e8f0 #cbd5e1',
                                        fontSize: '0.95rem',
                                        backgroundColor: 'white',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: focusedField === 'property' ? '0 0 0 4px rgba(127, 52, 230, 0.08), 0 4px 12px rgba(0,0,0,0.01)' : 'none',
                                        appearance: 'none'
                                      }}
                                      onFocus={() => setFocusedField('property')}
                                      onBlur={() => setFocusedField(null)}
                                    >
                                      <option value="">Selecione o imóvel de destino...</option>
                                      {myProperties.map(prop => (
                                        <option key={prop.id} value={prop.id}>
                                          ID: #{prop.id} - {prop.nome} ({prop.operacao_nome})
                                        </option>
                                      ))}
                                    </select>
                                    <span style={{
                                      position: 'absolute',
                                      right: '16px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      color: '#94a3b8',
                                      pointerEvents: 'none',
                                      fontSize: '0.8rem'
                                    }}>
                                      ▼
                                    </span>
                                  </div>
                                </div>

                                {/* Operation Type Toggle Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Tipo de Transação
                                  </label>
                                  <div style={{ display: 'flex', gap: '16px' }} className="mobile-one-col">
                                    <button
                                      type="button"
                                      onClick={() => setFormOperationType('locacao')}
                                      style={{
                                        flex: 1,
                                        padding: '20px',
                                        borderRadius: '16px',
                                        borderStyle: 'solid',
                                        borderWidth: formOperationType === 'locacao' ? '2px' : '1px',
                                        borderColor: formOperationType === 'locacao' ? '#7F34E6' : '#e2e8f0',
                                        background: formOperationType === 'locacao' 
                                          ? 'linear-gradient(135deg, rgba(127, 52, 230, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%)' 
                                          : 'white',
                                        color: formOperationType === 'locacao' ? '#7F34E6' : '#475569',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        boxShadow: formOperationType === 'locacao' ? '0 8px 20px -8px rgba(127, 52, 230, 0.15)' : 'none',
                                        transform: formOperationType === 'locacao' ? 'translateY(-2px)' : 'none'
                                      }}
                                    >
                                      <span style={{ fontWeight: 900, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        🔑 Locação
                                        {formOperationType === 'locacao' && <span style={{ marginLeft: 'auto', backgroundColor: '#7F34E6', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✓</span>}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                        Registrar interesse para aluguel mensal
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setFormOperationType('venda')}
                                      style={{
                                        flex: 1,
                                        padding: '20px',
                                        borderRadius: '16px',
                                        borderStyle: 'solid',
                                        borderWidth: formOperationType === 'venda' ? '2px' : '1px',
                                        borderColor: formOperationType === 'venda' ? '#10b981' : '#e2e8f0',
                                        background: formOperationType === 'venda' 
                                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)' 
                                          : 'white',
                                        color: formOperationType === 'venda' ? '#10b981' : '#475569',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        boxShadow: formOperationType === 'venda' ? '0 8px 20px -8px rgba(16, 185, 129, 0.15)' : 'none',
                                        transform: formOperationType === 'venda' ? 'translateY(-2px)' : 'none'
                                      }}
                                    >
                                      <span style={{ fontWeight: 900, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        🤝 Venda
                                        {formOperationType === 'venda' && <span style={{ marginLeft: 'auto', backgroundColor: '#10b981', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✓</span>}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                        Registrar proposta de compra do imóvel
                                      </span>
                                    </button>
                                  </div>
                                </div>

                                {/* Value Input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Valor Proposto (Opcional)
                                  </label>
                                  <div style={{ position: 'relative' }}>
                                    <span style={{
                                      position: 'absolute',
                                      left: '16px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      color: focusedField === 'value' ? (formOperationType === 'locacao' ? '#7F34E6' : '#10b981') : '#94a3b8',
                                      fontWeight: 800,
                                      fontSize: '1rem',
                                      transition: 'all 0.2s ease'
                                    }}>
                                      R$
                                    </span>
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      value={formValue}
                                      onChange={(e) => setFormValue(e.target.value)}
                                      placeholder="0,00"
                                      style={{
                                        padding: '14px 16px 14px 46px',
                                        borderRadius: '12px',
                                        borderStyle: 'solid',
                                        borderWidth: '1px 1px 1px 3px',
                                        borderColor: focusedField === 'value' 
                                          ? (formOperationType === 'locacao' ? '#7F34E6' : '#10b981') 
                                          : '#e2e8f0 #e2e8f0 #e2e8f0 #cbd5e1',
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        backgroundColor: '#f8fafc',
                                        boxShadow: focusedField === 'value' 
                                          ? `0 0 0 4px ${formOperationType === 'locacao' ? 'rgba(127, 52, 230, 0.08)' : 'rgba(16, 185, 129, 0.08)'}, 0 4px 12px rgba(0,0,0,0.01)` 
                                          : 'none'
                                      }}
                                      onFocus={() => setFocusedField('value')}
                                      onBlur={() => setFocusedField(null)}
                                    />
                                  </div>
                                </div>

                                {/* Stage/Etapa Selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Etapa Inicial do Fluxo
                                  </label>
                                  <div style={{ position: 'relative' }}>
                                    <select
                                      value={formEtapa}
                                      onChange={(e) => setFormEtapa(e.target.value)}
                                      style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        fontWeight: 650,
                                        color: '#334155',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        backgroundColor: '#f8fafc',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                                      }}
                                    >
                                      <option value="novo">Novo</option>
                                      <option value="contato">Contato</option>
                                      <option value="agendamento">Agendamento</option>
                                      <option value="proposta">Proposta</option>
                                      <option value="fechamento">Fechamento</option>
                                    </select>
                                    <span style={{
                                      position: 'absolute',
                                      right: '16px',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      color: '#94a3b8',
                                      pointerEvents: 'none',
                                      fontSize: '0.8rem'
                                    }}>
                                      ▼
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Conditions / Message */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Condições Adicionais / Observações (Opcional)
                              </label>
                              <div style={{ position: 'relative' }}>
                                <span style={{
                                  position: 'absolute',
                                  left: '16px',
                                  top: '18px',
                                  color: focusedField === 'conditions' ? '#7F34E6' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <Info size={18} />
                                </span>
                                <textarea
                                  value={formConditions}
                                  onChange={(e) => setFormConditions(e.target.value)}
                                  placeholder="Ex: Pagamento à vista, financiamento bancário, caução de 3 meses, etc..."
                                  rows={4}
                                  style={{
                                    padding: '14px 16px 14px 46px',
                                    borderRadius: '12px',
                                    borderStyle: 'solid',
                                    borderWidth: '1px 1px 1px 3px',
                                    borderColor: focusedField === 'conditions' ? '#7F34E6' : '#e2e8f0 #e2e8f0 #e2e8f0 #cbd5e1',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backgroundColor: '#f8fafc',
                                    boxShadow: focusedField === 'conditions' ? '0 0 0 4px rgba(127, 52, 230, 0.08), 0 4px 12px rgba(0,0,0,0.01)' : 'none'
                                  }}
                                  onFocus={() => setFocusedField('conditions')}
                                  onBlur={() => setFocusedField(null)}
                                />
                              </div>
                            </div>

                            {/* Submit button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                              <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '14px',
                                  padding: '16px 36px',
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: '0 6px 16px rgba(16,185,129,0.25)'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#059669';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '#10b981';
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="animate-spin" size={18} /> Cadastrando...
                                  </>
                                ) : (
                                  <>
                                    <Check size={18} /> Salvar Lead & Proposta
                                  </>
                                )}
                              </button>
                            </div>

                          </form>
                        )}
                      </div>

                      {/* Right: Premium Live Preview Sticky Card */}
                      <div className="cadastro-preview-sidebar">
                        <div style={{
                          position: 'sticky',
                          top: '100px',
                          backgroundColor: 'white',
                          borderRadius: '24px',
                          padding: '28px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              Previsualização Oficial
                            </span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontWeight: 700
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                              Live
                            </span>
                          </div>

                          {/* Certified Voucher container */}
                          <div style={{ 
                            borderRadius: '20px', 
                            overflow: 'hidden', 
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                          }}>
                            {/* Property Media Header with color gradient matching state */}
                            <div style={{ 
                              height: '150px', 
                              position: 'relative', 
                              overflow: 'hidden',
                              background: formOperationType === 'locacao' 
                                ? 'linear-gradient(135deg, #7F34E6 0%, #6366f1 100%)' 
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            }}>
                              {myProperties.find(p => String(p.id) === String(formPropertyId))?.foto_capa ? (
                                <>
                                  <img 
                                    src={myProperties.find(p => String(p.id) === String(formPropertyId))?.foto_capa} 
                                    alt="Property preview" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                                  />
                                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)' }}></div>
                                </>
                              ) : (
                                <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '3.5rem' }}>
                                  🏠
                                </div>
                              )}
                              
                              <span style={{
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                backgroundColor: 'white',
                                color: formOperationType === 'locacao' ? '#7F34E6' : '#10b981',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.725rem',
                                fontWeight: 850,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                              }}>
                                {formOperationType === 'locacao' ? '🔑 Locação' : '🤝 Venda'}
                              </span>
                              
                              <span style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.725rem',
                                fontWeight: 700
                              }}>
                                Novo Lead
                              </span>

                              <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {myProperties.find(p => String(p.id) === String(formPropertyId))?.nome || 'Título do Imóvel'}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                  {formPropertyId ? `ID do Imóvel: #${formPropertyId}` : 'Aguardando seleção de imóvel'}
                                </span>
                              </div>
                            </div>

                            {/* Details Body */}
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              
                              {/* Cliente / Lead info */}
                              <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                  Proponente
                                </span>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', wordBreak: 'break-word', display: 'block' }}>
                                  {formName || 'Nome do Interessado'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                  {formPhone && (
                                    <span style={{ fontSize: '0.725rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Phone size={10} /> WhatsApp
                                    </span>
                                  )}
                                  {formEmail && (
                                    <span style={{ fontSize: '0.725rem', color: '#7F34E6', backgroundColor: 'rgba(127, 52, 230, 0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Mail size={10} /> E-mail
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>

                              {/* Value Display */}
                              <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                  Valor Proposto BRL
                                </span>
                                <span style={{ 
                                  fontSize: '1.6rem', 
                                  fontWeight: 900, 
                                  color: formOperationType === 'locacao' ? '#7F34E6' : '#10b981',
                                  letterSpacing: '-0.02em',
                                  display: 'block'
                                }}>
                                  {formValue ? formatBRL(formValue) : 'R$ 0,00'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px', display: 'block' }}>
                                  {formOperationType === 'locacao' ? 'Valor líquido mensal estimado' : 'Valor de oferta para aquisição'}
                                </span>
                              </div>

                              {formConditions && (
                                <>
                                  <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>
                                  <div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                      Observações & Condições
                                    </span>
                                    <p style={{ 
                                      fontSize: '0.825rem', 
                                      color: '#475569', 
                                      margin: 0, 
                                      lineHeight: 1.5, 
                                      maxHeight: '72px', 
                                      overflowY: 'auto',
                                      backgroundColor: 'white',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      border: '1px solid #f1f5f9',
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {formConditions}
                                    </p>
                                  </div>
                                </>
                              )}

                              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>

                              {/* Stepper progress indicator */}
                              <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.05em' }}>
                                  Status do Trâmite
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: '#10b981', fontWeight: 700 }}>
                                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>✓</span>
                                    Lead Criado Manualmente
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: '#7F34E6', fontWeight: 700 }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#7F34E6', display: 'inline-block', animation: 'pulse 1s infinite', margin: '0 5px' }}></span>
                                    Registrando Proposta
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', color: '#94a3b8', fontWeight: 500 }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'inline-block', margin: '0 5px' }}></span>
                                    Aguardando Fechamento
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {activeTab === 'clientes' && (
                  <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    {clientesView === 'list' && (
                      /* LIST VIEW */
                      <div>
                        {/* Clientes Header Row */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '16px',
                          marginBottom: '24px'
                        }}>
                          <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                              Cliente
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0 0' }}>
                              Consulte e qualifique clientes com dados completos para geração de contratos.
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setClientesView('cadastro');
                              setWizardStep(1);
                              setEditingCustomerId(null);
                              // Reset customer form states
                              setFormCustName('');
                              setFormCnpjCpf('');
                              setFormCustEmail('');
                              setFormCustPhone('');
                              setFormNascimento('');
                              setFormNacionalidade('');
                              setFormNaturalidade('');
                              setFormNatEstadoId('');
                              setFormNatCidadeId('');
                              setCitySearchQuery('');
                              setFormEstadoCivilId('');
                              setFormRegimeBens('');
                              setFormProfissao('');
                              setProfessionSearchQuery('');
                              setFormIdentidade('');
                              setFormEmissor('');
                              setFormEmissorUf('');
                              setFormDtEmissaoRg('');
                              setFormConjugeNome('');
                              setFormConjugeCpf('');
                              setFormConjugeNascimento('');
                              setFormConjugeProfissao('');
        setConjugeProfessionSearchQuery('');
                              setFormConjugeIdentidade('');
                              setFormConjugeEmissor('');
                              setFormConjugeEmissorUf('');
                              setFormCep('');
                              setFormLogradouro('');
                              setFormNumero('');
                              setFormComplemento('');
                              setFormBairro('');
                              setFormCidade('');
                              setFormEstado('');
                              setFormAddrEstadoId('');
                              setFormAddrCidadeId('');
                              setFormAddrBairroId('');
                              setAddrCidadesList([]);
                              setAddrBairrosList([]);
                            }}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '12px 24px',
                              fontWeight: 700,
                              fontSize: '0.925rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#10b981';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <UserPlus size={16} /> Novo Cliente
                          </button>
                        </div>

                        {/* Search and Filters */}
                        <div style={{
                          backgroundColor: 'white',
                          borderRadius: '16px',
                          padding: '16px 20px',
                          border: '1px solid #e2e8f0',
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }}>
                          <span style={{ color: '#94a3b8' }}>🔍</span>
                          <input
                            type="text"
                            placeholder="Buscar clientes por nome, CPF/CNPJ, e-mail..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            style={{
                              border: 'none',
                              outline: 'none',
                              fontSize: '0.95rem',
                              width: '100%',
                              color: '#334155'
                            }}
                          />
                          {customerSearch && (
                            <button
                              onClick={() => setCustomerSearch('')}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Customer Cards Grid (Full-width responsive grid layout) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                          gap: '20px',
                          alignItems: 'start'
                        }}>
                          {customers.filter(c => {
                            const searchLower = customerSearch.toLowerCase();
                            return (
                              c.nome?.toLowerCase().includes(searchLower) ||
                              c.cnpjcpf?.toLowerCase().includes(searchLower) ||
                              c.email?.toLowerCase().includes(searchLower)
                            );
                          }).length === 0 ? (
                            <div style={{
                              gridColumn: '1 / -1',
                              backgroundColor: 'white',
                              borderRadius: '20px',
                              padding: '48px 24px',
                              textAlign: 'center',
                              border: '1px solid #e2e8f0',
                              color: '#64748b'
                            }}>
                              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 8px 0' }}>Nenhum cliente cadastrado</p>
                              <p style={{ fontSize: '0.85rem', margin: 0 }}>Preencha os dados de qualificação para começar.</p>
                            </div>
                          ) : (
                            customers.filter(c => {
                              const searchLower = customerSearch.toLowerCase();
                              return (
                                c.nome?.toLowerCase().includes(searchLower) ||
                                c.cnpjcpf?.toLowerCase().includes(searchLower) ||
                                c.email?.toLowerCase().includes(searchLower)
                              );
                            }).map(c => {
                              return (
                                <div
                                  key={c.idcustomer}
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setClientesView('detail');
                                  }}
                                  style={{
                                    backgroundColor: 'white',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    border: '1px solid #e2e8f0',
                                    borderLeft: '4px solid #cbd5e1',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                                    e.currentTarget.style.borderColor = '#10b981';
                                    e.currentTarget.style.borderLeftColor = '#10b981';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.01)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.borderLeftColor = '#cbd5e1';
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                      {c.nome}
                                    </h4>
                                    <span style={{
                                      fontSize: '0.675rem',
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: c.id_tppessoa === 1 ? '#eff6ff' : '#ecfdf5',
                                      color: c.id_tppessoa === 1 ? '#2563eb' : '#059669'
                                    }}>
                                      {c.id_tppessoa === 1 ? 'PJ' : 'PF'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      💳 {formatDoc(c.cnpjcpf)}
                                    </span>
                                    {c.cel && (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📞 {formatPhone(c.cel)}
                                      </span>
                                    )}
                                    {c.email && (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        ✉️ {c.email}
                                      </span>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginTop: '8px',
                                    borderTop: '1px solid #f1f5f9',
                                    paddingTop: '12px'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCustomer(c);
                                        setClientesView('detail');
                                      }}
                                      style={{
                                        flex: 1,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        backgroundColor: '#f8fafc',
                                        color: '#475569',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(ev) => {
                                        ev.currentTarget.style.backgroundColor = '#7F34E6';
                                        ev.currentTarget.style.color = 'white';
                                        ev.currentTarget.style.borderColor = '#7F34E6';
                                      }}
                                      onMouseOut={(ev) => {
                                        ev.currentTarget.style.backgroundColor = '#f8fafc';
                                        ev.currentTarget.style.color = '#475569';
                                        ev.currentTarget.style.borderColor = '#e2e8f0';
                                      }}
                                    >
                                      <Eye size={12} /> Visualizar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(c);
                                      }}
                                      style={{
                                        flex: 1,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        backgroundColor: '#f8fafc',
                                        color: '#475569',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(ev) => {
                                        ev.currentTarget.style.backgroundColor = '#10b981';
                                        ev.currentTarget.style.color = 'white';
                                        ev.currentTarget.style.borderColor = '#10b981';
                                      }}
                                      onMouseOut={(ev) => {
                                        ev.currentTarget.style.backgroundColor = '#f8fafc';
                                        ev.currentTarget.style.color = '#475569';
                                        ev.currentTarget.style.borderColor = '#e2e8f0';
                                      }}
                                    >
                                      <Pencil size={12} /> Editar
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {clientesView === 'detail' && (() => {
                      const cardStyle: React.CSSProperties = {
                        backgroundColor: '#f8fafc',
                        padding: '14px 18px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                      };

                      const labelStyle: React.CSSProperties = {
                        fontSize: '0.725rem',
                        color: '#64748b',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      };

                      const valStyle: React.CSSProperties = {
                        fontSize: '0.95rem',
                        color: '#0f172a',
                        fontWeight: 800,
                        wordBreak: 'break-word'
                      };

                      const sectionTitleStyle: React.CSSProperties = {
                        fontSize: '0.85rem',
                        fontWeight: 900,
                        color: '#1e293b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderLeft: '4px solid #7F34E6',
                        paddingLeft: '12px'
                      };

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
                          {/* Voltar button */}
                          <button
                            onClick={() => setClientesView('list')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              alignSelf: 'flex-start',
                              fontSize: '0.95rem',
                              transition: 'color 0.2s',
                              padding: '4px 0'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                          >
                            <ArrowLeft size={16} /> Voltar
                          </button>

                          {/* Selected Customer Profile */}
                          {selectedCustomer ? (
                            <div style={{
                              backgroundColor: 'white',
                              borderRadius: '32px',
                              padding: '40px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 20px 50px -12px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.1) inset',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '32px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              {/* Top decorative gradient bar */}
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '6px',
                                background: 'linear-gradient(90deg, #7F34E6 0%, #10b981 100%)'
                              }}></div>

                              {/* Dossier Header */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px' }}>
                                <div style={{
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(127, 52, 230, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#7F34E6',
                                  flexShrink: 0
                                }}>
                                  <UserCircle2 size={32} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#7F34E6', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                    Cadastro do Cliente
                                  </span>
                                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                    {selectedCustomer.nome}
                                  </h3>
                                </div>
                                <div>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    backgroundColor: selectedCustomer.id_tppessoa === 1 ? '#eff6ff' : '#ecfdf5',
                                    color: selectedCustomer.id_tppessoa === 1 ? '#2563eb' : '#059669',
                                    border: selectedCustomer.id_tppessoa === 1 ? '1px solid #dbeafe' : '1px solid #d1fae5',
                                    display: 'inline-block'
                                  }}>
                                    {selectedCustomer.id_tppessoa === 1 ? 'Pessoa Jurídica' : 'Pessoa Física'}
                                  </span>
                                </div>
                              </div>

                              {/* Section 1: Qualificação Pessoal */}
                              <div>
                                <h4 style={sectionTitleStyle}>
                                  <FileText size={16} style={{ color: '#7F34E6' }} />
                                  1. Qualificação Pessoal / Societária
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                  <div style={cardStyle}>
                                    <span style={labelStyle}>CPF / CNPJ</span>
                                    <strong style={valStyle}>{formatDoc(selectedCustomer.cnpjcpf)}</strong>
                                  </div>
                                  {selectedCustomer.identidade && (
                                    <div style={cardStyle}>
                                      <span style={labelStyle}>RG / Identidade</span>
                                      <strong style={valStyle}>
                                        {selectedCustomer.identidade} {selectedCustomer.emissor ? `(${selectedCustomer.emissor}/${selectedCustomer.emissor_uf_sigla || selectedCustomer.emissor_uf || ''})` : ''}
                                      </strong>
                                    </div>
                                  )}
                                  {selectedCustomer.nascimento && (
                                    <div style={cardStyle}>
                                      <span style={labelStyle}>Nascimento</span>
                                      <strong style={valStyle}>{new Date(selectedCustomer.nascimento).toLocaleDateString('pt-BR')}</strong>
                                    </div>
                                  )}
                                  {(selectedCustomer.profissao_nome || selectedCustomer.profissao) && (
                                    <div style={cardStyle}>
                                      <span style={labelStyle}>
                                        {Number(selectedCustomer.id_tppessoa) === 1 ? 'Atividade Econômica' : 'Profissão'}
                                      </span>
                                      <strong style={valStyle}>{selectedCustomer.profissao_nome || selectedCustomer.profissao}</strong>
                                    </div>
                                  )}
                                  <div style={cardStyle}>
                                    <span style={labelStyle}>Estado Civil</span>
                                    <strong style={valStyle}>{selectedCustomer.estado_civil_nome || 'Não informado'}</strong>
                                  </div>
                                  {selectedCustomer.regime_bens && (
                                    <div style={cardStyle}>
                                      <span style={labelStyle}>Regime de Bens</span>
                                      <strong style={valStyle}>{selectedCustomer.regime_bens}</strong>
                                    </div>
                                  )}
                                  <div style={cardStyle}>
                                    <span style={labelStyle}>Nacionalidade</span>
                                    <strong style={valStyle}>
                                      {selectedCustomer.nacionalidade_pais_nacionalidade || selectedCustomer.nacionalidade || 'Não informado'}
                                    </strong>
                                  </div>
                                  <div style={cardStyle}>
                                    <span style={labelStyle}>Naturalidade</span>
                                    <strong style={valStyle}>
                                      {selectedCustomer.naturalidade_cidade_nome 
                                        ? `${selectedCustomer.naturalidade_cidade_nome}/${selectedCustomer.naturalidade_uf_sigla || ''}` 
                                        : selectedCustomer.naturalidade || 'Não informada'}
                                    </strong>
                                  </div>
                                  {selectedCustomer.email && (
                                    <div style={cardStyle}>
                                      <span style={labelStyle}>E-mail</span>
                                      <strong style={{ ...valStyle, color: '#7F34E6' }}>{selectedCustomer.email}</strong>
                                    </div>
                                  )}
                                  {selectedCustomer.cel && (
                                    <div style={cardStyle}>
                                      <span style={labelStyle}>WhatsApp / Celular</span>
                                      <strong style={valStyle}>{formatPhone(selectedCustomer.cel)}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Section 2: Cônjuge */}
                              {(selectedCustomer.conjuge_nome || selectedCustomer.conjuge_cpf) && (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                                  <h4 style={sectionTitleStyle}>
                                    <UserCircle2 size={16} style={{ color: '#7F34E6' }} />
                                    2. Qualificação do Cônjuge
                                  </h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                    <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
                                      <span style={labelStyle}>Nome do Cônjuge</span>
                                      <strong style={valStyle}>{selectedCustomer.conjuge_nome || 'Não informado'}</strong>
                                    </div>
                                    {selectedCustomer.conjuge_cpf && (
                                      <div style={cardStyle}>
                                        <span style={labelStyle}>CPF Cônjuge</span>
                                        <strong style={valStyle}>{formatCPF(selectedCustomer.conjuge_cpf)}</strong>
                                      </div>
                                    )}
                                    {selectedCustomer.conjuge_profissao && (
                                      <div style={cardStyle}>
                                        <span style={labelStyle}>Profissão Cônjuge</span>
                                        <strong style={valStyle}>{selectedCustomer.conjuge_profissao}</strong>
                                      </div>
                                    )}
                                    {selectedCustomer.conjuge_identidade && (
                                      <div style={cardStyle}>
                                        <span style={labelStyle}>RG Cônjuge</span>
                                        <strong style={valStyle}>
                                          {selectedCustomer.conjuge_identidade} {selectedCustomer.conjuge_emissor ? `(${selectedCustomer.conjuge_emissor}/${selectedCustomer.conjuge_emissor_uf || ''})` : ''}
                                        </strong>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Section 3: Endereço Residente */}
                              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                                <h4 style={sectionTitleStyle}>
                                  <Home size={16} style={{ color: '#7F34E6' }} />
                                  3. Endereço Comercial / Residencial
                                </h4>
                                {selectedCustomer.logradouro ? (
                                  <div style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '16px'
                                  }}>
                                    <div style={{
                                      backgroundColor: 'rgba(127, 52, 230, 0.08)',
                                      color: '#7F34E6',
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      📍
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px 24px', width: '100%' }}>
                                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={labelStyle}>Logradouro</span>
                                        <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 800 }}>
                                          {selectedCustomer.logradouro}, nº {selectedCustomer.numero || 'S/N'}
                                        </span>
                                      </div>
                                      {selectedCustomer.complemento && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <span style={labelStyle}>Complemento</span>
                                          <strong style={valStyle}>{selectedCustomer.complemento}</strong>
                                        </div>
                                      )}
                                      {selectedCustomer.bairro_nome && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <span style={labelStyle}>Bairro</span>
                                          <strong style={valStyle}>{selectedCustomer.bairro_nome}</strong>
                                        </div>
                                      )}
                                      {selectedCustomer.cidade_nome && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <span style={labelStyle}>Cidade</span>
                                          <strong style={valStyle}>
                                            {selectedCustomer.cidade_nome} - {selectedCustomer.estado_uf || ''}
                                          </strong>
                                        </div>
                                      )}
                                      {selectedCustomer.cep && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <span style={labelStyle}>CEP</span>
                                          <strong style={valStyle}>{formatCEP(selectedCustomer.cep)}</strong>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px dashed #cbd5e1',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    color: '#64748b',
                                    fontSize: '0.9rem'
                                  }}>
                                    Nenhum endereço cadastrado para este cliente.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              border: '2px dashed #e2e8f0',
                              borderRadius: '24px',
                              padding: '40px 20px',
                              textAlign: 'center',
                              color: '#94a3b8'
                            }}>
                              📁 Nenhum cliente selecionado.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {clientesView === 'cadastro' && (
                      /* REGISTRATION WIZARD FORM */
                      <div>
                        {/* Back navigation */}
                        <button
                          onClick={() => {
                            setClientesView('list');
                            setEditingCustomerId(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '20px',
                            fontSize: '0.95rem'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                        >
                          ← Voltar
                        </button>

                        <div style={{
                          backgroundColor: 'white',
                          borderRadius: '24px',
                          border: '1px solid #e2e8f0',
                          padding: '24px 32px',
                          marginBottom: '28px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '16px',
                          boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.02)'
                        }}>
                          <div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                              {editingCustomerId ? 'Editar Cadastro do Cliente' : 'Cadastrar Cliente para Contratos'}
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0 0' }}>
                              {editingCustomerId 
                                ? 'Atualize os dados cadastrais necessários para a geração dos contratos.'
                                : 'Preencha os dados qualificados necessários para a geração do contrato de locação ou venda.'}
                            </p>
                          </div>
                        </div>

                        {/* Step Indicators */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '16px',
                          marginBottom: '32px',
                          maxWidth: '600px',
                          margin: '0 auto 32px auto'
                        }}>
                          {[1, 2, 3].map(step => {
                            let label = '';
                            if (step === 1) label = 'Dados';
                            if (step === 2) label = 'Cônjuge';
                            if (step === 3) label = 'Endereço';

                            const isCompleted = wizardStep > step;
                            const isActive = wizardStep === step;

                            // If civil state is not Casado or União Estável, Step 2 is not needed. We'll show it as non-applicable.
                            const isMarried = formEstadoCivilId === '2' || formEstadoCivilId === '6';
                            const isStep2Disabled = step === 2 && !isMarried;

                            return (
                              <React.Fragment key={step}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  opacity: isStep2Disabled ? 0.35 : 1
                                }}>
                                  <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: isCompleted ? '#10b981' : (isActive ? '#7F34E6' : '#f1f5f9'),
                                    color: isCompleted || isActive ? 'white' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.75rem'
                                  }}>
                                    {isCompleted ? '✓' : step}
                                  </span>
                                  <span style={{
                                    fontSize: '0.775rem',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#0f172a' : '#64748b',
                                    letterSpacing: '0.015em'
                                  }}>
                                    {label} {isStep2Disabled && '(N/A)'}
                                  </span>
                                </div>
                                {step < 3 && (
                                  <div style={{
                                    flex: 1,
                                    height: '1px',
                                    backgroundColor: wizardStep > step ? '#10b981' : '#e2e8f0',
                                    maxWidth: '60px'
                                  }}></div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Form Wizard Centered Container */}
                        <div style={{
                          maxWidth: '800px',
                          margin: '0 auto'
                        }}>
                          
                          {/* Form Section */}
                          <div className="wizard-form-card" style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            padding: '36px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)'
                          }}>
                            <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleFormKeyDown}>
                              
                              {/* STEP 1: CLIENT IDENTITY */}
                              {wizardStep === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', margin: '0 0 10px 0' }}>
                                    1. Dados de Identificação
                                  </h3>

                                  {/* Nome Input with Lead Search Link */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Nome Completo / Razão Social *
                                      </label>
                                      {!editingCustomerId && (
                                        <button
                                          type="button"
                                          onClick={handleLookupLeadSwal}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#7f34e6',
                                            fontSize: '0.725rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                        >
                                          🔍 Importar de Lead
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      value={formCustName}
                                      onChange={(e) => setFormCustName(e.target.value)}
                                      placeholder="Ex: João da Silva"
                                      style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                  </div>

                                  {/* Tipo de Pessoa Dropdown */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      Tipo de Pessoa
                                    </label>
                                    <select
                                      value={formTpPessoa}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormTpPessoa(val);
                                        setFormProfissao('');
                                        setProfessionSearchQuery('');
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        color: '#334155',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {personTypes.map((pt) => {
                                        const cleanDesc = pt.descricao.toUpperCase();
                                        const isPF = cleanDesc.includes('FISICA') || pt.sigla === 'F' || pt.sigla === 'PF';
                                        return (
                                          <option key={pt.id_tppessoa} value={String(pt.id_tppessoa)}>
                                            {isPF ? 'Pessoa Física (CPF)' : 'Pessoa Jurídica (CNPJ)'}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  {/* CPF/CNPJ & Nascimento */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        CPF / CNPJ *
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={formCnpjCpf}
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          const formatted = formatCpfCnpjProgressive(raw, formTpPessoa);
                                          setFormCnpjCpf(formatted);
                                        }}
                                        placeholder={String(formTpPessoa) === '2' ? '000.000.000-00' : '00.000.000/0000-00'}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {String(formTpPessoa) === '2' ? 'Data de Nascimento' : 'Data de Fundação'}
                                      </label>
                                      <input
                                        type="text"
                                        value={formNascimento}
                                        onChange={(e) => {
                                          const formatted = formatDateProgressive(e.target.value);
                                          setFormNascimento(formatted);
                                        }}
                                        placeholder="DD / MM / AAAA"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* RG & Emissor & Data Emissão RG */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '35% 25% 40%', gap: '16px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        RG / IE (Insc. Estadual)
                                      </label>
                                      <input
                                        type="text"
                                        value={formIdentidade}
                                        onChange={(e) => setFormIdentidade(e.target.value)}
                                        placeholder="Número da Identidade"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Órgão Emissor
                                      </label>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <input
                                          type="text"
                                          value={formEmissor}
                                          onChange={(e) => {
                                            const clean = e.target.value
                                              .normalize('NFD')
                                              .replace(/[\u0300-\u036f]/g, '')
                                              .replace(/[^a-zA-Z]/g, '')
                                              .toUpperCase();
                                            setFormEmissor(clean);
                                          }}
                                          placeholder="SSP"
                                          style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', width: '55%' }}
                                        />
                                        <select
                                          value={formEmissorUf}
                                          onChange={(e) => setFormEmissorUf(e.target.value)}
                                          style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', width: '45%', backgroundColor: 'white' }}
                                        >
                                          <option value="">UF</option>
                                          {statesList.map((st: any) => (
                                            <option key={st.id} value={String(st.id)}>{st.sigla}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Data de Emissão
                                      </label>
                                      <input
                                        type="text"
                                        value={formDtEmissaoRg}
                                        onChange={(e) => {
                                          const formatted = formatDateProgressive(e.target.value);
                                          setFormDtEmissaoRg(formatted);
                                        }}
                                        placeholder="DD / MM / AAAA"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* E-mail & Phone */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        E-mail do Cliente
                                      </label>
                                      <input
                                        type="email"
                                        value={formCustEmail}
                                        onChange={(e) => setFormCustEmail(e.target.value)}
                                        placeholder="exemplo@email.com"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Celular / WhatsApp
                                      </label>
                                      <input
                                        type="text"
                                        value={formCustPhone}
                                        onChange={(e) => setFormCustPhone(formatPhoneProgressive(e.target.value))}
                                        placeholder="Ex: (81) 99999-9999"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Estado Civil & Regime de Bens */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Estado Civil
                                      </label>
                                      <select
                                        value={formEstadoCivilId}
                                        onChange={(e) => setFormEstadoCivilId(e.target.value)}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                      >
                                        <option value="">Selecione...</option>
                                        {civilStates.map(st => (
                                          <option key={st.id} value={st.id}>{st.nome}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Regime de Bens (se casado)
                                      </label>
                                      <select
                                        value={formRegimeBens}
                                        onChange={(e) => setFormRegimeBens(e.target.value)}
                                        disabled={!(formEstadoCivilId === '2' || formEstadoCivilId === '6')}
                                        style={{ 
                                          padding: '12px 16px', 
                                          borderRadius: '10px', 
                                          border: '1px solid #e2e8f0', 
                                          fontSize: '0.95rem', 
                                          outline: 'none', 
                                          backgroundColor: (formEstadoCivilId === '2' || formEstadoCivilId === '6') ? 'white' : '#f1f5f9',
                                          color: '#334155',
                                          cursor: (formEstadoCivilId === '2' || formEstadoCivilId === '6') ? 'pointer' : 'default'
                                        }}
                                      >
                                        <option value="">Selecione...</option>
                                        {regimesList.map(rb => (
                                          <option key={rb.id_regime} value={String(rb.id_regime)}>{rb.descricao}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Profissão & Nacionalidade */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {String(formTpPessoa) === '1' ? 'Atividade Econômica' : 'Profissão'}
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="text"
                                          disabled={loadingProfessions}
                                          value={professionSearchQuery}
                                          onChange={(e) => {
                                            setProfessionSearchQuery(e.target.value);
                                            setIsProfessionDropdownOpen(true);
                                            setActiveProfessionIndex(-1);
                                            const match = professionsList.find(p => p.nome.toUpperCase() === e.target.value.toUpperCase());
                                            if (match) {
                                              setFormProfissao(String(match.id_ramosativ));
                                            } else {
                                              setFormProfissao('');
                                            }
                                          }}
                                          onKeyDown={handleProfessionKeyDown}
                                          onFocus={() => {
                                            setIsProfessionDropdownOpen(true);
                                            setActiveProfessionIndex(-1);
                                          }}
                                          onBlur={() => setTimeout(() => {
                                            setIsProfessionDropdownOpen(false);
                                            setActiveProfessionIndex(-1);
                                          }, 200)}
                                          placeholder={
                                            loadingProfessions 
                                              ? 'Carregando opções...' 
                                              : String(formTpPessoa) === '1'
                                                ? 'Selecione a Atividade Econômica...'
                                                : 'Selecione a Profissão...'
                                          }
                                          style={{ 
                                            padding: '12px 16px', 
                                            borderRadius: '10px', 
                                            border: '1px solid #e2e8f0', 
                                            fontSize: '0.95rem', 
                                            outline: 'none', 
                                            width: '100%', 
                                            boxSizing: 'border-box'
                                          }}
                                        />
                                        {isProfessionDropdownOpen && professionsList.length > 0 && (
                                          <div 
                                            id="primary-profession-dropdown"
                                            style={{
                                              position: 'absolute',
                                              top: '100%',
                                              left: 0,
                                              right: 0,
                                              zIndex: 999,
                                              maxHeight: '200px',
                                              overflowY: 'auto',
                                              backgroundColor: 'white',
                                              border: '1px solid #e2e8f0',
                                              borderRadius: '10px',
                                              marginTop: '4px',
                                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                            }}
                                          >
                                            {professionsList
                                              .filter(p => 
                                                p.nome.toLowerCase().includes(professionSearchQuery.toLowerCase())
                                              )
                                              .map((p, idx) => (
                                                <div
                                                  key={p.id_ramosativ}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setProfessionSearchQuery(p.nome);
                                                    setFormProfissao(String(p.id_ramosativ));
                                                    setIsProfessionDropdownOpen(false);
                                                    setActiveProfessionIndex(-1);
                                                  }}
                                                  style={{
                                                    padding: '10px 16px',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.15s',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    backgroundColor: activeProfessionIndex === idx ? 'rgba(127, 52, 230, 0.06)' : 'white'
                                                  }}
                                                  onMouseOver={() => setActiveProfessionIndex(idx)}
                                                >
                                                  {p.nome}
                                                </div>
                                              ))}
                                            {professionsList.filter(p => 
                                              p.nome.toLowerCase().includes(professionSearchQuery.toLowerCase())
                                            ).length === 0 && (
                                              <div style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                                                Nenhum registro encontrado
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Nacionalidade
                                      </label>
                                      <select
                                        value={formNacionalidade}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setFormNacionalidade(val);
                                          setFormNatEstadoId('');
                                          setFormNatCidadeId('');
                                          setCitySearchQuery('');
                                        }}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                      >
                                        <option value="">Selecione a Nacionalidade</option>
                                        {countriesList.map((c: any) => (
                                          <option key={c.id} value={String(c.id)}>{c.nacionalidade}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Naturalidade (Estado & Cidade) */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Naturalidade (Estado)
                                      </label>
                                      <select
                                        value={formNatEstadoId}
                                        disabled={!formNacionalidade || loadingNatStates}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setFormNatEstadoId(val);
                                          setFormNatCidadeId('');
                                          setCitySearchQuery('');
                                        }}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                      >
                                        <option value="">
                                          {loadingNatStates ? 'Carregando estados...' : !formNacionalidade ? 'Selecione o País primeiro' : 'Selecione o Estado'}
                                        </option>
                                        {natStatesList.map((st: any) => (
                                          <option key={st.id} value={String(st.id)}>{st.nome} ({st.sigla})</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Naturalidade (Cidade)
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="text"
                                          disabled={!formNatEstadoId || loadingNatCities}
                                          value={citySearchQuery}
                                          onChange={(e) => {
                                            setCitySearchQuery(e.target.value);
                                            setIsCityDropdownOpen(true);
                                            setActiveCityIndex(-1);
                                            const match = natCitiesList.find(c => c.descricao.toUpperCase() === e.target.value.toUpperCase());
                                            if (match) {
                                              setFormNatCidadeId(String(match.id));
                                            } else {
                                              setFormNatCidadeId('');
                                            }
                                          }}
                                          onKeyDown={handleCityKeyDown}
                                          onFocus={() => {
                                            setIsCityDropdownOpen(true);
                                            setActiveCityIndex(-1);
                                          }}
                                          onBlur={() => setTimeout(() => {
                                            setIsCityDropdownOpen(false);
                                            setActiveCityIndex(-1);
                                          }, 200)}
                                          placeholder={
                                            loadingNatCities 
                                              ? 'Carregando cidades...' 
                                              : !formNatEstadoId 
                                                ? 'Selecione o Estado primeiro' 
                                                : 'Digite para pesquisar a cidade...'
                                          }
                                          style={{ 
                                            padding: '12px 16px', 
                                            borderRadius: '10px', 
                                            border: '1px solid #e2e8f0', 
                                            fontSize: '0.95rem', 
                                            outline: 'none', 
                                            width: '100%', 
                                            boxSizing: 'border-box',
                                            backgroundColor: !formNatEstadoId ? '#f1f5f9' : 'white'
                                          }}
                                        />
                                        {isCityDropdownOpen && formNatEstadoId && natCitiesList.length > 0 && (
                                          <div 
                                            id="city-dropdown"
                                            style={{
                                              position: 'absolute',
                                              top: '100%',
                                              left: 0,
                                              right: 0,
                                              zIndex: 999,
                                              maxHeight: '200px',
                                              overflowY: 'auto',
                                              backgroundColor: 'white',
                                              border: '1px solid #e2e8f0',
                                              borderRadius: '10px',
                                              marginTop: '4px',
                                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                            }}
                                          >
                                            {natCitiesList
                                              .filter(cid => 
                                                cid.descricao.toLowerCase().includes(citySearchQuery.toLowerCase())
                                              )
                                              .map((cid, idx) => (
                                                <div
                                                  key={cid.id}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setCitySearchQuery(cid.descricao);
                                                    setFormNatCidadeId(String(cid.id));
                                                    setIsCityDropdownOpen(false);
                                                    setActiveCityIndex(-1);
                                                  }}
                                                  style={{
                                                    padding: '10px 16px',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.15s',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    backgroundColor: activeCityIndex === idx ? 'rgba(127, 52, 230, 0.06)' : 'white'
                                                  }}
                                                  onMouseOver={() => setActiveCityIndex(idx)}
                                                >
                                                  {cid.descricao}
                                                </div>
                                              ))}
                                            {natCitiesList.filter(cid => 
                                              cid.descricao.toLowerCase().includes(citySearchQuery.toLowerCase())
                                            ).length === 0 && (
                                              <div style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                                                Nenhuma cidade encontrada
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Step 1 Actions */}
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!formCustName || !formCnpjCpf) {
                                          fire({
                                            icon: 'warning',
                                            title: 'Campos Obrigatórios',
                                            text: 'Por favor, preencha o Nome e o Documento.',
                                            confirmButtonColor: '#7F34E6'
                                          });
                                          return;
                                        }
                                        const isMarried = formEstadoCivilId === '2' || formEstadoCivilId === '6';
                                        setWizardStep(isMarried ? 2 : 3);
                                      }}
                                      style={{
                                        backgroundColor: '#7F34E6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '12px 28px',
                                        fontWeight: 700,
                                        fontSize: '0.925rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      Continuar <ArrowRight size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* STEP 2: SPOUSE INFORMATION */}
                              {wizardStep === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', margin: '0 0 10px 0' }}>
                                    2. Dados do Cônjuge
                                  </h3>

                                  {/* Nome Cônjuge */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      Nome Completo do Cônjuge
                                    </label>
                                    <input
                                      type="text"
                                      value={formConjugeNome}
                                      onChange={(e) => setFormConjugeNome(e.target.value)}
                                      placeholder="Nome completo do parceiro(a)"
                                      style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                    />
                                  </div>

                                  {/* CPF & Nascimento Cônjuge */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        CPF do Cônjuge
                                      </label>
                                      <input
                                        type="text"
                                        value={formConjugeCpf}
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          const formatted = formatCpfCnpjProgressive(raw, '2');
                                          setFormConjugeCpf(formatted);
                                        }}
                                        placeholder="000.000.000-00"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Data de Nascimento Cônjuge
                                      </label>
                                      <input
                                        type="text"
                                        value={formConjugeNascimento}
                                        onChange={(e) => {
                                          const formatted = formatDateProgressive(e.target.value);
                                          setFormConjugeNascimento(formatted);
                                        }}
                                        placeholder="DD / MM / AAAA"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* RG Cônjuge & Emissor */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '20% 25% 55%', gap: '16px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        RG do Cônjuge
                                      </label>
                                      <input
                                        type="text"
                                        value={formConjugeIdentidade}
                                        onChange={(e) => setFormConjugeIdentidade(e.target.value)}
                                        placeholder="RG"
                                        style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Órgão Emissor
                                      </label>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <input
                                          type="text"
                                          value={formConjugeEmissor}
                                          onChange={(e) => {
                                            const clean = e.target.value
                                              .normalize('NFD')
                                              .replace(/[\u0300-\u036f]/g, '')
                                              .replace(/[^a-zA-Z]/g, '')
                                              .toUpperCase();
                                            setFormConjugeEmissor(clean);
                                          }}
                                          placeholder="SSP"
                                          style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', width: '55%' }}
                                        />
                                        <select
                                           value={formConjugeEmissorUf}
                                           onChange={(e) => setFormConjugeEmissorUf(e.target.value)}
                                           style={{ padding: '12px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', width: '45%', backgroundColor: 'white', color: '#334155', cursor: 'pointer' }}
                                         >
                                           <option value="">UF</option>
                                           {statesList.map((st: any) => (
                                            <option key={st.id} value={st.sigla}>{st.sigla}</option>
                                           ))}
                                         </select>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Profissão Cônjuge
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                         <input
                                           type="text"
                                           disabled={loadingConjugeProfessions}
                                           value={conjugeProfessionSearchQuery}
                                           onChange={(e) => {
                                             setConjugeProfessionSearchQuery(e.target.value);
                                             setIsConjugeProfessionDropdownOpen(true);
                                             setActiveConjugeProfessionIndex(-1);
                                             const match = conjugeProfessionsList.find(p => p.nome.toUpperCase() === e.target.value.toUpperCase());
                                             if (match) {
                                               setFormConjugeProfissao(String(match.id_ramosativ));
                                             } else {
                                               setFormConjugeProfissao('');
                                             }
                                           }}
                                           onKeyDown={handleConjugeProfessionKeyDown}
                                           onFocus={() => {
                                             setIsConjugeProfessionDropdownOpen(true);
                                             setActiveConjugeProfessionIndex(-1);
                                           }}
                                           onBlur={() => setTimeout(() => {
                                             setIsConjugeProfessionDropdownOpen(false);
                                             setActiveConjugeProfessionIndex(-1);
                                           }, 200)}
                                           placeholder={
                                             loadingConjugeProfessions 
                                               ? 'Carregando opções...' 
                                               : 'Selecione a Profissão...'
                                           }
                                           style={{ 
                                             padding: '12px 16px', 
                                             borderRadius: '10px', 
                                             border: '1px solid #e2e8f0', 
                                             fontSize: '0.95rem', 
                                             outline: 'none', 
                                             width: '100%', 
                                             boxSizing: 'border-box'
                                           }}
                                         />
                                         {isConjugeProfessionDropdownOpen && conjugeProfessionsList.length > 0 && (
                                           <div 
                                             id="conjuge-profession-dropdown"
                                             style={{
                                               position: 'absolute',
                                               top: '100%',
                                               left: 0,
                                               right: 0,
                                               zIndex: 999,
                                               maxHeight: '200px',
                                               overflowY: 'auto',
                                               backgroundColor: 'white',
                                               border: '1px solid #e2e8f0',
                                               borderRadius: '10px',
                                               marginTop: '4px',
                                               boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                             }}
                                           >
                                             {conjugeProfessionsList
                                               .filter(p => 
                                                 p.nome.toLowerCase().includes(conjugeProfessionSearchQuery.toLowerCase())
                                               )
                                               .map((p, idx) => (
                                                 <div
                                                   key={p.id_ramosativ}
                                                   onMouseDown={(e) => {
                                                     e.preventDefault();
                                                     setConjugeProfessionSearchQuery(p.nome);
                                                     setFormConjugeProfissao(String(p.id_ramosativ));
                                                     setIsConjugeProfessionDropdownOpen(false);
                                                     setActiveConjugeProfessionIndex(-1);
                                                   }}
                                                   style={{
                                                     padding: '10px 16px',
                                                     fontSize: '0.9rem',
                                                     cursor: 'pointer',
                                                     transition: 'background-color 0.15s',
                                                     borderBottom: '1px solid #f1f5f9',
                                                     backgroundColor: activeConjugeProfessionIndex === idx ? 'rgba(127, 52, 230, 0.06)' : 'white'
                                                   }}
                                                   onMouseOver={() => setActiveConjugeProfessionIndex(idx)}
                                                 >
                                                   {p.nome}
                                                 </div>
                                               ))}
                                             {conjugeProfessionsList.filter(p => 
                                               p.nome.toLowerCase().includes(conjugeProfessionSearchQuery.toLowerCase())
                                             ).length === 0 && (
                                               <div style={{ padding: '12px 16px', fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                                                 Nenhum registro encontrado
                                               </div>
                                             )}
                                           </div>
                                         )}
                                       </div>
                                    </div>
                                  </div>

                                  {/* Step 2 Actions */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setWizardStep(3)}
                                      style={{
                                        backgroundColor: '#7F34E6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '12px 28px',
                                        fontWeight: 700,
                                        fontSize: '0.925rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        order: 2
                                      }}
                                    >
                                      Continuar <ArrowRight size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setWizardStep(1)}
                                      style={{
                                        backgroundColor: 'white',
                                        color: '#64748b',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '10px',
                                        padding: '12px 24px',
                                        fontWeight: 700,
                                        fontSize: '0.925rem',
                                        cursor: 'pointer',
                                        order: 1
                                      }}
                                    >
                                      ← Voltar
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* STEP 3: ADDRESS & SAVE */}
                              {wizardStep === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', margin: '0 0 10px 0' }}>
                                    3. Endereço Comercial / Residencial
                                  </h3>

                                  {/* CEP & Logradouro */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '16px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        CEP *
                                      </label>
                                      <div style={{ position: 'relative' }}>
                                        <input
                                          type="text"
                                          required
                                          value={formCep}
                                          onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                                            const masked = digits.length > 5
                                              ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                                              : digits;
                                            setFormCep(masked);
                                          }}
                                          onBlur={handleCepBlur}
                                          placeholder="00000-000"
                                          style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                                        />
                                        {loadingCep && (
                                          <span style={{ position: 'absolute', right: '12px', top: '35%', fontSize: '0.8rem', color: '#7F34E6' }}>
                                            ⌛
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Logradouro (Avenida/Rua) *
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={formLogradouro}
                                        onChange={(e) => setFormLogradouro(e.target.value)}
                                        placeholder="Nome do logradouro"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* Numero & Complemento */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '16px' }} className="mobile-one-col">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Número *
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={formNumero}
                                        onChange={(e) => setFormNumero(e.target.value)}
                                        placeholder="Ex: 123 ou S/N"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Complemento (Apt/Sala/etc)
                                      </label>
                                      <input
                                        type="text"
                                        value={formComplemento}
                                        onChange={(e) => setFormComplemento(e.target.value)}
                                        placeholder="Ex: Apt 402"
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                      />
                                    </div>
                                  </div>

                                  {/* UF, Cidade & Bairro - Cascading selects */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.25fr 1.25fr', gap: '12px' }} className="mobile-one-col">
                                    {/* UF Select */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        UF *
                                      </label>
                                      <select
                                        value={formAddrEstadoId}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          setFormAddrEstadoId(selectedId);
                                          setFormAddrCidadeId('');
                                          setFormAddrBairroId('');
                                          setFormCidade('');
                                          setFormBairro('');
                                          const est = addrEstadosList.find((s: any) => String(s.id) === selectedId);
                                          setFormEstado(est ? est.sigla : '');
                                        }}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                      >
                                        <option value="">UF</option>
                                        {Array.from(new Map(addrEstadosList.map((st: any) => [st.id, st])).values()).map((st: any) => (
                                          <option key={st.id} value={String(st.id)}>{st.sigla}</option>
                                        ))}
                                      </select>
                                    </div>
                                    {/* Cidade Select */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Cidade *
                                      </label>
                                      <select
                                        value={formAddrCidadeId}
                                        disabled={!formAddrEstadoId || loadingAddrCidades}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          setFormAddrCidadeId(selectedId);
                                          setFormAddrBairroId('');
                                          setFormBairro('');
                                          const cid = addrCidadesList.find((c: any) => String(c.id) === selectedId);
                                          setFormCidade(cid ? cid.descricao : '');
                                        }}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: !formAddrEstadoId ? '#f1f5f9' : 'white' }}
                                      >
                                        <option value="">
                                          {loadingAddrCidades ? 'Carregando...' : !formAddrEstadoId ? 'Selecione UF primeiro' : 'Selecione a Cidade'}
                                        </option>
                                        {Array.from(new Map(addrCidadesList.map((c: any) => [c.id, c])).values()).map((c: any) => (
                                          <option key={c.id} value={String(c.id)}>{c.descricao}</option>
                                        ))}
                                      </select>
                                    </div>
                                    {/* Bairro Select */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Bairro *
                                      </label>
                                      <select
                                        value={formAddrBairroId}
                                        disabled={!formAddrCidadeId || loadingAddrBairros}
                                        onChange={(e) => {
                                          const selectedId = e.target.value;
                                          setFormAddrBairroId(selectedId);
                                          const bai = addrBairrosList.find((b: any) => String(b.id) === selectedId);
                                          setFormBairro(bai ? bai.descricao : '');
                                        }}
                                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: !formAddrCidadeId ? '#f1f5f9' : 'white' }}
                                      >
                                        <option value="">
                                          {loadingAddrBairros ? 'Carregando...' : !formAddrCidadeId ? 'Selecione a Cidade primeiro' : addrBairrosList.length === 0 ? 'Nenhum bairro cadastrado' : 'Selecione o Bairro'}
                                        </option>
                                        {Array.from(new Map(addrBairrosList.map((b: any) => [b.id, b])).values()).map((b: any) => (
                                          <option key={b.id} value={String(b.id)}>{b.descricao}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Step 3 Actions */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                    <button
                                      type="button"
                                      disabled={submitting}
                                      onClick={handleCreateCustomer}
                                      style={{
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '12px 28px',
                                        fontWeight: 800,
                                        fontSize: '0.925rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                        order: 2
                                      }}
                                    >
                                      {submitting ? 'Salvando...' : '✓ Salvar Cliente'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const isMarried = formEstadoCivilId === '2' || formEstadoCivilId === '6';
                                        setWizardStep(isMarried ? 2 : 1);
                                      }}
                                      style={{
                                        backgroundColor: 'white',
                                        color: '#64748b',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '10px',
                                        padding: '12px 24px',
                                        fontWeight: 700,
                                        fontSize: '0.925rem',
                                        cursor: 'pointer',
                                        order: 1
                                      }}
                                    >
                                      ← Voltar
                                    </button>
                                  </div>
                                </div>
                              )}

                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SUPPORT TABLES */}
                {activeTab === 'apoio' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                    {supportView === 'list' ? (
                      <>
                        {/* Support Header & Stats */}
                        <div className="support-header-card" style={{
                          backgroundColor: 'white',
                          borderRadius: '24px',
                          padding: '24px 32px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}>
                          <div>
                            <h2 className="support-header-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                              {supportTable === 'ramosativ' && 'Atividade Econômica / Profissões'}
                              {supportTable === 'apopais' && 'País'}
                              {supportTable === 'apoestado' && 'Estado'}
                              {supportTable === 'apocidade' && 'Cidade'}
                              {supportTable === 'apobairro' && 'Bairro'}
                            </h2>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              value={supportTable}
                              onChange={(e) => setSupportTable(e.target.value as any)}
                              style={{
                                padding: '10px 16px',
                                borderRadius: '12px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem',
                                fontWeight: 650,
                                backgroundColor: 'white',
                                color: '#475569',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <option value="ramosativ">Atividade / Profissão</option>
                              <option value="apopais">País</option>
                              <option value="apoestado">Estado</option>
                              <option value="apocidade">Cidade</option>
                              <option value="apobairro">Bairro</option>
                            </select>

                            <button
                              onClick={() => {
                                setSupportFormNome('');
                                setSupportFormSigla('');
                                setSupportFormCodAtiv('');
                                setSupportFormTpPessoa('');
                                setSupportFormPaisId('');
                                setSupportFormEstadoId('');
                                setSupportFormCidadeId('');
                                setSupportFormCodigoIbge('');
                                setSupportView('cadastro');
                              }}
                              style={{
                                backgroundColor: '#7F34E6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(127,52,230,0.2)'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                            >
                              + Novo Registro
                            </button>
                          </div>
                        </div>

                        {/* Table View */}
                        <div className="support-table-card" style={{
                          backgroundColor: 'white',
                          borderRadius: '24px',
                          padding: '32px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        }}>
                          
                          {/* Search Bar */}
                          <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
                            <input
                              type="text"
                              placeholder="Buscar registros..."
                              value={supportSearch}
                              onChange={(e) => setSupportSearch(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                              }}
                            />
                          </div>

                          {loadingSupport ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                              <Loader2 className="animate-spin" size={32} style={{ color: '#7F34E6' }} />
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>ID</th>
                                    {supportTable === 'ramosativ' && (
                                      <>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', width: '50%', minWidth: '300px' }}>Nome / Atividade</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Código</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Tipo Pessoa</th>
                                      </>
                                    )}
                                    {supportTable === 'apopais' && (
                                      <>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', width: '40%', minWidth: '200px' }}>País</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Sigla</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Nacionalidade</th>
                                      </>
                                    )}
                                    {supportTable === 'apoestado' && (
                                      <>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', width: '40%', minWidth: '200px' }}>Estado</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Sigla</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Código IBGE</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>País</th>
                                      </>
                                    )}
                                    {supportTable === 'apocidade' && (
                                      <>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', width: '50%', minWidth: '300px' }}>Cidade</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>UF</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Código IBGE</th>
                                      </>
                                    )}
                                    {supportTable === 'apobairro' && (
                                      <>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', width: '40%', minWidth: '250px' }}>Bairro</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Cidade</th>
                                        <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>UF</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {supportSearch.trim().length < 3 ? (
                                    <tr>
                                      <td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.925rem' }}>
                                        🔍 Digite pelo menos 3 caracteres na busca para pesquisar registros.
                                      </td>
                                    </tr>
                                  ) : filteredSupportList.length === 0 ? (
                                    <tr>
                                      <td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.925rem' }}>
                                        Nenhum registro encontrado.
                                      </td>
                                    </tr>
                                  ) : (
                                    filteredSupportList.map((item) => (
                                      <tr key={item.id || item.id_ramosativ} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>
                                          {item.id || item.id_ramosativ}
                                        </td>
                                        {supportTable === 'ramosativ' && (
                                          <>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', width: '50%', minWidth: '300px' }}>{item.nome}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{item.codativ || '-'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                              <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                backgroundColor: item.id_tppessoa === 1 ? '#eff6ff' : '#ecfdf5',
                                                color: item.id_tppessoa === 1 ? '#2563eb' : '#059669'
                                              }}>
                                                {item.id_tppessoa === 1 ? 'PJ' : item.id_tppessoa === 2 ? 'PF' : 'Ambos'}
                                              </span>
                                            </td>
                                          </>
                                        )}
                                        {supportTable === 'apopais' && (
                                          <>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', width: '40%', minWidth: '200px' }}>{item.nome}</td>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>{item.sigla}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{item.nacionalidade || '-'}</td>
                                          </>
                                        )}
                                        {supportTable === 'apoestado' && (
                                          <>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', width: '40%', minWidth: '200px' }}>{item.nome}</td>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>{item.sigla}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{item.codigo_ibge || '-'}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{item.pais_nome || 'Brasil'}</td>
                                          </>
                                        )}
                                        {supportTable === 'apocidade' && (
                                          <>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', width: '50%', minWidth: '300px' }}>{item.descricao}</td>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>{item.estado_sigla || '-'}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{item.codigo_ibge || '-'}</td>
                                          </>
                                        )}
                                        {supportTable === 'apobairro' && (
                                          <>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', width: '40%', minWidth: '250px' }}>{item.descricao}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem' }}>{item.cidade_nome || '-'}</td>
                                            <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>{item.estado_sigla || '-'}</td>
                                          </>
                                        )}
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="support-form-card" style={{
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        padding: '32px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        width: '100%',
                        boxSizing: 'border-box',
                        animation: 'fadeIn 0.3s ease-out'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Cadastro de Apoio
                            </span>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                              Novo Registro - {supportTable === 'ramosativ' && 'Atividade / Profissão'}
                              {supportTable === 'apopais' && 'País'}
                              {supportTable === 'apoestado' && 'Estado'}
                              {supportTable === 'apocidade' && 'Cidade'}
                              {supportTable === 'apobairro' && 'Bairro'}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSupportView('list')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px 20px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          >
                            <ArrowLeft size={16} /> Voltar
                          </button>
                        </div>

                        <form onSubmit={handleCreateSupportRecord} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Common Field Name/Description */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {supportTable === 'ramosativ' ? 'Nome da Atividade / Profissão *' : (supportTable === 'apopais' || supportTable === 'apoestado' ? 'Nome *' : 'Descrição / Nome *')}
                            </label>
                            <input
                              type="text"
                              required
                              value={supportFormNome}
                              onChange={(e) => setSupportFormNome(e.target.value)}
                              placeholder="Digite o nome..."
                              style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                            />
                          </div>

                          {/* ramosativ specific: codativ & id_tppessoa */}
                          {supportTable === 'ramosativ' && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Código de Atividade (Opcional)
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    value={supportFormCodAtiv}
                                    onChange={(e) => setSupportFormCodAtiv(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearchCnae();
                                      }
                                    }}
                                    placeholder="Ex: 4520-0"
                                    style={{ 
                                      flex: 1, 
                                      padding: '12px 16px', 
                                      borderRadius: '10px', 
                                      border: '1px solid #e2e8f0', 
                                      fontSize: '0.95rem', 
                                      outline: 'none',
                                      minWidth: 0
                                    }}
                                  />
                                  <button
                                    type="button"
                                    disabled={loadingCnae}
                                    onClick={handleSearchCnae}
                                    style={{
                                      padding: '12px 20px',
                                      borderRadius: '10px',
                                      backgroundColor: '#7F34E6',
                                      color: 'white',
                                      border: 'none',
                                      fontSize: '0.875rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minWidth: '90px',
                                      transition: 'background-color 0.2s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7F34E6'}
                                  >
                                    {loadingCnae ? (
                                      <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                      'Buscar'
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Tipo de Pessoa *
                                </label>
                                <select
                                  required
                                  value={supportFormTpPessoa}
                                  onChange={(e) => setSupportFormTpPessoa(e.target.value)}
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                >
                                  <option value="">Selecione o Tipo de Pessoa *</option>
                                  <option value="2">Pessoa Física (PF)</option>
                                  <option value="1">Pessoa Jurídica (PJ)</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* apopais specific: sigla & nacionalidade */}
                          {supportTable === 'apopais' && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Sigla do País *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={3}
                                  value={supportFormSigla}
                                  onChange={(e) => setSupportFormSigla(e.target.value)}
                                  placeholder="Ex: BR"
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Nacionalidade *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={supportFormNacionalidade}
                                  onChange={(e) => setSupportFormNacionalidade(e.target.value)}
                                  placeholder="Ex: BRASILEIRO"
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                />
                              </div>
                            </>
                          )}

                          {/* apoestado specific: sigla, paisId, codigoIbge */}
                          {supportTable === 'apoestado' && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Sigla do Estado *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={2}
                                  value={supportFormSigla}
                                  onChange={(e) => setSupportFormSigla(e.target.value)}
                                  placeholder="Ex: PE"
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  País *
                                </label>
                                <select
                                  required
                                  value={supportFormPaisId}
                                  onChange={(e) => setSupportFormPaisId(e.target.value)}
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                >
                                  <option value="">Selecione o País *</option>
                                  {countriesList.map((c: any) => (
                                    <option key={c.id} value={String(c.id)}>{c.nome}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Código IBGE (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={supportFormCodigoIbge}
                                  onChange={(e) => setSupportFormCodigoIbge(e.target.value)}
                                  placeholder="Ex: 26"
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                />
                              </div>
                            </>
                          )}

                          {/* apocidade specific: estadoId, codigoIbge */}
                          {supportTable === 'apocidade' && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Estado *
                                </label>
                                <select
                                  required
                                  value={supportFormEstadoId}
                                  onChange={(e) => setSupportFormEstadoId(e.target.value)}
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                >
                                  <option value="">Selecione o Estado *</option>
                                  {statesList.map((st: any) => (
                                    <option key={st.id} value={String(st.id)}>{st.nome} ({st.sigla})</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Código IBGE (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={supportFormCodigoIbge}
                                  onChange={(e) => setSupportFormCodigoIbge(e.target.value)}
                                  placeholder="Ex: 2611606"
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                />
                              </div>
                            </>
                          )}

                          {/* apobairro specific: estadoId, cidadeId */}
                          {supportTable === 'apobairro' && (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Estado *
                                </label>
                                <select
                                  required
                                  value={supportFormEstadoId}
                                  onChange={(e) => {
                                    setSupportFormEstadoId(e.target.value);
                                    setSupportFormCidadeId('');
                                  }}
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                >
                                  <option value="">Selecione o Estado *</option>
                                  {statesList.map((st: any) => (
                                    <option key={st.id} value={String(st.id)}>{st.nome} ({st.sigla})</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Cidade *
                                </label>
                                <select
                                  required
                                  disabled={!supportFormEstadoId}
                                  value={supportFormCidadeId}
                                  onChange={(e) => setSupportFormCidadeId(e.target.value)}
                                  style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', backgroundColor: 'white' }}
                                >
                                  <option value="">Selecione a Cidade *</option>
                                  {citiesList
                                    .filter((c: any) => c.estado_id === Number(supportFormEstadoId))
                                    .map((c: any) => (
                                      <option key={c.id} value={String(c.id)}>{c.descricao}</option>
                                    ))}
                                </select>
                              </div>
                            </>
                          )}

                          <button
                            type="submit"
                            style={{
                              backgroundColor: '#7F34E6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '14px 24px',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              marginTop: '12px',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 12px rgba(127,52,230,0.15)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7F34E6'}
                          >
                            Salvar Registro
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* CENTRALIZED ATENDIMENTO MODAL */}
      {showProposalDetailModal && selectedProposal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: selectedProposal.tipo === 'proposta' || Number(selectedProposal.valor) > 0 ? 'rgba(127, 52, 230, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    color: selectedProposal.tipo === 'proposta' || Number(selectedProposal.valor) > 0 ? '#7f34e6' : '#10b981',
                    display: 'inline-block'
                  }}>
                    {selectedProposal.tipo === 'proposta' || Number(selectedProposal.valor) > 0 ? 'Proposta Recebida' : 'Lead / Contato do Site'}
                  </span>

                  {(selectedProposal.tipo === 'proposta' || Number(selectedProposal.valor) > 0) && (
                    <span style={{
                      fontSize: '0.7rem',
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
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Oportunidade #{selectedProposal.proposal_id}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedProposal.client_user_id != null && selectedProposal.client_user_id > 0 && (
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
                )}

                <button
                  onClick={() => setShowProposalDetailModal(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Funnel Progress Tracker */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Etapa Atual no Funil
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7f34e6', textTransform: 'uppercase' }}>
                    {selectedProposal.etapa || 'novo'}
                  </span>
                </div>

                {/* Progress Steps Track */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  margin: '10px 0'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    zIndex: 0
                  }}></div>
                  
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    width: (() => {
                      const stages = etapas.map(e => e.sigla);
                      const currentIdx = stages.indexOf(selectedProposal.etapa || 'novo');
                      return stages.length > 1 ? `${(currentIdx / (stages.length - 1)) * 100}%` : '0%';
                    })(),
                    height: '4px',
                    backgroundColor: '#7F34E6',
                    zIndex: 0,
                    transition: 'width 0.3s'
                  }}></div>

                  {etapas.map((stageObj, idx) => {
                    const step = stageObj.sigla;
                    const stepLabels: any = {
                      novo: { icon: '✨' },
                      contato: { icon: '💬' },
                      agendamento: { icon: '📅' },
                      proposta: { icon: '📝' },
                      fechamento: { icon: '🤝' }
                    };
                    const stages = etapas.map(e => e.sigla);
                    const isActive = selectedProposal.etapa === step;
                    const isCompleted = stages.indexOf(selectedProposal.etapa || 'novo') >= idx;

                    return (
                      <div
                        key={step}
                        onClick={async () => {
                          await handleUpdateEtapa(selectedProposal.proposal_id, step);
                          setSelectedProposal((prev: any) => prev ? { ...prev, etapa: step } : null);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 1,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isCompleted ? '#7F34E6' : 'white',
                          border: isCompleted ? '2px solid #7F34E6' : '2px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCompleted ? 'white' : '#94a3b8',
                          fontSize: '0.8rem',
                          boxShadow: isCompleted ? '0 0 8px rgba(127,52,230,0.25)' : 'none'
                        }}>
                          {stepLabels[step]?.icon || '✨'}
                        </div>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? '#7F34E6' : '#64748b',
                          marginTop: '6px'
                        }}>
                          {stageObj.nome}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid Client & Property */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                {/* Client Box */}
                <div style={{
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px'
                }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                    Informações do Lead
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>NOME COMPLETO</span>
                      <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{selectedProposal.sender_name || 'Não identificado'}</strong>
                    </div>
                    {selectedProposal.sender_email && (
                      <div>
                        <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>EMAIL</span>
                        <a href={`mailto:${selectedProposal.sender_email}`} style={{ fontSize: '0.9rem', color: '#7F34E6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 650 }}>
                          <Mail size={14} /> {selectedProposal.sender_email}
                        </a>
                      </div>
                    )}
                    {selectedProposal.sender_phone && (
                      <div>
                        <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>TELEFONE / WHATSAPP</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <a href={`https://wa.me/55${selectedProposal.sender_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                            <Phone size={14} /> {formatPhone(selectedProposal.sender_phone)}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Box */}
                <div style={{
                  padding: '20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px'
                }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                    Imóvel de Interesse
                  </h3>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                    {selectedProposal.photo ? (
                      <img 
                        src={selectedProposal.photo} 
                        alt={selectedProposal.property_name} 
                        style={{ width: '70px', height: '52px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '70px', height: '52px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        🏠
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                        ID: #{selectedProposal.property_id} • {selectedProposal.tipo_nome}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedProposal.property_name}
                      </strong>
                    </div>
                  </div>
                  <Link 
                    href={`/imovel/${selectedProposal.property_id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#7F34E6',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    Ver anúncio completo <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

              {/* Visit & Card Scheduling Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
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

              {/* Proposal or Message details */}
              <div style={{
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                backgroundColor: '#f8fafc'
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                  Detalhes do Atendimento
                </h3>
                
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 700 }}>MENSAGEM / CONDIÇÕES DO CLIENTE</span>
                  <p style={{ fontSize: '0.925rem', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.6, backgroundColor: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    {selectedProposal.mensagem || selectedProposal.condicoes || 'Nenhuma mensagem adicional.'}
                  </p>
                </div>
              </div>

              {/* Internal Notes / Anotações Internas */}
              <div style={{
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '16px'
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                  Anotações Internas (Uso Exclusivo do Corretor)
                </h3>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Escreva notas internas aqui... (ex: 'Cliente agendou visita para sábado', 'Aguardando retorno sobre financiamento', etc.)"
                  style={{
                    width: '100%',
                    height: '110px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    fontSize: '0.9rem',
                    color: '#334155',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  disabled={updatingId !== null}
                  onClick={async () => {
                    await handleUpdateNotes(selectedProposal.proposal_id, modalNotes);
                    setSelectedProposal((prev: any) => prev ? { ...prev, anotacoes_internas: modalNotes } : null);
                  }}
                  style={{
                    backgroundColor: '#7F34E6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '10px',
                    float: 'right',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7F34E6'}
                >
                  Salvar Anotações
                </button>
                <div style={{ clear: 'both' }}></div>
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

      <style jsx global>{`
        .negocios-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          margin-top: 8px;
        }
        .negocios-sidebar {
          display: flex;
          flex-direction: column;
        }
        .negocios-mobile-tabs {
          display: none;
        }
        .sidebar-btn:hover {
          background-color: rgba(127, 52, 230, 0.04) !important;
          color: #7F34E6 !important;
        }
        .sidebar-btn-cad:hover {
          background-color: rgba(16, 185, 129, 0.04) !important;
          color: #10b981 !important;
        }
        
        .pulse-dot {
          animation: pulse 2s infinite;
          transform-origin: center;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 992px) {
          .cadastro-grid {
            display: grid !important;
            grid-template-columns: 1fr 360px !important;
            gap: 32px !important;
          }
          .cadastro-preview-sidebar {
            display: block !important;
          }
        }

        @media (max-width: 991px) {
          .cadastro-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 24px !important;
          }
          .cadastro-preview-sidebar {
            display: none !important;
          }
        }

        @media (max-width: 900px) {
          .negocios-container {
            grid-template-columns: 240px 1fr;
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .negocios-container {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 24px;
          }
          .negocios-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 280px !important;
            height: 100vh !important;
            z-index: 1000 !important;
            background-color: white !important;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15) !important;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            display: flex !important;
          }
          .negocios-sidebar.open {
            transform: translateX(0) !important;
          }
          .negocios-sidebar > div {
            height: 100% !important;
            overflow-y: auto !important;
            border-radius: 0px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .mobile-menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 999;
            animation: fadeIn 0.2s ease-out;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
          .desktop-sidebar-toggle {
            display: none !important;
          }
          .mobile-sidebar-close {
            display: flex !important;
          }
          .support-header-card {
            padding: 16px 20px !important;
          }
          .support-header-title {
            font-size: 1.2rem !important;
          }
          .support-table-card {
            padding: 16px !important;
            border-radius: 16px !important;
          }
          .support-form-card, .wizard-form-card {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          table th, table td {
            padding: 8px 10px !important;
            font-size: 0.825rem !important;
          }
          .negocios-title {
            font-size: 1.75rem !important;
          }
        }

        @media (max-width: 580px) {
          .mobile-one-col {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 480px) {
          main > div {
            padding: 0 12px !important;
          }
        }
        .swal2-container {
          z-index: 999999 !important;
        }
      `}</style>
    </>
  );
}
