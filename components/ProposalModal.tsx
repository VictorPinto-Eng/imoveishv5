'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, DollarSign, FileText, AlertCircle } from 'lucide-react';
import styles from './ProposalModal.module.css';
import Swal from 'sweetalert2';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | number;
  propertyTitle: string;
  propertyPrice: number;
  operationType: string; // Venda, Locação, etc.
}

export default function ProposalModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  propertyPrice,
  operationType
}: ProposalModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  const [proposedValue, setProposedValue] = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkAuth();
      setProposedValue(Number(propertyPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      setConditions('');
      setIsSuccess(false);
    }
  }, [isOpen, propertyPrice]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          setUser(data.user);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLoginClick = () => {
    onClose();
    setTimeout(() => {
      const loginBtn = document.querySelector('button[class*="loginButtonPill"]') as HTMLButtonElement;
      if (loginBtn) {
        loginBtn.click();
      }
    }, 150);
  };

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const numberValue = Number(cleanValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setProposedValue(formatCurrency(rawValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setIsSubmitting(true);

    const numericValue = Number(proposedValue.replace(/\D/g, '')) / 100;

    try {
      const res = await fetch('/api/user/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          valor: numericValue,
          condicoes: conditions,
          nome: user?.name,
          email: user?.email,
          telefone: user?.telefone || ''
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        // Track analytics
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_servico_id: Number(propertyId),
            event_name: 'proposal_submit',
            event_category: 'conversion',
            page_url: window.location.pathname
          })
        }).catch(err => console.error('[Analytics] Failed to track proposal submit:', err));
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Erro ao enviar proposta',
          text: errorData.error || 'Ocorreu um erro interno. Tente novamente mais tarde.',
          confirmButtonColor: '#7F34E6'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de Conexão',
        text: 'Não foi possível conectar ao servidor.',
        confirmButtonColor: '#7F34E6'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar modal">
          <X size={20} />
        </button>

        {isAuthenticated === null ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className={styles.authPrompt}>
            <AlertCircle size={48} className={styles.authIcon} />
            <h2>Faça login para continuar</h2>
            <p>Para enviar uma proposta de compra ou locação oficial, você precisa ter uma conta ativa no portal.</p>
            <button className={styles.loginButton} onClick={handleLoginClick}>
              Entrar ou Cadastrar-se
            </button>
            <button className={styles.cancelButton} onClick={onClose}>
              Voltar
            </button>
          </div>
        ) : isSuccess ? (
          <div className={styles.successState}>
            <CheckCircle2 size={64} className={styles.successIcon} />
            <h2>Proposta Enviada com Sucesso!</h2>
            <p>Sua proposta de {operationType.toLowerCase()} para o imóvel <strong>{propertyTitle}</strong> foi cadastrada.</p>
            <p className={styles.successSubtext}>
              O anunciante foi notificado e você pode acompanhar o status da proposta diretamente no seu painel.
            </p>
            <button className={styles.successCloseButton} onClick={onClose}>
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.header}>
              <span className={styles.tag}>Enviar Proposta de {operationType}</span>
              <h2 className={styles.title}>{propertyTitle}</h2>
              <p className={styles.subtitle}>ID do Imóvel: #{propertyId}</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="proposedValue" className={styles.label}>
                Valor Proposto
              </label>
              <div className={styles.inputWrapper}>
                <DollarSign size={20} className={styles.inputIcon} />
                <input
                  type="text"
                  id="proposedValue"
                  className={styles.input}
                  value={proposedValue}
                  onChange={handlePriceChange}
                  required
                />
              </div>
              <p className={styles.helperText}>
                Valor de referência anunciado: {Number(propertyPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{operationType.toLowerCase() === 'locação' ? ' /mês' : ''}
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="conditions" className={styles.label}>
                Condições de Pagamento e Observações
              </label>
              <div className={styles.textareaWrapper}>
                <FileText size={20} className={styles.textareaIcon} />
                <textarea
                  id="conditions"
                  className={styles.textarea}
                  placeholder="Ex: Entrada de 40% + 12 parcelas, ou financiamento pelo banco X..."
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Proposta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
