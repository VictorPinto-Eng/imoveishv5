'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Loader2, Eye, EyeOff, User, Phone, Mail, Lock, Check, AlertCircle } from 'lucide-react'
import styles from './loginModal.module.css'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

type ViewMode = 'login' | 'signup'

const countries = [
    { name: 'Afeganistão', code: '+93', flag: '🇦🇫' },
    { name: 'Albânia', code: '+355', flag: '🇦🇱' },
    { name: 'Argélia', code: '+213', flag: '🇩🇿' },
    { name: 'Andorra', code: '+376', flag: '🇦🇩' },
    { name: 'Angola', code: '+244', flag: '🇦🇴' },
    { name: 'Antígua e Barbuda', code: '+1-268', flag: '🇦🇬' },
    { name: 'Argentina', code: '+54', flag: '🇦🇷' },
    { name: 'Armênia', code: '+374', flag: '🇦🇲' },
    { name: 'Austrália', code: '+61', flag: '🇦🇺' },
    { name: 'Áustria', code: '+43', flag: '🇦🇹' },
    { name: 'Azerbaijão', code: '+994', flag: '🇦🇿' },
    { name: 'Bahamas', code: '+1-242', flag: '🇧🇸' },
    { name: 'Bahrein', code: '+973', flag: '🇧🇭' },
    { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
    { name: 'Barbados', code: '+1-246', flag: '🇧🇧' },
    { name: 'Bielorrússia', code: '+375', flag: '🇧🇾' },
    { name: 'Bélgica', code: '+32', flag: '🇧🇪' },
    { name: 'Belize', code: '+501', flag: '🇧🇿' },
    { name: 'Benim', code: '+229', flag: '🇧🇯' },
    { name: 'Bermudas', code: '+1-441', flag: '🇧🇲' },
    { name: 'Butão', code: '+975', flag: '🇧🇹' },
    { name: 'Bolívia', code: '+591', flag: '🇧🇴' },
    { name: 'Bósnia e Herzegovina', code: '+387', flag: '🇧🇦' },
    { name: 'Botsuana', code: '+267', flag: '🇧🇼' },
    { name: 'Brasil', code: '+55', flag: '🇧🇷' },
    { name: 'Brunei', code: '+673', flag: '🇧🇳' },
    { name: 'Bulgária', code: '+359', flag: '🇧🇬' },
    { name: 'Burquina Faso', code: '+226', flag: '🇧🇫' },
    { name: 'Burundi', code: '+257', flag: '🇧🇮' },
    { name: 'Camboja', code: '+855', flag: '🇰🇭' },
    { name: 'Camarões', code: '+237', flag: '🇨🇲' },
    { name: 'Canadá', code: '+1', flag: '🇨🇦' },
    { name: 'Cabo Verde', code: '+238', flag: '🇨🇻' },
    { name: 'Ilhas Cayman', code: '+1-345', flag: '🇰🇾' },
    { name: 'República Centro-Africana', code: '+236', flag: '🇨🇫' },
    { name: 'Chade', code: '+235', flag: '🇹🇩' },
    { name: 'Chile', code: '+56', flag: '🇨🇱' },
    { name: 'China', code: '+86', flag: '🇨🇳' },
    { name: 'Colômbia', code: '+57', flag: '🇨🇴' },
    { name: 'Comores', code: '+269', flag: '🇰🇲' },
    { name: 'Congo-Brazzaville', code: '+242', flag: '🇨🇬' },
    { name: 'Congo-Kinshasa', code: '+243', flag: '🇨🇩' },
    { name: 'Ilhas Cook', code: '+682', flag: '🇨🇰' },
    { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
    { name: 'Croácia', code: '+385', flag: '🇭🇷' },
    { name: 'Cuba', code: '+53', flag: '🇨🇺' },
    { name: 'Chipre', code: '+357', flag: '🇨🇾' },
    { name: 'República Checa', code: '+420', flag: '🇨🇿' },
    { name: 'Dinamarca', code: '+45', flag: '🇩🇰' },
    { name: 'Djibuti', code: '+253', flag: '🇩🇯' },
    { name: 'Dominica', code: '+1-767', flag: '🇩🇲' },
    { name: 'República Dominicana', code: '+1-809', flag: '🇩🇴' },
    { name: 'Equador', code: '+593', flag: '🇪🇨' },
    { name: 'Egito', code: '+20', flag: '🇪🇬' },
    { name: 'El Salvador', code: '+503', flag: '🇸🇻' },
    { name: 'Guiné Equatorial', code: '+240', flag: '🇬🇶' },
    { name: 'Eritreia', code: '+291', flag: '🇪🇷' },
    { name: 'Estônia', code: '+372', flag: '🇪🇪' },
    { name: 'Etiópia', code: '+251', flag: '🇪🇹' },
    { name: 'Fiji', code: '+679', flag: '🇫🇯' },
    { name: 'Finlândia', code: '+358', flag: '🇫🇮' },
    { name: 'França', code: '+33', flag: '🇫🇷' },
    { name: 'Gabão', code: '+241', flag: '🇬🇦' },
    { name: 'Gâmbia', code: '+220', flag: '🇬🇲' },
    { name: 'Geórgia', code: '+995', flag: '🇬🇪' },
    { name: 'Alemanha', code: '+49', flag: '🇩🇪' },
    { name: 'Gana', code: '+233', flag: '🇬🇭' },
    { name: 'Grécia', code: '+30', flag: '🇬🇷' },
    { name: 'Groenlândia', code: '+299', flag: '🇬🇱' },
    { name: 'Granada', code: '+1-473', flag: '🇬🇩' },
    { name: 'Guatemala', code: '+502', flag: '🇬🇹' },
    { name: 'Guiné', code: '+224', flag: '🇬🇳' },
    { name: 'Guiné-Bissau', code: '+245', flag: '🇬🇼' },
    { name: 'Guiana', code: '+592', flag: '🇬🇾' },
    { name: 'Haiti', code: '+509', flag: '🇭🇹' },
    { name: 'Honduras', code: '+504', flag: '🇭🇳' },
    { name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
    { name: 'Hungria', code: '+36', flag: '🇭🇺' },
    { name: 'Islândia', code: '+354', flag: '🇮🇸' },
    { name: 'Índia', code: '+91', flag: '🇮🇳' },
    { name: 'Indonésia', code: '+62', flag: '🇮🇩' },
    { name: 'Irão', code: '+98', flag: '🇮🇷' },
    { name: 'Iraque', code: '+964', flag: '🇮🇶' },
    { name: 'Irlanda', code: '+353', flag: '🇮🇪' },
    { name: 'Israel', code: '+972', flag: '🇮🇱' },
    { name: 'Itália', code: '+39', flag: '🇮🇹' },
    { name: 'Costa do Marfim', code: '+225', flag: '🇨🇮' },
    { name: 'Jamaica', code: '+1-876', flag: '🇯🇲' },
    { name: 'Japão', code: '+81', flag: '🇯🇵' },
    { name: 'Jordânia', code: '+962', flag: '🇯🇴' },
    { name: 'Cazaquistão', code: '+7', flag: '🇰🇿' },
    { name: 'Quénia', code: '+254', flag: '🇰🇪' },
    { name: 'Quirguistão', code: '+996', flag: '🇰🇬' },
    { name: 'Laos', code: '+856', flag: '🇱🇦' },
    { name: 'Letônia', code: '+371', flag: '🇱🇻' },
    { name: 'Líbano', code: '+961', flag: '🇱🇧' },
    { name: 'Lesoto', code: '+266', flag: '🇱🇸' },
    { name: 'Libéria', code: '+231', flag: '🇱🇷' },
    { name: 'Líbia', code: '+218', flag: '🇱🇾' },
    { name: 'Liechtenstein', code: '+423', flag: '🇱🇮' },
    { name: 'Lituânia', code: '+370', flag: '🇱🇹' },
    { name: 'Luxemburgo', code: '+352', flag: '🇱🇺' },
    { name: 'Macau', code: '+853', flag: '🇲🇴' },
    { name: 'Macedônia do Norte', code: '+389', flag: '🇲🇰' },
    { name: 'Madagascar', code: '+261', flag: '🇲🇬' },
    { name: 'Malawi', code: '+265', flag: '🇲🇼' },
    { name: 'Malásia', code: '+60', flag: '🇲🇾' },
    { name: 'Maldivas', code: '+960', flag: '🇲🇻' },
    { name: 'Mali', code: '+223', flag: '🇲🇱' },
    { name: 'Malta', code: '+356', flag: '🇲🇹' },
    { name: 'Ilhas Marshall', code: '+692', flag: '🇲🇭' },
    { name: 'Mauritânia', code: '+222', flag: '🇲🇷' },
    { name: 'Maurícia', code: '+230', flag: '🇲🇺' },
    { name: 'México', code: '+52', flag: '🇲🇽' },
    { name: 'Micronésia', code: '+691', flag: '🇫🇲' },
    { name: 'Moldávia', code: '+373', flag: '🇲🇩' },
    { name: 'Mónaco', code: '+377', flag: '🇲🇨' },
    { name: 'Mongólia', code: '+976', flag: '🇲🇳' },
    { name: 'Montenegro', code: '+382', flag: '🇲🇪' },
    { name: 'Marrocos', code: '+212', flag: '🇲🇦' },
    { name: 'Moçambique', code: '+258', flag: '🇲🇿' },
    { name: 'Mianmar', code: '+95', flag: '🇲🇲' },
    { name: 'Namíbia', code: '+264', flag: '🇳🇦' },
    { name: 'Nauru', code: '+674', flag: '🇳🇷' },
    { name: 'Nepal', code: '+977', flag: '🇳🇵' },
    { name: 'Países Baixos', code: '+31', flag: '🇳🇱' },
    { name: 'Nova Zelândia', code: '+64', flag: '🇳🇿' },
    { name: 'Nicarágua', code: '+505', flag: '🇳🇮' },
    { name: 'Níger', code: '+227', flag: '🇳🇪' },
    { name: 'Nigéria', code: '+234', flag: '🇳🇬' },
    { name: 'Coreia do Norte', code: '+850', flag: '🇰🇵' },
    { name: 'Noruega', code: '+47', flag: '🇳🇴' },
    { name: 'Omã', code: '+968', flag: '🇴🇲' },
    { name: 'Paquistão', code: '+92', flag: '🇵🇰' },
    { name: 'Palau', code: '+680', flag: '🇵🇼' },
    { name: 'Palestina', code: '+970', flag: '🇵🇸' },
    { name: 'Panamá', code: '+507', flag: '🇵🇦' },
    { name: 'Papua-Nova Guiné', code: '+675', flag: '🇵🇬' },
    { name: 'Paraguai', code: '+595', flag: '🇵🇾' },
    { name: 'Peru', code: '+51', flag: '🇵🇪' },
    { name: 'Filipinas', code: '+63', flag: '🇵🇭' },
    { name: 'Polônia', code: '+48', flag: '🇵🇱' },
    { name: 'Portugal', code: '+351', flag: '🇵🇹' },
    { name: 'Porto Rico', code: '+1-787', flag: '🇵🇷' },
    { name: 'Catar', code: '+974', flag: '🇶🇦' },
    { name: 'Romênia', code: '+40', flag: '🇷🇴' },
    { name: 'Rússia', code: '+7', flag: '🇷🇺' },
    { name: 'Ruanda', code: '+250', flag: '🇷🇼' },
    { name: 'São Cristóvão e Neves', code: '+1-869', flag: '🇰🇳' },
    { name: 'Santa Lúcia', code: '+1-758', flag: '🇱🇨' },
    { name: 'São Vicente e Granadinas', code: '+1-784', flag: '🇻🇨' },
    { name: 'Samoa', code: '+685', flag: '🇼🇸' },
    { name: 'San Marino', code: '+378', flag: '🇸🇲' },
    { name: 'São Tomé e Príncipe', code: '+239', flag: '🇸🇹' },
    { name: 'Arábia Saudita', code: '+966', flag: '🇸🇦' },
    { name: 'Senegal', code: '+221', flag: '🇸🇳' },
    { name: 'Sérvia', code: '+381', flag: '🇷🇸' },
    { name: 'Seicheles', code: '+248', flag: '🇸🇨' },
    { name: 'Serra Leoa', code: '+232', flag: '🇸🇱' },
    { name: 'Singapura', code: '+65', flag: '🇸🇬' },
    { name: 'Eslováquia', code: '+421', flag: '🇸🇰' },
    { name: 'Eslovênia', code: '+386', flag: '🇸🇮' },
    { name: 'Ilhas Salomão', code: '+677', flag: '🇸🇧' },
    { name: 'Somália', code: '+252', flag: '🇸🇴' },
    { name: 'África do Sul', code: '+27', flag: '🇿🇦' },
    { name: 'Coreia do Sul', code: '+82', flag: '🇰🇷' },
    { name: 'Sudão do Sul', code: '+211', flag: '🇸🇸' },
    { name: 'Espanha', code: '+34', flag: '🇪🇸' },
    { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
    { name: 'Sudão', code: '+249', flag: '🇸🇩' },
    { name: 'Suriname', code: '+597', flag: '🇸🇷' },
    { name: 'Suécia', code: '+46', flag: '🇸🇪' },
    { name: 'Suíça', code: '+41', flag: '🇨🇭' },
    { name: 'Síria', code: '+963', flag: '🇸🇾' },
    { name: 'Taiwan', code: '+886', flag: '🇹🇼' },
    { name: 'Tajiquistão', code: '+992', flag: '🇹🇯' },
    { name: 'Tanzânia', code: '+255', flag: '🇹🇿' },
    { name: 'Tailândia', code: '+66', flag: '🇹🇭' },
    { name: 'Timor-Leste', code: '+670', flag: '🇹🇱' },
    { name: 'Togo', code: '+228', flag: '🇹🇬' },
    { name: 'Tonga', code: '+676', flag: '🇹🇴' },
    { name: 'Trindade e Tobago', code: '+1-868', flag: '🇹🇹' },
    { name: 'Tunísia', code: '+216', flag: '🇹🇳' },
    { name: 'Turquia', code: '+90', flag: '🇹🇷' },
    { name: 'Turcomenistão', code: '+993', flag: '🇹🇲' },
    { name: 'Tuvalu', code: '+688', flag: '🇹🇻' },
    { name: 'Uganda', code: '+256', flag: '🇺🇬' },
    { name: 'Ucrânia', code: '+380', flag: '🇺🇦' },
    { name: 'Emirados Árabes Unidos', code: '+971', flag: '🇦🇪' },
    { name: 'Reino Unido', code: '+44', flag: '🇬🇧' },
    { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
    { name: 'Uruguai', code: '+598', flag: '🇺🇾' },
    { name: 'Uzbequistão', code: '+998', flag: '🇺🇿' },
    { name: 'Vanuatu', code: '+678', flag: '🇻🇺' },
    { name: 'Cidade do Vaticano', code: '+39-06', flag: '🇻🇦' },
    { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
    { name: 'Vietnã', code: '+84', flag: '🇻🇳' },
    { name: 'Iêmen', code: '+967', flag: '🇾🇪' },
    { name: 'Zâmbia', code: '+260', flag: '🇿🇲' },
    { name: 'Zimbábue', code: '+263', flag: '🇿🇼' }
]

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [emailExistsError, setEmailExistsError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [needsActivation, setNeedsActivation] = useState(false)
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    })

    const checkPasswordStrength = (pass: string) => {
        setPasswordRequirements({
            length: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass)
        })
    }
    const [showCountryPicker, setShowCountryPicker] = useState(false)
    const [countrySearch, setCountrySearch] = useState('')

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        social_name: '',
        phone: '',
        country_code: '+55',
        email: '',
        password: '',
        confirmPassword: '',
        idTipoUsuario: 2, // 1: Corretor, 2: Proprietário (Padrão)
    })

    useEffect(() => {
        if (viewMode === 'signup') {
            checkPasswordStrength(formData.password);
        }
    }, [formData.password, viewMode]);

    // Refs for focus management
    const nameRef = useRef<HTMLInputElement>(null)
    const socialNameRef = useRef<HTMLInputElement>(null)
    const phoneRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)

    // Initial focus when modal opens or mode changes
    useEffect(() => {
        if (isOpen) {
            // Pequeno delay para garantir que o modal terminou a transição de entrada
            const timer = setTimeout(() => {
                if (viewMode === 'signup') {
                    nameRef.current?.focus()
                } else {
                    emailRef.current?.focus()
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen, viewMode])

    if (!isOpen) return null

    const toggleMode = () => {
        setViewMode(viewMode === 'login' ? 'signup' : 'login')
        setError(null)
        setSuccess(null)
        setNeedsActivation(false)
        setEmailExistsError(null)
        setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
        }))
        setPasswordRequirements({
            length: false,
            upper: false,
            lower: false,
            number: false,
            special: false
        })
        // Focus email after switching mode
        setTimeout(() => emailRef.current?.focus(), 50)
    }

    const handleKeyDown = (e: React.KeyboardEvent, nextField?: React.RefObject<HTMLInputElement | null>) => {
        if (e.key === 'Enter') {
            if (nextField && nextField.current) {
                e.preventDefault()
                nextField.current.focus()
            }
            // Se não houver nextField, o comportamento padrão (submit) ocorre
        }
    }
    const formatPhone = (value: string) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 3) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
        }
        return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData({ ...formData, [name]: value })
        setError(null)
        setNeedsActivation(false)
        
        // Limpa erro específico de e-mail ao digitar
        if (name === 'email') {
            setEmailExistsError(null);
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = formatPhone(e.target.value);
        setFormData({ ...formData, phone: value });
        setError(null);
    }

    const selectCountry = (country: typeof countries[0]) => {
        setFormData({ ...formData, country_code: country.code });
        setShowCountryPicker(false);
        setCountrySearch('');
    }

    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.code.includes(countrySearch)
    );

    const handleEmailBlur = async () => {
        if (!formData.email) {
            setEmailExistsError(null);
            return;
        }
        if (viewMode !== 'signup') return;
        
        // Validação básica de formato antes de chamar a API
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) return;

        try {
            const res = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            
            if (data.exists) {
                if (data.verified) {
                    setEmailExistsError('Este e-mail já está cadastrado.');
                } else {
                    setEmailExistsError('Este e-mail já está cadastrado, mas ainda não foi ativado.');
                    setNeedsActivation(true);
                }
            } else {
                setEmailExistsError(null);
            }
        } catch (err) {
            console.error('Error checking email:', err);
        }
    };

    const handleUserTypeChange = (id: number) => {
        setFormData({ ...formData, idTipoUsuario: id })
    }

    const handleResendEmail = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(data.message)
            setNeedsActivation(false)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        if (viewMode === 'signup') {
            const allMet = Object.values(passwordRequirements).every(v => v);
            if (!allMet) {
                setError('A senha deve atender a todos os requisitos de segurança.');
                setLoading(false);
                return;
            }
        }

        if (viewMode === 'signup') {
            const pass = passwordRef.current?.value || '';
            const confirmPass = confirmPasswordRef.current?.value || '';
            
            if (pass.trim() !== confirmPass.trim()) {
                setError('As senhas não coincidem.')
                setLoading(false)
                return
            }

            // Garante que o formData enviado tenha os valores exatos dos refs
            formData.password = pass;
            formData.confirmPassword = confirmPass;
        }

        const endpoint = viewMode === 'login' ? '/api/auth/login' : '/api/auth/register'

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                // Se não for JSON, provavelmente é um erro do Gateway (HTML)
                throw new Error('O servidor demorou muito para responder ou ocorreu um erro interno. Por favor, tente novamente em instantes.');
            }

            if (!res.ok) {
                if (data.needsActivation) {
                    setNeedsActivation(true)
                }
                throw new Error(data.error || 'Erro ao processar solicitação')
            }

            if (viewMode === 'signup') {
                setSuccess('Conta criada com sucesso! Faça login para continuar.')
                setViewMode('login')
            } else {
                // Login successful
                window.location.reload() // Or handle state globally
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const redirectUri = `${window.location.origin}/api/auth/callback/google`
        const scope = 'email profile'
        const responseType = 'code'
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
        
        window.location.href = authUrl
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                    <X size={24} />
                </button>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <Image
                            src="/logo_hv5_v3.png"
                            alt="HV5 Logo"
                            width={320}
                            height={130}
                            className={styles.logoImage}
                            priority
                        />
                    </div>

                    <h2 className={styles.title} style={{ textAlign: 'center', marginTop: '0' }}>
                        {viewMode === 'login' ? 'Acesse ou crie sua conta' : 'Crie sua conta ou faça o login'}
                    </h2>

                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {success && <div className={styles.successMessage}>{success}</div>}

                    {needsActivation && (
                        <div className={styles.resendContainer}>
                            <button 
                                type="button" 
                                className={styles.resendLink} 
                                onClick={handleResendEmail}
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Clique aqui para reenviar o e-mail de ativação'}
                            </button>
                        </div>
                    )}

                    {/* 
                    <button className={styles.googleButton} type="button" onClick={handleGoogleLogin}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.googleIcon}>
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.86-2.59 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span>{viewMode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}</span>
                    </button>

                    <div className={styles.divider}>
                        <span>ou</span>
                    </div> 
                    */}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {viewMode === 'signup' && (
                            <>
                                <p className={styles.formNote}>Todos os campos são obrigatórios para finalizar o seu cadastro.</p>
                                
                                <label className={styles.fieldLabel}>Você é:</label>
                                <div className={styles.userTypeSelector}>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 2 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(2)}
                                    >
                                        Proprietário(a)
                                    </button>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 1 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(1)}
                                    >
                                        Corretor(a) / Imobiliária
                                    </button>
                                </div>
                            </>
                        )}
                        <div className={styles.formGroup}>
                            {viewMode === 'signup' && (
                                <>
                                    <div className={styles.inputWrapper}>
                                        <input 
                                            ref={nameRef}
                                            type="text" 
                                            name="name"
                                            placeholder="Digite seu nome completo" 
                                            className={styles.input} 
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, socialNameRef)}
                                        />
                                        <User className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <input 
                                            ref={socialNameRef}
                                            type="text" 
                                            name="social_name"
                                            placeholder="Nome social (como prefere ser chamado)" 
                                            className={styles.input} 
                                            value={formData.social_name}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                                        />
                                        <User className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <button 
                                            type="button"
                                            onClick={() => setShowCountryPicker(!showCountryPicker)}
                                            style={{ 
                                                position: 'absolute', 
                                                left: '3rem', 
                                                height: '100%', 
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                border: 'none',
                                                borderRight: '1px solid #cbd5e1',
                                                background: 'none',
                                                fontSize: '0.9rem',
                                                color: '#1e293b',
                                                fontWeight: 600,
                                                zIndex: 11,
                                                cursor: 'pointer',
                                                padding: '0 0.5rem',
                                                minWidth: '4.5rem'
                                            }}
                                        >
                                            <span>{countries.find(c => c.code === formData.country_code)?.flag || '🇧🇷'}</span>
                                            <span>{formData.country_code}</span>
                                        </button>

                                        {showCountryPicker && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: '3rem',
                                                width: '200px',
                                                maxHeight: '250px',
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                                zIndex: 100,
                                                marginTop: '5px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                <input 
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Buscar país..."
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    style={{
                                                        padding: '10px',
                                                        border: 'none',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        outline: 'none',
                                                        fontSize: '0.85rem',
                                                        width: '100%'
                                                    }}
                                                />
                                                <div style={{ overflowY: 'auto' }}>
                                                    {filteredCountries.map((c, i) => (
                                                        <div 
                                                            key={i}
                                                            onClick={() => selectCountry(c)}
                                                            style={{
                                                                padding: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <span>{c.flag}</span>
                                                            <span style={{ flex: 1 }}>{c.name}</span>
                                                            <span style={{ color: '#64748b' }}>{c.code}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <input 
                                            ref={phoneRef}
                                            type="tel" 
                                            name="phone"
                                            placeholder="(00) 00000-0000" 
                                            className={styles.input} 
                                            style={{ paddingLeft: '8.5rem' }}
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            onKeyDown={(e) => handleKeyDown(e, emailRef)}
                                        />
                                        <Phone className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    </div>
                                </>
                            )}
                            <div className={styles.inputWrapper}>
                                <input 
                                    ref={emailRef}
                                    type="email" 
                                    name="email"
                                    placeholder={viewMode === 'login' ? "E-mail cadastrado" : "Digite seu e-mail"} 
                                    className={`${styles.input} ${emailExistsError ? styles.inputError : ''}`} 
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleEmailBlur}
                                    onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                                />
                                <Mail className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                {emailExistsError && (
                                    <span style={{ 
                                        color: '#ef4444', 
                                        fontSize: '0.75rem', 
                                        marginTop: '4px', 
                                        display: 'block',
                                        marginLeft: '3rem',
                                        fontWeight: '500'
                                    }}>
                                        {emailExistsError}
                                    </span>
                                )}
                            </div>
                            <div className={styles.inputWrapper}>
                                <input 
                                    ref={passwordRef}
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    placeholder={viewMode === 'login' ? "Senha cadastrada" : "Crie uma senha"} 
                                    className={styles.input} 
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyDown={(e) => viewMode === 'signup' ? handleKeyDown(e, confirmPasswordRef) : undefined}
                                />
                                <Lock className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                <button 
                                    type="button" 
                                    className={styles.eyeButton} 
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {viewMode === 'signup' && (
                                <div className={styles.passwordStrengthContainer}>
                                    <div className={styles.strengthBarWrapper}>
                                        {[1, 2, 3, 4, 5].map((s) => {
                                            const metCount = Object.values(passwordRequirements).filter(v => v).length;
                                            const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#facc15', '#10b981', '#059669'];
                                            const activeColor = metCount >= s ? colors[metCount] : '#e2e8f0';
                                            return (
                                                <div 
                                                    key={s} 
                                                    className={styles.strengthSegment}
                                                    style={{ backgroundColor: activeColor }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className={styles.requirementsList}>
                                        <div className={`${styles.requirementItem} ${passwordRequirements.length ? styles.requirementMet : ''}`}>
                                            {passwordRequirements.length ? <Check size={12} /> : <AlertCircle size={12} />}
                                            <span>Mín. 8 caracteres</span>
                                        </div>
                                        <div className={`${styles.requirementItem} ${passwordRequirements.upper ? styles.requirementMet : ''}`}>
                                            {passwordRequirements.upper ? <Check size={12} /> : <AlertCircle size={12} />}
                                            <span>Letra maiúscula</span>
                                        </div>
                                        <div className={`${styles.requirementItem} ${passwordRequirements.lower ? styles.requirementMet : ''}`}>
                                            {passwordRequirements.lower ? <Check size={12} /> : <AlertCircle size={12} />}
                                            <span>Letra minúscula</span>
                                        </div>
                                        <div className={`${styles.requirementItem} ${passwordRequirements.number ? styles.requirementMet : ''}`}>
                                            {passwordRequirements.number ? <Check size={12} /> : <AlertCircle size={12} />}
                                            <span>Número</span>
                                        </div>
                                        <div className={`${styles.requirementItem} ${passwordRequirements.special ? styles.requirementMet : ''}`}>
                                            {passwordRequirements.special ? <Check size={12} /> : <AlertCircle size={12} />}
                                            <span>Caractere especial</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {viewMode === 'signup' && (
                                <div className={styles.inputWrapper}>
                                    <input 
                                        ref={confirmPasswordRef}
                                        type={showConfirmPassword ? "text" : "password"} 
                                        name="confirmPassword"
                                        placeholder="Confirme sua senha" 
                                        className={styles.input} 
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <Lock className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    <button 
                                        type="button" 
                                        className={styles.eyeButton} 
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button className={styles.loginButton} type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (viewMode === 'login' ? 'Entrar' : 'Criar sua conta')}
                        </button>
                    </form>

                    {viewMode === 'login' && (
                        <button className={styles.forgotPassword} type="button">
                            Esqueci a senha
                        </button>
                    )}

                    <div className={styles.registerContainer}>
                        <span>{viewMode === 'login' ? 'Não possui conta? ' : 'Já possui conta? '}</span>
                        <button className={styles.registerLink} onClick={toggleMode} type="button">
                            {viewMode === 'login' ? 'Cadastre-se aqui' : 'Faça o login aqui'}
                        </button>
                    </div>

                    <p className={styles.footerNote}>
                        Ao continuar você aceita os <a href="#">Termos de uso</a> e <a href="#">Política de privacidade</a>.
                    </p>
                </div>

                <div className={styles.modalFooter}>
                    <div className={styles.partnerLogos}>
                        <span className={styles.groupText}>soluções</span>
                        <Image src="/logo_hv5_v3.png" alt="HV5" width={40} height={20} className={styles.miniLogo} />
                    </div>
                </div>
            </div>
        </div>
    )
}
