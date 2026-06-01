'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Loader2, Eye, EyeOff, User, Phone, Mail, Lock, Check, AlertCircle } from 'lucide-react'
import styles from './loginModal.module.css'
import Swal from 'sweetalert2'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

type ViewMode = 'login' | 'signup' | 'forgot-password'

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
    { name: 'Jamaica', code: '+1-876', flag: '🇯🇲' },
    { name: 'Japão', code: '+81', flag: '🇯🇵' },
    { name: 'Jordânia', code: '+962', flag: '🇯🇴' },
    { name: 'Cazaquistão', code: '+7', flag: '🇰🇿' },
    { name: 'Quênia', code: '+254', flag: '🇰🇪' },
    { name: 'Kiribati', code: '+686', flag: '🇰🇮' },
    { name: 'Coreia do Norte', code: '+850', flag: '🇰🇵' },
    { name: 'Coreia do Sul', code: '+82', flag: '🇰🇷' },
    { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
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
    { name: 'Catar', code: '+974', flag: '🇶🇦' },
    { name: 'Romênia', code: '+40', flag: '🇷🇴' },
    { name: 'Rússia', code: '+7', flag: '🇷🇺' },
    { name: 'Ruanda', code: '+250', flag: '🇷🇼' },
    { name: 'São Cristóvão e Névis', code: '+1-869', flag: '🇰🇳' },
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
    { name: 'Trinidad e Tobago', code: '+1-868', flag: '🇹🇹' },
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
    { name: 'Vaticano', code: '+39', flag: '🇻🇦' },
    { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
    { name: 'Vietnã', code: '+84', flag: '🇻🇳' },
    { name: 'Iémen', code: '+967', flag: '🇾🇪' },
    { name: 'Zâmbia', code: '+260', flag: '🇿🇲' },
    { name: 'Zimbábue', code: '+263', flag: '🇿🇼' }
]

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [needsActivation, setNeedsActivation] = useState(false)
    const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
    const [confirmEmailError, setConfirmEmailError] = useState<string | null>(null);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    });

    const [formData, setFormData] = useState({
        name: '',
        social_name: '',
        email: '',
        confirmEmail: '',
        password: '',
        confirmPassword: '',
        phone: '',
        country_code: '+55',
        idTipoUsuario: 1, // 1: Consumidor, 2: Corretor/Imobiliária, 3: Proprietário
        creci_numero: '',
        creci_tipo: 'F',
        creci_apoestado_id: '' as number | '',
        cpf_cnpj: '',
        data_nascimento: '',
    })

    const maskCpfCnpj = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 11) {
            return cleaned
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            return cleaned
                .substring(0, 14)
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
    };

    const [estados, setEstados] = useState<Array<{ id: number; nome: string; sigla: string }>>([])

    const nameRef = useRef<HTMLInputElement>(null)
    const socialNameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const confirmEmailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)
    const phoneRef = useRef<HTMLInputElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            // Fetch estados for CRECI when opening in signup mode
            if (viewMode === 'signup' && estados.length === 0) {
                fetch('/api/property/estados')
                    .then(r => r.ok ? r.json() : [])
                    .then(data => { if (Array.isArray(data)) setEstados(data); })
                    .catch(() => {});
            }
            // Focus email if in login mode, else focus name
            setTimeout(() => {
                if (viewMode === 'login' || viewMode === 'forgot-password') {
                    emailRef.current?.focus()
                } else {
                    nameRef.current?.focus()
                }
            }, 50)
        } else {
            document.body.style.overflow = 'unset'
            // Reset state when closing
            setSuccess(null)
            setError(null)
            setNeedsActivation(false)
            setEmailExistsError(null);
            setConfirmEmailError(null);
        }
    }, [isOpen, viewMode])

    useEffect(() => {
        if (viewMode === 'signup') {
            const pass = formData.password;
            setPasswordRequirements({
                length: pass.length >= 8,
                upper: /[A-Z]/.test(pass),
                lower: /[a-z]/.test(pass),
                number: /[0-9]/.test(pass),
                special: /[^A-Za-z0-9]/.test(pass)
            });
        }
    }, [formData.password, viewMode]);

    const toggleMode = () => {
        setViewMode(viewMode === 'login' ? 'signup' : 'login')
        setError(null)
        setSuccess(null)
        setNeedsActivation(false)
        setConfirmEmailError(null)
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
        setTimeout(() => {
            if (viewMode === 'login') {
                nameRef.current?.focus()
            } else {
                emailRef.current?.focus()
            }
        }, 50)
    }

    const handleForgotPasswordClick = () => {
        setViewMode('forgot-password')
        setError(null)
        setSuccess(null)
        setNeedsActivation(false)
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
        // Se tiver até 10 dígitos (ex: 8134215588), é telefone fixo: (81) 3421-5588
        if (phoneNumberLength <= 10) {
            return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
        }
        // Se tiver 11 ou mais dígitos, é celular: (81) 99952-9391
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
            if (formData.confirmEmail && value !== formData.confirmEmail) {
                setConfirmEmailError('Os e-mails não coincidem.');
            } else {
                setConfirmEmailError(null);
            }
        }
        if (name === 'confirmEmail') {
            if (formData.email && value !== formData.email) {
                setConfirmEmailError('Os e-mails não coincidem.');
            } else {
                setConfirmEmailError(null);
            }
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
        // Fetch estados if not loaded yet
        if (id === 2 && estados.length === 0) {
            fetch('/api/property/estados')
                .then(r => r.ok ? r.json() : [])
                .then(data => { if (Array.isArray(data)) setEstados(data); })
                .catch(() => {});
        }
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

            if (formData.email.trim().toLowerCase() !== formData.confirmEmail.trim().toLowerCase()) {
                setError('Os e-mails informados não coincidem.');
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

        const endpoint = viewMode === 'login' 
            ? '/api/auth/login' 
            : viewMode === 'signup' 
                ? '/api/auth/register'
                : '/api/auth/forgot-password'

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            // Check if response is JSON before parsing
            const contentType = res.headers.get('content-type')
            let data: any
            
            if (contentType && contentType.includes('application/json')) {
                data = await res.json()
            } else {
                // If not JSON, it's likely an HTML error page (404/500)
                const text = await res.text()
                const snippet = text.substring(0, 50).replace(/[<>]/g, '')
                console.error('Non-JSON response from API:', text.substring(0, 500))
                throw new Error(`Erro do Servidor: [${res.status}] ${snippet}... Tente novamente.`)
            }

            if (!res.ok) {
                if (data.needsActivation) {
                    setNeedsActivation(true)
                }
                throw new Error(data.error || 'Ocorreu um erro ao processar sua solicitação.')
            }

            if (viewMode === 'forgot-password') {
                setSuccess('Se o e-mail estiver cadastrado, você receberá instruções para recuperar sua senha.')
            } else if (viewMode === 'signup') {
                const emailCadastrado = formData.email;
                
                // Limpa os campos de senha/confirmação
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '', confirmEmail: '' }));
                setViewMode('login');

                // Fecha o modal antes de disparar o SweetAlert para evitar sobreposição
                onClose();

                // Dispara o alerta após o fechamento do modal
                setTimeout(async () => {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Cadastro realizado! 🎉',
                        html: `
                            <p style="margin:0 0 8px">${data.message || 'Conta criada com sucesso!'}</p>
                            <p style="font-size:0.875rem;color:#64748b">Verifique seu e-mail e clique no link de ativação antes de fazer login.</p>
                        `,
                        confirmButtonText: 'Ir para o login',
                        confirmButtonColor: '#7F34E6',
                        allowOutsideClick: false,
                    });

                    // Modifica o estado do formulário para preencher o e-mail no login
                    setFormData(prev => ({ ...prev, email: emailCadastrado }));
                    
                    // Como o modal foi fechado, e o usuário confirmou que quer ir para o login,
                    // nós podemos simular o clique para reabrir o modal já no modo login.
                    // Para isso, encontramos o botão "Entrar" no Header e clicamos nele.
                    const loginBtn = document.querySelector('button[class*="loginButtonPill"]') as HTMLButtonElement;
                    if (loginBtn) {
                        loginBtn.click();
                    }
                }, 150);

                setSuccess(null);
                setError(null);
            } else {
                setSuccess(data.message || 'Operação realizada com sucesso!')
                if (viewMode === 'login') {
                    // Recarrega a página após login bem-sucedido
                    window.location.reload()
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} ref={modalRef}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <Image
                            src="/logo_hv5_1024.png"
                            alt="HV5 Logo"
                            width={160}
                            height={60}
                            className={styles.logoImage} style={{ maxWidth: "110px", height: "auto" }}
                            priority
                        />
                    </div>

                    <h2 className={styles.title}>
                        {viewMode === 'login' ? 'Acesse ou crie sua conta' : 
                         viewMode === 'signup' ? 'Crie sua conta na HV5' : 'Recuperar sua senha'}
                    </h2>

                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {success && <div className={styles.successMessage}>{success}</div>}
                    
                    {needsActivation && (
                        <div className={styles.resendContainer}>
                            <p className={styles.formNote} style={{ color: '#7F34E6', fontWeight: '600' }}>
                                Seu cadastro ainda não foi ativado.
                            </p>
                            <button 
                                className={styles.resendLink} 
                                onClick={handleResendEmail}
                                disabled={loading}
                            >
                                Clique aqui para reenviar o e-mail de ativação
                            </button>
                        </div>
                    )}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {viewMode === 'signup' && (
                            <>
                                <p className={styles.formNote}>Todos os campos são obrigatórios para finalizar o seu cadastro.</p>
                                
                                <label className={styles.fieldLabel}>Você é:</label>
                                <div className={styles.userTypeSelector} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 1 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(1)}
                                    >
                                        Consumidor
                                    </button>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 3 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(3)}
                                    >
                                        Proprietário(a)
                                    </button>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 2 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(2)}
                                    >
                                        Corretor(a)
                                    </button>
                                </div>
                                
                                {/* CPF/CNPJ and Birth Date fields for Owner/Broker */}
                                {(formData.idTipoUsuario === 2 || formData.idTipoUsuario === 3) && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                                        <div className={styles.inputWrapper} style={{ flex: 1, marginBottom: 0 }}>
                                            <input
                                                type="text"
                                                placeholder={formData.idTipoUsuario === 3 ? "CPF ou CNPJ" : "CPF"}
                                                className={styles.input}
                                                style={{ height: '48px' }}
                                                value={formData.cpf_cnpj}
                                                onChange={e => setFormData(prev => ({ ...prev, cpf_cnpj: maskCpfCnpj(e.target.value) }))}
                                                required
                                            />
                                        </div>
                                        <div className={styles.inputWrapper} style={{ flex: 1, marginBottom: 0 }}>
                                            <input
                                                type="date"
                                                className={styles.input}
                                                style={{ height: '48px' }}
                                                value={formData.data_nascimento}
                                                onChange={e => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* CRECI fields — visible only when Corretor is selected */}
                                {formData.idTipoUsuario === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(127,52,230,0.06)', borderRadius: '10px', border: '1px solid rgba(127,52,230,0.2)', marginTop: '0.5rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#7F34E6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados do CRECI</p>

                                        <div className={styles.inputWrapper}>
                                            <input
                                                type="text"
                                                placeholder="Número do CRECI (ex: 12345)"
                                                className={styles.input}
                                                value={formData.creci_numero}
                                                onChange={e => setFormData(prev => ({ ...prev, creci_numero: e.target.value }))}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div className={styles.inputWrapper} style={{ flex: 1 }}>
                                                <select
                                                    className={styles.input}
                                                    style={{ height: '48px', padding: '0 0.75rem', backgroundColor: 'white', cursor: 'pointer' }}
                                                    value={formData.creci_apoestado_id}
                                                    onChange={e => setFormData(prev => ({ ...prev, creci_apoestado_id: e.target.value ? Number(e.target.value) : '' }))}
                                                >
                                                    <option value="">UF do CRECI</option>
                                                    {estados.map(est => (
                                                        <option key={est.id} value={est.id}>{est.sigla}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={styles.inputWrapper} style={{ flex: 1 }}>
                                                <select
                                                    className={styles.input}
                                                    style={{ height: '48px', padding: '0 0.75rem', backgroundColor: 'white', cursor: 'pointer' }}
                                                    value={formData.creci_tipo}
                                                    onChange={e => setFormData(prev => ({ ...prev, creci_tipo: e.target.value }))}
                                                >
                                                    <option value="F">Física (F)</option>
                                                    <option value="J">Jurídica (J)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                            ⚠️ Você poderá enviar o comprovante do CRECI após o cadastro, no seu perfil.
                                        </p>
                                    </div>
                                )}
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
                                            placeholder="Como gostaria de ser chamado(a)?" 
                                            className={styles.input} 
                                            value={formData.social_name}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                                        />
                                        <User className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <div 
                                            className={styles.countryPicker}
                                            onClick={() => setShowCountryPicker(!showCountryPicker)}
                                        >
                                            <span className={styles.countryFlag}>
                                                {countries.find(c => c.code === formData.country_code)?.flag}
                                            </span>
                                            <span className={styles.countryCode}>
                                                {formData.country_code}
                                            </span>
                                        </div>

                                        {showCountryPicker && (
                                            <div className={styles.countryDropdown}>
                                                <div className={styles.countrySearch}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Pesquisar país..." 
                                                        value={countrySearch}
                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div style={{ overflowY: 'auto' }}>
                                                    {filteredCountries.map((c, i) => (
                                                        <div 
                                                            key={i}
                                                            onClick={() => selectCountry(c)}
                                                            className={styles.countryOption}
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
                                    placeholder={viewMode === 'login' ? "E-mail cadastrado" : (viewMode === 'forgot-password' ? "Digite seu e-mail para recuperar" : "Digite seu e-mail")} 
                                    className={`${styles.input} ${emailExistsError ? styles.inputError : ''}`} 
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleEmailBlur}
                                    onKeyDown={(e) => {
                                        if (viewMode === 'signup') {
                                            handleKeyDown(e, confirmEmailRef);
                                        } else if (viewMode !== 'forgot-password') {
                                            handleKeyDown(e, passwordRef);
                                        }
                                    }}
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

                            {viewMode === 'signup' && (
                                <div className={styles.inputWrapper}>
                                    <input 
                                        ref={confirmEmailRef}
                                        type="email" 
                                        name="confirmEmail"
                                        placeholder="Confirme seu e-mail" 
                                        className={`${styles.input} ${confirmEmailError ? styles.inputError : ''}`} 
                                        required
                                        value={formData.confirmEmail}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                                    />
                                    <Mail className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    {confirmEmailError && (
                                        <span style={{ 
                                            color: '#ef4444', 
                                            fontSize: '0.75rem', 
                                            marginTop: '4px', 
                                            display: 'block',
                                            marginLeft: '3rem',
                                            fontWeight: '500'
                                        }}>
                                            {confirmEmailError}
                                        </span>
                                    )}
                                </div>
                            )}

                            {viewMode !== 'forgot-password' && (
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
                            )}

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
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (
                                viewMode === 'login' ? 'Entrar' : 
                                viewMode === 'signup' ? 'Criar sua conta' : 'Recuperar senha'
                            )}
                        </button>
                    </form>

                    {viewMode === 'login' && (
                        <button className={styles.forgotPassword} type="button" onClick={handleForgotPasswordClick}>
                            Esqueci a senha
                        </button>
                    )}

                    {viewMode === 'forgot-password' && (
                        <button className={styles.forgotPassword} type="button" onClick={() => setViewMode('login')}>
                            Voltar para o login
                        </button>
                    )}

                    {viewMode !== 'forgot-password' && (
                        <div className={styles.registerContainer}>
                            <span>{viewMode === 'login' ? 'Não possui conta? ' : 'Já possui conta? '}</span>
                            <button className={styles.registerLink} onClick={toggleMode} type="button">
                                {viewMode === 'login' ? 'Cadastre-se aqui' : 'Faça o login aqui'}
                            </button>
                        </div>
                    )}

                    <p className={styles.footerNote}>
                        Ao continuar você aceita os <a href="#">Termos de uso</a> e <a href="#">Política de privacidade</a>.
                    </p>
                </div>

                <div className={styles.modalFooter}>
                    <div className={styles.partnerLogos}>
                        <span className={styles.groupText}>soluções</span>
                        <Image src="/icone_5.png" alt="HV5" width={24} height={24} className={styles.miniLogo} />
                    </div>
                </div>
            </div>
        </div>
    )
}
