
import React, { useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AuthContext } from './App';
import { User, Page, Lead, Salesperson, LeadStatus, ConnectionTestResult, Database, LeadActivity, Role, Program, SalespersonWithStats } from './types.ts';
import { statusColors, leadStatuses, runConnectionTest, getSalesTeam, updateUserPassword, getPrograms } from './services.ts';
import { useToast } from './hooks/useToast.tsx';

// --- Icons ---
export const HomeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
export const UsersIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-3-5.197M15 21a9 9 0 00-3-6.572M15 21a9 9 0 00-3-6.572m-3 6.572A9 9 0 013 12a9 9 0 013-6.572m0 13.144A5.98 5.98 0 0112 15.25a5.98 5.98 0 013-2.572m0 0A5.98 5.98 0 0112 10.25a5.98 5.98 0 01-3 2.572" />
    </svg>
);
export const TeamIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
export const CalendarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
export const CogIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
export const BellIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
export const LogoutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
export const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
export const EditIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);
export const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
export const CakeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.248 4.22c.23-.44.833-.633 1.282-.415.45.218.653.81.423 1.25l-2.43 4.618a.5.5 0 00.444.727h6.146a.5.5 0 00.444-.727L12.08 5.055c-.23-.44-.027-1.032.423-1.25.45-.218 1.052-.025 1.282.415l2.668 5.065A2 2 0 0117 12.5V14a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.5a2 2 0 01.54-1.38l2.668-5.065zM10 1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);
export const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);
export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 21l-4.95-6.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const InfoCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const FileDownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
export const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);


// --- Layout Components ---

const NotificationBell: React.FC<{ count: number }> = ({ count }) => (
    <div className="relative">
        <BellIcon className="w-7 h-7 text-slate-500" />
        {count > 0 && (
            <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-white">
                {count}
            </span>
        )}
    </div>
);

export const Header: React.FC<{ user: User, onLogout: () => void, notificationCount: number }> = ({ user, onLogout, notificationCount }) => {
    return (
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-10 h-20 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center">
                <img src={user.avatar} alt="User Avatar" className="w-12 h-12 rounded-full mr-4 border-2 border-[var(--color-primary-light)]" />
                <div>
                    <p className="font-bold text-md text-slate-800">ยินดีต้อนรับ,</p>
                    <p className="text-sm text-slate-500">{user.name}</p>
                </div>
            </div>
            <div className="flex items-center space-x-5">
                {user.role === 'sales' && <NotificationBell count={notificationCount} />}
                <button onClick={onLogout} className="text-slate-500 hover:text-red-500 transition-colors">
                    <LogoutIcon className="w-7 h-7" />
                </button>
            </div>
        </header>
    );
};

export const BottomNav: React.FC<{ user: User, currentPage: Page, setCurrentPage: (page: Page) => void }> = ({ user, currentPage, setCurrentPage }) => {
    const adminNav = [
        { page: 'admin-dashboard', label: 'แดชบอร์ด', icon: HomeIcon },
        { page: 'leads', label: 'ลีด', icon: UsersIcon },
        { page: 'team', label: 'ทีม', icon: TeamIcon },
        { page: 'calendar', label: 'ปฏิทิน', icon: CalendarIcon },
        { page: 'settings', label: 'ตั้งค่า', icon: CogIcon }
    ];
    
    const salesNav = [
        { page: 'sales-dashboard', label: 'แดชบอร์ด', icon: HomeIcon },
        { page: 'leads', label: 'ลีดของฉัน', icon: UsersIcon },
        { page: 'calendar', label: 'ปฏิทิน', icon: CalendarIcon }
    ];
    
    // After Care sees similar view to sales but has different capabilities inside pages
    const navItems = user.role === 'admin' ? adminNav : salesNav;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className={`grid w-full max-w-lg mx-auto p-2 gap-2 ${navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-3'}`}>
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    const itemClasses = `flex flex-col items-center justify-center py-2 px-1 text-center transition-all duration-300 rounded-xl`;
                    const activeClasses = 'bg-gradient-to-br from-[var(--color-primary)] to-sky-600 text-white scale-105 shadow-lg ring-2 ring-sky-100';
                    const inactiveClasses = 'text-slate-500 hover:bg-slate-100 hover:text-slate-800';
                    return (
                        <button 
                            key={item.page}
                            onClick={() => setCurrentPage(item.page as Page)}
                            className={`${itemClasses} ${isActive ? activeClasses : inactiveClasses}`}
                        >
                            <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-white' : ''}`} />
                            <span className="text-[10px] font-bold tracking-wide truncate w-full">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    );
};

// --- UI Components ---
export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 md:p-6 ${className}`}>
        {children}
    </div>
);

export const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, change?: string, theme?: 'sky' | 'orange' | 'emerald' | 'violet' }> = ({ title, value, icon, change, theme }) => {
    const themeClasses = {
        sky: 'from-cyan-400 to-sky-500 text-white',
        orange: 'from-amber-400 to-orange-500 text-white',
        emerald: 'from-lime-400 to-emerald-500 text-white',
        violet: 'from-fuchsia-500 to-purple-600 text-white',
    };

    const baseCardClasses = 'flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1';
    
    // Add a slight brightness increase on hover for a subtle interactive effect
    const themedCardClasses = theme ? `bg-gradient-to-br ${themeClasses[theme]} hover:brightness-105` : '';

    const titleClasses = theme ? 'text-white/80' : 'text-slate-600';
    const iconClasses = theme ? 'text-white/70' : 'text-slate-400';
    const valueClasses = theme ? 'text-white' : 'text-slate-800';
    const changeClasses = theme ? 'text-white/90' : 'text-green-500';

    return (
        <Card className={`${baseCardClasses} ${themedCardClasses}`}>
            <div className="flex justify-between items-center">
                 <p className={`text-sm font-semibold ${titleClasses}`}>{title}</p>
                 <div className={iconClasses}>{icon}</div>
            </div>
            <div>
                <p className={`text-2xl font-bold mt-2 ${valueClasses}`}>{value}</p>
                {change && <p className={`text-sm ${changeClasses}`}>{change}</p>}
            </div>
        </Card>
    );
};

export const Button: React.FC<{ onClick?: () => void, children: React.ReactNode, className?: string, variant?: 'primary' | 'secondary' | 'danger', type?: 'button' | 'submit', disabled?: boolean }> = ({ onClick, children, className, variant = 'primary', type = 'button', disabled = false }) => {
    const baseClasses = "px-4 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";
    const variantClasses = {
        primary: 'bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-95 transform',
        secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95 transform',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95 transform',
    };
    return (
        <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, footer?: React.ReactNode, size?: 'md' | 'lg' }> = ({ isOpen, onClose, title, children, footer, size = 'lg' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg'
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} relative`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 text-2xl">&times;</button>
                </div>
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Spinner: React.FC<{}> = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
    </div>
);

// --- Form Components ---
type LeadFormData = Omit<Database['public']['Tables']['leads']['Insert'], 'id' | 'created_at' | 'received_date' | 'last_update_date'>;

export const LeadForm: React.FC<{ lead?: Lead | null, onSave: (leadData: LeadFormData, id?: number) => void, onCancel: () => void }> = ({ lead, onSave, onCancel }) => {
    const auth = useContext(AuthContext);
    const [salesTeam, setSalesTeam] = React.useState<Salesperson[]>([]);
    const [programs, setPrograms] = React.useState<Program[]>([]);

    React.useEffect(() => {
        if(auth?.user?.role === 'admin') {
            getSalesTeam().then(setSalesTeam);
        }
        getPrograms().then(setPrograms);
    }, [auth?.user?.role]);

    const [formData, setFormData] = useState<LeadFormData>({
        name: lead?.name || '',
        phone: lead?.phone || '',
        program: lead?.program || '',
        status: lead?.status || LeadStatus.New,
        assigned_to: lead?.assigned_to || (auth?.user?.role === 'admin' && salesTeam.length > 0 ? salesTeam[0].id : auth?.user?.id || null),
        birthday: lead?.birthday || null,
        address: lead?.address || '',
        value: lead?.value || 0,
        notes: lead?.notes || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            value: Number(formData.value)
        }, lead?.id);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" className="w-full p-2 border rounded-lg" required />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทร" className="w-full p-2 border rounded-lg" required />
            </div>
             <select name="program" value={formData.program ?? ''} onChange={handleChange} className="w-full p-2 border rounded-lg">
                <option value="">-- เลือกโปรแกรม --</option>
                {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="birthday" type="date" value={formData.birthday ?? ''} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                <input name="value" type="number" value={formData.value ?? ''} onChange={handleChange} placeholder="มูลค่า (บาท)" className="w-full p-2 border rounded-lg" />
            </div>
            <input name="address" value={formData.address ?? ''} onChange={handleChange} placeholder="ที่อยู่" className="w-full p-2 border rounded-lg" />
            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-lg">
                {leadStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            {auth?.user?.role === 'admin' && (
                 <select name="assigned_to" value={formData.assigned_to ?? ''} onChange={handleChange} className="w-full p-2 border rounded-lg">
                     {salesTeam.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                 </select>
            )}
             <textarea name="notes" value={formData.notes ?? ''} onChange={handleChange} placeholder="หมายเหตุ..." className="w-full p-2 border rounded-lg" rows={3}></textarea>
            <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={onCancel} variant="secondary">ยกเลิก</Button>
                <Button type="submit" variant="primary">บันทึก</Button>
            </div>
        </form>
    );
};

type SalespersonFormData = Omit<Salesperson, 'id' | 'avatar_url' | 'updated_at'>;

export const SalespersonForm: React.FC<{ salesperson?: Salesperson | null, onSave: (data: SalespersonFormData, id?: string) => void, onCancel: () => void, onChangePassword: (userId: string) => void }> = ({ salesperson, onSave, onCancel, onChangePassword }) => {
    const [formData, setFormData] = useState({
        full_name: salesperson?.full_name || '',
        email: salesperson?.email || '',
        role: salesperson?.role || 'sales',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, salesperson?.id);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="full_name" value={formData.full_name ?? ''} onChange={handleChange} placeholder="ชื่อ-นามสกุล" className="w-full p-2 border rounded-lg" required />
            <input name="email" type="email" value={formData.email ?? ''} onChange={handleChange} placeholder="อีเมล" className="w-full p-2 border rounded-lg" disabled={!!salesperson} />
             <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-lg">
                <option value="sales">Sales</option>
                <option value="after_care">After Care</option>
                <option value="admin">Admin</option>
            </select>
            <div className="flex justify-between items-center pt-4">
                {salesperson && (
                    <Button onClick={() => onChangePassword(salesperson.id)} variant="secondary" type="button" className="text-sm">
                        <LockClosedIcon className="mr-2"/>
                        เปลี่ยนรหัสผ่าน
                    </Button>
                )}
                 <div className="flex-grow"></div>
                <div className="flex space-x-2">
                    <Button onClick={onCancel} variant="secondary">ยกเลิก</Button>
                    <Button type="submit" variant="primary">บันทึก</Button>
                </div>
            </div>
        </form>
    );
};

export const AddUserForm: React.FC<{ onSave: (data: { fullName: string, email: string, password: string, role: Role }) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('sales');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }
        setError('');
        onSave({ fullName, email, password, role });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="ชื่อ-นามสกุล" className="w-full p-2 border rounded-lg" required />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="อีเมล" className="w-full p-2 border rounded-lg" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="รหัสผ่าน" className="w-full p-2 border rounded-lg" required />
            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full p-2 border rounded-lg">
                <option value="sales">ฝ่ายขาย (Sales)</option>
                <option value="after_care">บริการหลังการขาย (After Care)</option>
                <option value="admin">ผู้ดูแล (Admin)</option>
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={onCancel} variant="secondary" type="button">ยกเลิก</Button>
                <Button type="submit" variant="primary">สร้างผู้ใช้</Button>
            </div>
        </form>
    );
};

export const AppointmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    leadName: string;
    onSubmit: (date: string) => void;
}> = ({ isOpen, onClose, leadName, onSubmit }) => {
    const [serviceDate, setServiceDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(serviceDate);
        setServiceDate('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="ตั้งนัดหมาย (After Care)">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อลูกค้า</label>
                    <input
                        type="text"
                        value={leadName}
                        disabled
                        className="w-full p-2 border bg-slate-100 rounded-lg text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">วันที่รับบริการ</label>
                    <input
                        type="date"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        required
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-300"
                    />
                </div>
                <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded-md border border-blue-100">
                    <InfoCircleIcon className="w-4 h-4 inline-block mr-1 -mt-0.5"/>
                    ระบบจะสร้างนัดหมายติดตามผลให้อัตโนมัติ 5 รายการ (+1วัน, +1เดือน, +3เดือน, +6เดือน, +1ปี)
                </p>
                <div className="flex justify-end space-x-2 pt-2">
                    <Button onClick={onClose} variant="secondary" type="button">ยกเลิก</Button>
                    <Button type="submit" variant="primary">บันทึกการนัดหมาย</Button>
                </div>
            </form>
        </Modal>
    );
};


export const ChangePasswordForm: React.FC<{ onSave: (password: string) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }
        if (password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }
        setError('');
        onSave(password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">รหัสผ่านใหม่</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    required
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    required
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-2 pt-2">
                <Button onClick={onCancel} variant="secondary" type="button">ยกเลิก</Button>
                <Button type="submit" variant="primary">บันทึกรหัสผ่าน</Button>
            </div>
        </form>
    );
};

export const SalespersonPerformanceCard: React.FC<{ salesperson: SalespersonWithStats }> = ({ salesperson }) => {
    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-center mb-4">
                <img src={salesperson.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${salesperson.full_name}`} alt={salesperson.full_name || ''} className="w-16 h-16 rounded-full mr-4 border-4 border-slate-200" />
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{salesperson.full_name}</h3>
                    <p className="text-sm text-slate-500">{salesperson.email}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-grow content-start mt-auto">
                <div className="bg-sky-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-sky-700">ยอดขายรวม</p>
                    <p className="text-lg font-bold text-sky-900">฿{salesperson.totalSales.toLocaleString()}</p>
                </div>
                 <div className="bg-emerald-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-emerald-700">Conversion Rate</p>
                    <p className="text-lg font-bold text-emerald-900">{salesperson.conversionRate}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-slate-600">ลีดทั้งหมด</p>
                    <p className="text-lg font-bold text-slate-800">{salesperson.totalLeads}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-green-700">สำเร็จ</p>
                    <p className="text-lg font-bold text-green-900">{salesperson.wonLeads}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-red-700">ยกเลิก</p>
                    <p className="text-lg font-bold text-red-900">{salesperson.lostLeads}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <p className="text-xs font-semibold text-orange-700">ยังไม่ได้โทร</p>
                    <p className="text-lg font-bold text-orange-900">{salesperson.uncalledLeads}</p>
                </div>
            </div>
        </Card>
    );
};


// --- Chart Components ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200">
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-sm text-sky-600">{`ยอดขาย : ฿${payload[0].value.toLocaleString()}`}</p>
        <p className="text-sm text-orange-500">{`จำนวนลีด : ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};

export const SalesPerformanceChart: React.FC<{data: any[]}> = ({data}) => (
    <Card>
        <h3 className="font-bold mb-4 text-slate-700">Performance รายบุคคล</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#fb923c" stopOpacity={0.7}/>
                         <stop offset="95%" stopColor="#f97316" stopOpacity={0.7}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis tick={{fill: '#64748b', fontSize: 12}}/>
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(224, 242, 254, 0.5)'}} />
                <Legend />
                <Bar dataKey="sales" fill="url(#colorSales)" name="ยอดขาย" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" fill="url(#colorLeads)" name="จำนวนลีด" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </Card>
);

export const ConversionRatePieChart: React.FC<{data: any[]}> = ({data}) => {
    const COLORS = ['#22c55e', '#ef4444', '#a8a29e']; // green, red, stone
    return (
        <Card>
            <h3 className="font-bold mb-4 text-slate-700">Conversion Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent, value }) => `${name} (${value}) ${(percent * 100).toFixed(0)}%`}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    );
};

export const SalesTrendChart: React.FC<{data: any[]}> = ({data}) => (
    <Card>
        <h3 className="font-bold mb-4 text-slate-700">ยอดขายรายเดือน</h3>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}}/>
                <YAxis tick={{fill: '#64748b', fontSize: 12}}/>
                <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={3} name="ยอดขาย" dot={{ r: 5, fill: "var(--color-primary)" }} activeDot={{ r: 8, stroke: "var(--color-primary-light)" }}/>
            </LineChart>
        </ResponsiveContainer>
    </Card>
);

export const ConnectionTest: React.FC = () => {
    const [results, setResults] = useState<ConnectionTestResult[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const handleRunTest = async () => {
        setIsTesting(true);
        setResults([]);
        
        await runConnectionTest((result: ConnectionTestResult) => {
            setResults(prev => [...prev.filter(r => r.test !== result.test), result].sort((a, b) => a.test.localeCompare(b.test)));
        });
        
        setIsTesting(false);
    };

    const getStatusStyles = (status: ConnectionTestResult['status']) => {
        switch(status) {
            case 'success': return { borderColor: '#a7f3d0', backgroundColor: '#f0fdf4', color: '#15803d', textColor: '#166534' };
            case 'failure': return { borderColor: '#fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', textColor: '#991b1b' };
            case 'info': return { borderColor: '#bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', textColor: '#1e40af' };
            default: return { borderColor: '#e5e7eb', backgroundColor: '#f9fafb', color: '#374151', textColor: '#374151' };
        }
    }

    return (
        <Card>
             <h2 className="text-xl font-bold mb-4">ทดสอบการตั้งค่าและการเชื่อมต่อ</h2>
             <p className="text-slate-600 mb-4">ตรวจสอบว่าระบบสามารถเชื่อมต่อฐานข้อมูลและมีสิทธิ์การใช้งาน (อ่าน, เขียน, ลบ) ที่ถูกต้อง</p>
             <Button onClick={handleRunTest} disabled={isTesting}>
                {isTesting ? <Spinner/> : "เริ่มการทดสอบ"}
             </Button>

             {results.length > 0 && (
                <div className="mt-4 space-y-2">
                    {results.map((result, index) => {
                        const styles = getStatusStyles(result.status);
                        return (
                            <div key={index} className="p-3 rounded-lg border flex items-start" style={{borderColor: styles.borderColor, backgroundColor: styles.backgroundColor}}>
                                {result.status === 'success' && <CheckCircleIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0 mt-1"/>}
                                {result.status === 'failure' && <XCircleIcon className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-1"/>}
                                {result.status === 'info' && <InfoCircleIcon className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0 mt-1"/>}
                                <div>
                                    <p className="font-semibold" style={{color: styles.color}}>{result.test}</p>
                                    <p className="text-sm" style={{color: styles.textColor}}>{result.details}</p>
                                    {result.fix && (
                                        <div className="mt-2">
                                            <p className="text-sm font-semibold text-slate-700">คำแนะนำการแก้ไข:</p>
                                            <pre className="bg-slate-800 text-white p-2 rounded-md text-xs overflow-x-auto">
                                                <code>{result.fix}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
             )}
        </Card>
    );
};

export const ActivityTimeline: React.FC<{ activities: LeadActivity[] }> = ({ activities }) => {
    if (activities.length === 0) {
        return <div className="text-center text-slate-500 py-8">ไม่มีประวัติการติดตาม</div>;
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {activities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                        <div className="relative pb-8">
                            {activityIdx !== activities.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white">
                                        <ClockIcon className="h-5 w-5 text-slate-500" />
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5">
                                    <p className="text-sm text-slate-500">
                                        {activity.activity_description}{' '}
                                        <span className="font-medium text-slate-700">{activity.user_name || 'System'}</span>
                                    </p>
                                     <p className="mt-0.5 text-xs text-slate-400">
                                        {new Date(activity.created_at).toLocaleString('th-TH')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};