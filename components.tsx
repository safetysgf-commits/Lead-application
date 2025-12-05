
import React, { useState, useContext, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { AuthContext } from './context.ts';
import { User, Page, Lead, Salesperson, LeadStatus, ConnectionTestResult, Database, LeadActivity, Role, Program, SalespersonWithStats, LeadSource } from './types.ts';
import { statusColors, leadStatuses, runConnectionTest, getSalesTeam, updateUserPassword, getPrograms, updateUserStatus, isUserOnline } from './services.ts';
import { useToast } from './hooks/useToast.tsx';

// --- Icons (Clean Line Style) ---
export const HomeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);
export const UsersIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);
export const PhoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);
export const HeartIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
export const CalendarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0h18M5.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
);
export const CogIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
// ... Re-export existing icons if needed ...
export const BellIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);
export const LogoutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);
export const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
export const EditIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);
export const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const InfoCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const FileDownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
export const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);
export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);
export const CakeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
    </svg>
);
export const TeamIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 5.223m0 0a5.971 5.971 0 00.941 3.197M13.5 2.25h-3c-1.313 0-2.619.198-3.87.576a2.625 2.625 0 00-1.87 2.518v.75c0 .414.336.75.75.75h9c.414 0 .75-.336.75-.75v-.75a2.625 2.625 0 00-1.87-2.518c-1.251-.378-2.557-.576-3.87-.576z" />
    </svg>
);
export const ChartBarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

// --- Layout Components ---

const NotificationBell: React.FC<{ count: number }> = ({ count }) => (
    <div className="relative group cursor-pointer">
        <BellIcon className={`w-7 h-7 transition-colors duration-300 ${count > 0 ? 'text-yellow-500 animate-[bounce_1s_ease-in-out_infinite]' : 'text-slate-500 group-hover:text-slate-700'}`} />
        {count > 0 && (
            <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white shadow-sm transform scale-110">
                {count}
            </span>
        )}
    </div>
);

export const Header: React.FC<{ user: User, onLogout: () => void, notificationCount: number }> = ({ user, onLogout, notificationCount }) => {
    const { addToast } = useToast();
    const [status, setStatus] = useState<'online' | 'offline' | undefined>(user.status || 'online');

    useEffect(() => {
        if (user.status) setStatus(user.status);
    }, [user.status]);

    const toggleStatus = async () => {
        const newStatus = status === 'online' ? 'offline' : 'online';
        setStatus(newStatus); 
        try {
            await updateUserStatus(user.id, newStatus);
            addToast(`สถานะของคุณคือ: ${newStatus === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}`, 'success');
        } catch (error) {
            setStatus(status); 
            addToast('ไม่สามารถเปลี่ยนสถานะได้', 'error');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50 h-20 flex items-center justify-between px-4 md:px-6 transition-all">
            <div className="flex items-center">
                <div className="relative">
                    <img src={user.avatar} alt="User Avatar" className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-4 border-2 border-white shadow-sm" />
                     <span className={`absolute bottom-0 right-4 block h-3 w-3 rounded-full ring-2 ring-white ${status === 'online' ? 'bg-[#cddc39]' : 'bg-[#e51c23]'}`}></span>
                </div>
                <div>
                    <p className="font-bold text-md text-slate-800 tracking-tight">Lead CRM</p>
                    <p className="text-xs text-slate-500 font-medium">{user.name} ({user.role})</p>
                </div>
            </div>
            <div className="flex items-center space-x-5">
                <div className="flex items-center space-x-2">
                    <span className={`hidden md:inline text-xs font-bold ${status === 'online' ? 'text-[#cddc39]' : 'text-[#e51c23]'}`}>
                        {status === 'online' ? 'Online' : 'Offline'}
                    </span>
                    <button 
                        onClick={toggleStatus}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cddc39] ${status === 'online' ? 'bg-[#cddc39]' : 'bg-[#e51c23]'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status === 'online' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {(user.role === 'sales' || user.role === 'admin') && <NotificationBell count={notificationCount} />}
                <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};

export const BottomNav: React.FC<{ user: User, currentPage: Page, setCurrentPage: (page: Page) => void }> = ({ user, currentPage, setCurrentPage }) => {
    // Admin can access everything
    const navItems = [
        { page: 'dashboard', label: 'ภาพรวม', icon: HomeIcon },
        { page: 'leads', label: 'Leads', icon: UsersIcon },
        { page: 'sell', label: 'Sell', icon: PhoneIcon },
        { page: 'crm', label: 'CRM', icon: HeartIcon },
        { page: 'calendar', label: 'ปฏิทิน', icon: CalendarIcon },
    ];
    
    // Add Team/Settings for Admin
    if (user.role === 'admin') {
        navItems.push({ page: 'team', label: 'ทีม', icon: TeamIcon });
        navItems.push({ page: 'settings', label: 'ตั้งค่า', icon: CogIcon });
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-slate-200 shadow-lg pb-safe">
            <div className={`flex w-full overflow-x-auto justify-between md:justify-center md:gap-8 p-2 no-scrollbar`}>
                {navItems.map(item => {
                    const isActive = currentPage === item.page;
                    const activeClasses = 'text-[#4DA6FF] font-bold';
                    const inactiveClasses = 'text-slate-400 hover:text-slate-600';
                    return (
                        <button 
                            key={item.page}
                            onClick={() => setCurrentPage(item.page as Page)}
                            className={`flex flex-col items-center justify-center min-w-[64px] py-1 transition-all duration-200 ${isActive ? activeClasses : inactiveClasses}`}
                        >
                            <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : ''}`} />
                            <span className="text-[10px] tracking-wide">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    );
};

// --- UI Components ---
export const Card: React.FC<{ children: React.ReactNode, className?: string, noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${noPadding ? '' : 'p-4 md:p-6'} ${className}`}>
        {children}
    </div>
);

export const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, subtext?: string, colorClass?: string }> = ({ title, value, icon, subtext, colorClass = 'bg-white' }) => {
    return (
        <Card className={`flex flex-col justify-between h-full transition-transform hover:-translate-y-1 duration-300 ${colorClass}`}>
            <div className="flex justify-between items-start mb-2">
                 <p className="text-sm font-medium text-slate-500">{title}</p>
                 <div className="p-2 rounded-lg bg-slate-50 text-slate-600">{icon}</div>
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
        </Card>
    );
};

export const Button: React.FC<{ onClick?: () => void, children: React.ReactNode, className?: string, variant?: 'primary' | 'secondary' | 'danger' | 'success', type?: 'button' | 'submit', disabled?: boolean }> = ({ onClick, children, className, variant = 'primary', type = 'button', disabled = false }) => {
    const baseClasses = "px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-sm text-sm";
    const variantClasses = {
        primary: 'bg-[#4DA6FF] text-white hover:bg-sky-500 active:scale-95', // Theme Blue
        secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95',
        success: 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
    };
    return (
        <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, footer?: React.ReactNode, size?: 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, footer, size = 'lg' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl'
    };
    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} relative flex flex-col max-h-[90vh]`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 rounded-full p-1 hover:bg-slate-100 transition-colors">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
                {footer && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Spinner: React.FC<{}> = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4DA6FF]"></div>
    </div>
);

// --- Form Components ---

type LeadFormData = Omit<Database['public']['Tables']['leads']['Insert'], 'id' | 'created_at' | 'last_update_date'>;

export const LeadForm: React.FC<{ lead?: Lead | null, onSave: (leadData: LeadFormData, id?: number) => void, onCancel: () => void }> = ({ lead, onSave, onCancel }) => {
    const auth = useContext(AuthContext);
    const [salesTeam, setSalesTeam] = React.useState<(Salesperson & { isOnline: boolean })[]>([]);
    const [programs, setPrograms] = React.useState<Program[]>([]);
    const [noOnlineSales, setNoOnlineSales] = useState(false);

    React.useEffect(() => {
        getSalesTeam().then(team => {
            const teamWithStatus = team.map(s => ({
                ...s,
                isOnline: isUserOnline(s)
            }));
            setSalesTeam(teamWithStatus);
            
            // Check if any sales are online
            const anyOnline = teamWithStatus.some(s => s.role === 'sales' && s.isOnline);
            setNoOnlineSales(!anyOnline);
        });
        getPrograms().then(setPrograms);
    }, [auth?.user?.role, lead]);

    const [formData, setFormData] = useState<LeadFormData>({
        name: lead?.name || '',
        phone: lead?.phone || '',
        program: lead?.program || '',
        source: lead?.source || LeadSource.Facebook,
        status: lead?.status || LeadStatus.New,
        assigned_to: lead?.assigned_to || (auth?.user?.role === 'admin' && salesTeam.length > 0 ? null : auth?.user?.id || null),
        birthday: lead?.birthday || null,
        address: lead?.address || '',
        value: lead?.value || 0,
        notes: lead?.notes || '',
        received_date: lead?.received_date || new Date().toISOString().split('T')[0]
    });

    const [phoneError, setPhoneError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
        
        if (name === 'phone') {
            // Basic Thai phone validation
            const phoneRegex = /^0[0-9]{8,9}$/;
            if (value && !phoneRegex.test(value)) {
                setPhoneError('เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678)');
            } else {
                setPhoneError('');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phoneError) return;
        onSave({
            ...formData,
            value: Number(formData.value)
        }, lead?.id);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ชื่อ-นามสกุล</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">เบอร์โทรศัพท์</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className={`w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 transition-all ${phoneError ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:ring-sky-100'}`} required />
                    {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">โปรแกรมที่สนใจ</label>
                    <select name="program" value={formData.program ?? ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                        <option value="">-- เลือกโปรแกรม --</option>
                        {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ช่องทางลูกค้า</label>
                    <select name="source" value={formData.source ?? ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                        {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-1">วันที่จอง</label>
                     <input name="received_date" type="date" value={formData.received_date ?? ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50" required/>
                </div>
                {auth?.user?.role === 'admin' && (
                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1">ผู้รับผิดชอบ (Sell)</label>
                         <select 
                            name="assigned_to" 
                            value={formData.assigned_to ?? ''} 
                            onChange={handleChange} 
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                         >
                             <option value="">-- เลือกผู้รับผิดชอบ --</option>
                             {salesTeam.filter(s => s.role === 'sales').map(s => (
                                 <option key={s.id} value={s.id} disabled={!s.isOnline}>
                                     {s.isOnline ? '🟢' : '🔴'} {s.full_name} ({s.isOnline ? 'Online' : 'Offline'})
                                 </option>
                             ))}
                         </select>
                         {noOnlineSales && (
                             <p className="text-xs text-red-500 mt-1">❗ ไม่พบพนักงานขายที่ออนไลน์ กรุณารอพนักงานเข้าใช้งานระบบ</p>
                         )}
                     </div>
                )}
            </div>

            <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1">หมายเหตุ</label>
                 <textarea name="notes" value={formData.notes ?? ''} onChange={handleChange} placeholder="รายละเอียดเพิ่มเติม..." className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50" rows={3}></textarea>
            </div>
            
            {/* Advanced fields hidden in summary but available if needed, like birthday/address/value */}
             <details className="text-sm text-slate-500 cursor-pointer">
                <summary className="mb-2 hover:text-sky-600">ข้อมูลเพิ่มเติม (ที่อยู่, วันเกิด, มูลค่า)</summary>
                <div className="space-y-4 pt-2 border-t border-slate-100">
                    <input name="address" value={formData.address ?? ''} onChange={handleChange} placeholder="ที่อยู่" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50" />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="birthday" type="date" value={formData.birthday ?? ''} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50" />
                        <input name="value" type="number" value={formData.value ?? ''} onChange={handleChange} placeholder="มูลค่า (บาท)" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50" />
                    </div>
                </div>
            </details>

            <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={onCancel} variant="secondary">ยกเลิก</Button>
                <Button type="submit" variant="primary" disabled={auth?.user?.role === 'admin' && noOnlineSales && !formData.assigned_to}>บันทึก & ส่งให้ Sell</Button>
            </div>
        </form>
    );
};

export const SalespersonForm: React.FC<{ salesperson?: Salesperson | null, onSave: (data: any, id?: string) => void, onCancel: () => void, onChangePassword: (userId: string) => void }> = ({ salesperson, onSave, onCancel, onChangePassword }) => {
    // Legacy component wrapper - better to use the new UserForm below for robustness
    const [formData, setFormData] = useState({
        full_name: salesperson?.full_name || '',
        email: salesperson?.email || '',
        role: salesperson?.role || 'sales',
    });
    const handleChange = (e: any) => setFormData({...formData, [e.target.name]: e.target.value});
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData, salesperson?.id); }} className="space-y-4">
            <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" className="w-full p-2.5 border rounded-xl" required />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="อีเมล" className="w-full p-2.5 border rounded-xl" disabled={!!salesperson} />
             <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2.5 border rounded-xl">
                <option value="sales">Sell</option>
                <option value="after_care">CRM</option>
                <option value="admin">Admin</option>
            </select>
            <div className="flex justify-between pt-4">
                {salesperson && <Button type="button" onClick={() => onChangePassword(salesperson.id)} variant="secondary" className="text-xs">เปลี่ยนรหัสผ่าน</Button>}
                <div className="flex gap-2">
                    <Button onClick={onCancel} variant="secondary">ยกเลิก</Button>
                    <Button type="submit" variant="primary">บันทึก</Button>
                </div>
            </div>
        </form>
    );
};

export const UserForm: React.FC<{ 
    initialData?: { fullName: string, email: string, role: string, id?: string }, 
    onSave: (data: any) => void, 
    onCancel: () => void,
    isEdit?: boolean,
    onResetPassword?: (newPass: string) => Promise<void>
}> = ({ initialData, onSave, onCancel, isEdit = false, onResetPassword }) => {
    const [d, setD] = useState({ 
        fullName: initialData?.fullName || '', 
        email: initialData?.email || '', 
        password: '', 
        role: initialData?.role || 'sales' 
    });
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onSave(d);
    }

    const handlePasswordReset = async () => {
        if (!newPassword) return;
        if (onResetPassword) {
            await onResetPassword(newPassword);
            setShowPasswordReset(false);
            setNewPassword('');
            addToast('เปลี่ยนรหัสผ่านสำเร็จ', 'success');
        }
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ชื่อ-นามสกุล</label>
                    <input value={d.fullName} onChange={e=>setD({...d, fullName: e.target.value})} className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-100" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">อีเมล {isEdit && '(ไม่สามารถแก้ไข)'}</label>
                    <input value={d.email} onChange={e=>setD({...d, email: e.target.value})} className={`w-full p-2.5 border rounded-xl ${isEdit ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`} disabled={isEdit} required />
                </div>
                
                {!isEdit && (
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">รหัสผ่าน</label>
                        <input value={d.password} onChange={e=>setD({...d, password: e.target.value})} type="password" className="w-full p-2.5 border rounded-xl bg-slate-50" required={!isEdit} />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ตำแหน่ง (Role)</label>
                    <select value={d.role} onChange={e=>setD({...d, role: e.target.value})} className="w-full p-2.5 border rounded-xl bg-slate-50">
                        <option value="sales">Sell (ฝ่ายขาย)</option>
                        <option value="after_care">CRM (หลังการขาย)</option>
                        <option value="admin">Admin (ผู้ดูแล)</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={onCancel} variant="secondary">ยกเลิก</Button>
                    <Button type="submit" variant="primary">บันทึก</Button>
                </div>
            </form>

            {isEdit && onResetPassword && (
                <div className="border-t border-slate-100 pt-4 mt-4">
                    <button 
                        type="button"
                        onClick={() => setShowPasswordReset(!showPasswordReset)}
                        className="text-xs text-slate-500 hover:text-sky-600 underline"
                    >
                        {showPasswordReset ? 'ยกเลิกการเปลี่ยนรหัสผ่าน' : 'ต้องการเปลี่ยนรหัสผ่าน?'}
                    </button>
                    
                    {showPasswordReset && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <label className="block text-xs font-semibold text-slate-500 mb-1">รหัสผ่านใหม่</label>
                             <div className="flex gap-2">
                                 <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="flex-1 p-2 border rounded-lg text-sm"
                                    placeholder="กรอกรหัสใหม่"
                                 />
                                 <Button onClick={handlePasswordReset} variant="secondary" className="px-3 py-1 text-xs whitespace-nowrap">ยืนยัน</Button>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const AddUserForm: React.FC<{ onSave: (data: any) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
    // Wrapper for new UserForm to maintain backward compatibility if needed, or replace usage
    return <UserForm onSave={onSave} onCancel={onCancel} />;
};

export const ChangePasswordForm: React.FC<{ onSave: (p: string) => void, onCancel: () => void }> = ({ onSave, onCancel }) => {
     const [p, setP] = useState('');
     return (
         <form onSubmit={(e) => { e.preventDefault(); onSave(p); }} className="space-y-4">
            <input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="รหัสผ่านใหม่" className="w-full p-2.5 border rounded-xl" required/>
            <div className="flex justify-end gap-2">
                <Button onClick={onCancel} variant="secondary">ยกเลิก</Button>
                <Button type="submit" variant="primary">ยืนยัน</Button>
            </div>
         </form>
     )
};

// --- Activity/Log Components ---

export const ActivityTimeline: React.FC<{ activities: LeadActivity[] }> = ({ activities }) => {
    if (activities.length === 0) return <div className="text-center text-slate-400 py-8 text-sm">ไม่มีประวัติการดำเนินการ</div>;

    return (
        <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
            {activities.map((activity) => (
                <div key={activity.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white"></span>
                    <div>
                        <p className="text-sm text-slate-800 font-medium">{activity.activity_description}</p>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                            <span className="font-semibold mr-2">{activity.user_name || 'System'}</span>
                            <span>{new Date(activity.created_at).toLocaleString('th-TH')}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const SalesPerformanceChart: React.FC<{data: any[]}> = ({data}) => (
    <Card noPadding className="p-4">
        <h3 className="font-bold mb-4 text-slate-700">Performance ทีมขาย</h3>
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sales" fill="#4DA6FF" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </Card>
);

export const FunnelChart: React.FC<{ data: { name: string, value: number, fill: string }[] }> = ({ data }) => {
    return (
        <Card noPadding className="p-4">
            <h3 className="font-bold mb-4 text-slate-700">Sales Funnel</h3>
            <div className="flex flex-col space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="relative h-10 w-full rounded-lg bg-slate-50 overflow-hidden flex items-center px-4">
                        <div 
                            className="absolute left-0 top-0 bottom-0 opacity-20" 
                            style={{ width: `${(item.value / (data[0].value || 1)) * 100}%`, backgroundColor: item.fill }}
                        ></div>
                        <div className="flex justify-between w-full z-10 relative">
                            <span className="font-medium text-slate-700 text-sm">{item.name}</span>
                            <span className="font-bold text-slate-800">{item.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export const ConnectionTest: React.FC = () => {
    const [results, setResults] = useState<ConnectionTestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const startTest = async () => {
        setIsRunning(true);
        setResults([]);
        await runConnectionTest((result) => {
            setResults(prev => {
                const existingIndex = prev.findIndex(r => r.test === result.test);
                if (existingIndex >= 0) {
                    const newResults = [...prev];
                    newResults[existingIndex] = result;
                    return newResults;
                }
                return [...prev, result];
            });
        });
        setIsRunning(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">ตรวจสอบการเชื่อมต่อระบบ</h3>
                <Button onClick={startTest} disabled={isRunning}>
                    {isRunning ? 'กำลังตรวจสอบ...' : 'เริ่มการทดสอบ'}
                </Button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {results.map((res, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-sm ${
                        res.status === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                        res.status === 'failure' ? 'bg-red-50 border-red-200 text-red-700' :
                        res.status === 'pending' ? 'bg-slate-50 border-slate-200 text-slate-500' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                        <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                res.status === 'success' ? 'bg-green-500' :
                                res.status === 'failure' ? 'bg-red-500' :
                                res.status === 'pending' ? 'bg-slate-400 animate-pulse' : 'bg-blue-500'
                            }`}></span>
                            <span className="font-semibold mr-2">{res.test}</span>
                            <span className="truncate flex-1">- {res.details}</span>
                        </div>
                        {res.fix && (
                            <div className="mt-2 p-2 bg-white rounded border border-slate-200 font-mono text-xs overflow-x-auto relative group">
                                <pre>{res.fix}</pre>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(res.fix!)}
                                    className="absolute top-1 right-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px]"
                                >
                                    Copy SQL
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
