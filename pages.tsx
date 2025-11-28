
import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { AuthContext } from './App';
import { User, Lead, Salesperson, CalendarEvent, Database, Role, LeadActivity, Program, SalespersonWithStats, CalendarEventWithLead } from './types.ts';
import { 
    getLeads, getSalesTeam, getCalendarEvents, getDashboardStats, getSalesPerformance, getConversionRates,
    createLead, updateLead, deleteLead, updateSalesperson, deleteSalesperson,
    statusColors, getBirthdays, getSalesTrend, exportToPDF, exportToCSV,
    getLeadActivities, createLeadActivity, updateUserPassword, adminCreateUser,
    getPrograms, createProgram, deleteProgram, getSalesTeamPerformance, createFollowUpAppointments,
    sendLineNotification
} from './services.ts';
import {
    Card, StatCard, Button, Modal, Spinner, LeadForm, SalespersonForm, ChangePasswordForm, AddUserForm, AppointmentModal,
    SalesPerformanceChart, ConversionRatePieChart, SalesTrendChart, ConnectionTest, ActivityTimeline, SalespersonPerformanceCard,
    PlusIcon, EditIcon, TrashIcon, CakeIcon, PhoneIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, InfoCircleIcon,
    UsersIcon, TeamIcon, FileDownloadIcon, CalendarIcon, ClockIcon
} from './components.tsx';
import { useToast } from './hooks/useToast.tsx';
import { supabase } from './supabaseClient.ts';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type SalespersonInsert = Database['public']['Tables']['profiles']['Insert'];
type SalespersonUpdate = Database['public']['Tables']['profiles']['Update'];

// Helper to safely extract error messages
const getErrorMessage = (error: any): string => {
    if (!error) return 'เกิดข้อผิดพลาดที่ไม่ระบุสาเหตุ';
    if (typeof error === 'string') return error;
    // Handle Supabase error objects or generic Error objects
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    
    // Fallback to string representation if JSON fails or is empty
    try {
        const str = JSON.stringify(error);
        if (str !== '{}' && !str.includes('"[object Object]"')) return str;
    } catch (e) {
        // ignore
    }
    
    // Last resort
    return Object.prototype.toString.call(error) === '[object Object]' 
        ? 'Unknown error object' 
        : String(error);
};

// --- Auth Pages ---
export const LoginPage: React.FC<{ 
    onSwitchPage: (page: 'register') => void;
    postRegistrationEmail?: string | null;
    clearPostRegistrationEmail?: () => void;
}> = ({ onSwitchPage, postRegistrationEmail, clearPostRegistrationEmail }) => {
    const auth = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const { addToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        if (auth?.login) {
            setIsLoading(true);
            try {
                await auth.login(email, password);
            } catch (error: any) {
                const msg = getErrorMessage(error);
                if (msg.includes('Email not confirmed')) {
                    setLoginError('Email not confirmed');
                } else {
                    addToast(`เข้าสู่ระบบไม่สำเร็จ: ${msg}`, 'error');
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleResendConfirmation = async () => {
        if (auth?.resendConfirmation && email) {
            setIsResending(true);
            try {
                await auth.resendConfirmation(email);
                setLoginError('Resent');
            } catch (error) {
                // Toast is handled in context
            } finally {
                setIsResending(false);
            }
        } else {
            addToast('กรุณากรอกอีเมลที่ถูกต้อง', 'warning');
        }
    };
    
    const handleInteraction = () => {
        if (postRegistrationEmail && clearPostRegistrationEmail) {
            clearPostRegistrationEmail();
        }
        if (loginError) {
            setLoginError(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-orange-100 p-4">
            <Card className="w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-2 text-slate-800">Lead CRM</h2>
                <p className="text-center text-slate-500 mb-6">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>

                {postRegistrationEmail && !loginError && (
                    <div className="my-4 p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm" role="alert">
                        <p className="font-semibold">ลงทะเบียนสำเร็จ!</p>
                        <p>เราได้ส่งลิงก์ยืนยันบัญชีไปที่ <strong>{postRegistrationEmail}</strong> แล้ว กรุณาคลิกลิงก์เพื่อเปิดใช้งานบัญชีก่อนเข้าสู่ระบบ</p>
                    </div>
                )}
                
                {loginError === 'Email not confirmed' && (
                    <div className="my-4 p-3 rounded-lg bg-yellow-100 border border-yellow-200 text-yellow-800 text-sm" role="alert">
                        <p className="font-semibold">บัญชียังไม่ถูกยืนยัน!</p>
                        <p>กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อยืนยันบัญชี</p>
                        <Button
                            variant="secondary"
                            className="w-full mt-2 text-sm !bg-yellow-200 !text-yellow-900 hover:!bg-yellow-300"
                            onClick={handleResendConfirmation}
                            disabled={isResending}
                        >
                            {isResending ? <Spinner/> : "ส่งอีเมลยืนยันอีกครั้ง"}
                        </Button>
                    </div>
                )}

                {loginError === 'Resent' && (
                     <div className="my-4 p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm" role="alert">
                        <p className="font-semibold">ส่งอีเมลแล้ว!</p>
                        <p>โปรดตรวจสอบกล่องจดหมายของคุณสำหรับลิงก์ยืนยัน</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">อีเมล</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); handleInteraction(); }}
                            placeholder="user@example.com"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">รหัสผ่าน</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); handleInteraction(); }}
                            placeholder="••••••••"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                            required 
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading ? <Spinner /> : 'เข้าสู่ระบบ'}
                    </Button>
                </form>
                 <div className="text-center mt-6 space-y-2">
                     <p className="text-sm text-slate-600">
                        ยังไม่มีบัญชี?{' '}
                        <button type="button" onClick={() => onSwitchPage('register')} className="font-semibold text-[var(--color-primary)] hover:underline">
                            ลงทะเบียนที่นี่
                        </button>
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="text-sm text-slate-500 hover:text-[var(--color-primary)] hover:underline focus:outline-none"
                    >
                        ทดสอบการตั้งค่าและการเชื่อมต่อ
                    </button>
                </div>
                 <p className="text-xs text-center text-slate-500 mt-4 px-2">
                    <strong>หมายเหตุ:</strong> กรุณาใช้บัญชีผู้ใช้ (อีเมล/รหัสผ่าน) ที่มีอยู่จริงในฐานข้อมูล
                </p>
            </Card>
            <Modal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                title="ทดสอบการตั้งค่าระบบ"
            >
                <ConnectionTest />
            </Modal>
        </div>
    );
};

export const RegistrationPage: React.FC<{ onSwitchPage: (page: 'login') => void }> = ({ onSwitchPage }) => {
    const auth = useContext(AuthContext);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (auth?.register) {
            setIsLoading(true);
            try {
                await auth.register(fullName, email, password);
            } catch (error) {
                console.error("Registration failed:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-orange-100 p-4">
            <Card className="w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-2 text-slate-800">สร้างบัญชีใหม่</h2>
                <p className="text-center text-slate-500 mb-6">กรอกข้อมูลเพื่อลงทะเบียน</p>
                <form onSubmit={handleRegister} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อ-นามสกุล</label>
                        <input 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="สมชาย ใจดี"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">อีเมล</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">รหัสผ่าน</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                             minLength={6}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                            required 
                        />
                    </div>
                    <p className="text-xs text-center text-slate-500 !mt-2">
                        ผู้ใช้ใหม่จะถูกลงทะเบียนในบทบาท 'ฝ่ายขาย' (Sales) โดยอัตโนมัติ
                    </p>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading ? <Spinner /> : 'ลงทะเบียน'}
                    </Button>
                </form>
                 <div className="text-center mt-6">
                     <p className="text-sm text-slate-600">
                        มีบัญชีอยู่แล้ว?{' '}
                        <button type="button" onClick={() => onSwitchPage('login')} className="font-semibold text-[var(--color-primary)] hover:underline">
                            เข้าสู่ระบบที่นี่
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
};


// --- Dashboards ---
export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [performanceData, setPerformanceData] = useState([]);
    const [conversionData, setConversionData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [dateRange, setDateRange] = useState({
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    const { addToast } = useToast();

    const fetchData = useCallback(async () => {
        setStats(null); // Show spinner while fetching
        const range = { start: dateRange.start, end: `${dateRange.end}T23:59:59.999Z`};
        setStats(await getDashboardStats('admin', undefined, range));
        setPerformanceData(await getSalesPerformance(range));
        setConversionData(await getConversionRates(undefined, range));
        setTrendData(await getSalesTrend(range));
    }, [dateRange]);
    
    useEffect(() => {
       fetchData();
    }, [fetchData]);

    const handleExportAll = async (format: 'csv' | 'pdf') => {
        addToast('กำลังเตรียมข้อมูลสำหรับ Export...', 'info');
        try {
            const allLeads = await getLeads('admin');
            if (format === 'csv') {
                exportToCSV(allLeads);
            } else {
                exportToPDF(allLeads);
            }
            addToast('Export ข้อมูลสำเร็จ!', 'success');
        } catch(error: any) {
            addToast(`Export ข้อมูลล้มเหลว: ${getErrorMessage(error)}`, 'error');
            console.error(error);
        }
    }

    if (!stats) return <Spinner />;

    const isGettingStarted = stats.totalLeads === 0;
    
    return (
        <div className="space-y-6">
             <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">แดชบอร์ดผู้ดูแล</h1>
                    <p className="text-slate-500">ภาพรวมข้อมูลการขายของคุณ</p>
                </div>
                 <div className="flex items-center gap-2">
                     <Button onClick={() => handleExportAll('csv')} variant="secondary" className="text-sm">
                        <FileDownloadIcon className="mr-2"/>
                        Export to CSV
                    </Button>
                     <Button onClick={() => handleExportAll('pdf')} variant="secondary" className="text-sm">
                         <FileDownloadIcon className="mr-2"/>
                        Export to PDF
                    </Button>
                 </div>
            </div>
            
            <Card>
                <div className="flex flex-wrap items-center gap-4">
                    <h3 className="font-semibold">เลือกช่วงวันที่:</h3>
                    <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="p-2 border rounded-lg" />
                    <span>ถึง</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="p-2 border rounded-lg" />
                </div>
            </Card>

            {isGettingStarted && (
                <Card className="bg-sky-50 border-sky-200">
                    <h2 className="text-xl font-bold text-sky-800">เริ่มต้นใช้งาน</h2>
                    <p className="text-sky-600 mt-2 mb-4">ระบบ CRM ของคุณพร้อมใช้งานแล้ว เริ่มต้นจัดการลีดและทีมขายของคุณ</p>
                    {/* This button should navigate to the leads page */}
                    <Button onClick={() => {}} variant="primary">
                        <PlusIcon className="mr-2"/>
                        เพิ่มลีดใหม่
                    </Button>
                </Card>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="ลีดทั้งหมด" value={stats.totalLeads.toLocaleString()} icon={<UsersIcon className="w-6 h-6"/>} theme="sky" />
                <StatCard title="ลีดใหม่" value={stats.newLeads.toLocaleString()} icon={<PlusIcon className="w-6 h-6"/>} theme="orange" />
                <StatCard title="ยอดขาย" value={`฿${stats.totalValue.toLocaleString()}`} icon={<span className="text-2xl font-bold">฿</span>} theme="emerald" />
                <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={<CheckCircleIcon className="w-6 h-6"/>} theme="violet" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <SalesPerformanceChart data={performanceData} />
                 <BirthdayReport />
            </div>
             <SalesTrendChart data={trendData} />
        </div>
    );
};

export const SalesDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [stats, setStats] = useState<any>(null);
    const [conversionData, setConversionData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setStats(await getDashboardStats(user.role as any, user.id)); // Cast role to avoid strict type issue if 'after_care' treated differently in future
            setConversionData(await getConversionRates(user.id));
        }
        fetchData();
    }, [user.id, user.role]);

    if (!stats) return <Spinner />;
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">แดชบอร์ดฝ่ายขาย</h1>
                    <p className="text-slate-500">ภาพรวมข้อมูลการขายของคุณ</p>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="ลีดของฉัน" value={stats.totalLeads} icon={<UsersIcon className="w-6 h-6"/>} />
                <StatCard title="ยังไม่ได้โทร" value={stats.uncalledLeads} icon={<PhoneIcon className="w-6 h-6"/>} />
                <StatCard title="ยอดขายเดือนนี้" value={`฿${stats.monthlySales.toLocaleString()}`} icon={<span className="text-2xl font-bold">฿</span>} />
                <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={<CheckCircleIcon className="w-6 h-6"/>} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConversionRatePieChart data={conversionData} />
                <BirthdayReport salespersonId={user.id} />
             </div>
        </div>
    );
};

const BirthdayReport: React.FC<{salespersonId?: string}> = ({salespersonId}) => {
    const [birthdays, setBirthdays] = useState<{today: Lead[], thisMonth: Lead[]}>({today: [], thisMonth: []});
    
    useEffect(() => {
        getBirthdays(salespersonId).then(setBirthdays);
    }, [salespersonId]);

    return (
         <Card>
            <h3 className="font-bold mb-4 text-slate-700">รายงานวันเกิด</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <StatCard title="เกิดวันนี้" value={birthdays.today.length.toString()} icon={<CakeIcon className="w-6 h-6"/>} />
                <StatCard title="เกิดเดือนนี้" value={birthdays.thisMonth.length.toString()} icon={<CalendarIcon className="w-6 h-6"/>} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-rose-500 flex items-center mb-2"><CakeIcon className="w-4 h-4 mr-1"/> วันนี้</h4>
                    {birthdays.today.length > 0 ? (
                        <ul className="text-sm text-slate-600 space-y-2 bg-rose-50 p-3 rounded-xl max-h-60 overflow-y-auto">
                            {birthdays.today.map(lead => (
                                <li key={lead.id} className="flex justify-between border-b border-rose-100 last:border-0 pb-1">
                                    <span>{lead.name}</span>
                                    <span className="font-mono text-xs">{lead.phone}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-400 italic">ไม่มีวันเกิดวันนี้</p>}
                </div>
                <div>
                    <h4 className="font-semibold text-sky-600 flex items-center mb-2"><CalendarIcon className="w-4 h-4 mr-1"/> เดือนนี้</h4>
                     {birthdays.thisMonth.length > 0 ? (
                        <ul className="text-sm text-slate-600 space-y-2 bg-sky-50 p-3 rounded-xl max-h-60 overflow-y-auto">
                            {birthdays.thisMonth.map(lead => (
                                <li key={lead.id} className="flex justify-between border-b border-sky-100 last:border-0 pb-1">
                                    <div>
                                        <div className="font-medium">{lead.name}</div>
                                        <div className="text-xs text-slate-400">{new Date(lead.birthday!).getDate()} {new Date(lead.birthday!).toLocaleString('default', { month: 'short' })}</div>
                                    </div>
                                    <span className="font-mono text-xs self-center">{lead.phone}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-400 italic">ไม่มีวันเกิดเดือนนี้</p>}
                </div>
            </div>
        </Card>
    )
}

// --- Leads Page ---

export const LeadsPage: React.FC<{ user: User, setNotificationCount: (count: number) => void }> = ({ user, setNotificationCount }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<LeadActivity[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const { addToast } = useToast();

    const fetchLeads = useCallback(async () => {
        try {
            const data = await getLeads(user.role === 'admin' ? 'admin' : 'sales', user.role === 'admin' ? undefined : user.id);
            setLeads(data);
            if(user.role === 'sales') {
                const unreadCount = data.filter(l => l.status === 'ใหม่' || l.status === 'ยังไม่ได้โทร').length;
                setNotificationCount(unreadCount);
            }
        } catch (error: any) {
            addToast(`เกิดข้อผิดพลาด: ${getErrorMessage(error)}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user.id, user.role, addToast, setNotificationCount]);

    useEffect(() => {
        setIsLoading(true);
        fetchLeads();
    }, [fetchLeads]);

    useEffect(() => {
        const channel = supabase
            .channel('public-leads-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                (payload) => {
                    const changedLead = payload.new as Lead;
                    const relevantChange = user.role === 'admin' || 
                                           (payload.eventType === 'INSERT' && changedLead.assigned_to === user.id) ||
                                           (payload.eventType === 'UPDATE' && (changedLead.assigned_to === user.id || (payload.old as Lead).assigned_to === user.id));

                    if (relevantChange) {
                        fetchLeads(); 
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchLeads, addToast, user]);

    const handleOpenModal = async (lead: Lead | null = null) => {
        setEditingLead(lead);
        setActiveTab('details');
        if (lead) {
            setActivities(await getLeadActivities(lead.id));
        } else {
            setActivities([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLead(null);
        setActivities([]);
    };

    const handleOpenAppointmentModal = (lead: Lead) => {
        setSchedulingLead(lead);
        setIsAppointmentModalOpen(true);
    };

    const handleCloseAppointmentModal = () => {
        setIsAppointmentModalOpen(false);
        setSchedulingLead(null);
    };

    const handleSaveLead = async (leadData: LeadInsert, id?: number) => {
        try {
            let assigneeName = '';
            let assigneeProfile = null;
            const team = await getSalesTeam();
            if (leadData.assigned_to) {
                assigneeProfile = team.find(s => s.id === leadData.assigned_to);
                assigneeName = assigneeProfile?.full_name || 'ไม่ระบุ';
            } else {
                assigneeName = 'ส่วนกลาง / ไม่ระบุ';
            }

            if (id && editingLead) {
                const changes: string[] = [];
                if (editingLead.status !== leadData.status) {
                    changes.push(`เปลี่ยนสถานะเป็น "${leadData.status}"`);
                }
                if (editingLead.assigned_to !== leadData.assigned_to) {
                     changes.push(`มอบหมายงานให้ "${assigneeName}"`);
                }
                if (changes.length > 0) {
                     await createLeadActivity(id, changes.join(', '));
                     
                     // Send Update Notification
                     sendLineNotification('update_status', {
                        leadName: leadData.name,
                        status: leadData.status,
                        program: leadData.program,
                        salesName: assigneeName,
                        phone: leadData.phone,
                        receivedDate: leadData.received_date, // Use the new received_date
                        address: leadData.address,
                        notes: leadData.notes
                     });
                }
                const updatedLead = await updateLead(id, leadData as LeadUpdate);
                
                // Immediately update local state to reflect status changes
                setLeads(prev => prev.map(l => {
                    if (l.id === id) {
                        return { 
                            ...l, 
                            ...updatedLead, 
                            profiles: assigneeProfile ? { full_name: assigneeProfile.full_name || '' } : l.profiles 
                        };
                    }
                    return l;
                }));
                
                addToast('อัปเดตข้อมูลลีดสำเร็จ', 'success');
            } else {
                const newLead = await createLead(leadData);
                 if (newLead) {
                    await createLeadActivity(newLead.id, 'สร้างลีดใหม่');
                    
                    // Send New Lead Notification
                    sendLineNotification('new_lead', {
                        leadName: leadData.name,
                        program: leadData.program,
                        salesName: assigneeName,
                        phone: leadData.phone,
                        receivedDate: leadData.received_date,
                        address: leadData.address,
                        notes: leadData.notes
                    });

                    const newLeadWithProfile = { 
                        ...newLead, 
                        profiles: assigneeProfile ? { full_name: assigneeProfile.full_name || '' } : null 
                    };
                    setLeads(prev => [newLeadWithProfile as Lead, ...prev]);
                }
                addToast('เพิ่มลีดใหม่สำเร็จ', 'success');
            }
            handleCloseModal();
        } catch (error: any) {
             addToast(`บันทึกข้อมูลล้มเหลว: ${getErrorMessage(error)}`, 'error');
        }
    };

    const handleDeleteLead = async (id: number) => {
         if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบลีดนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            try {
                // Find details before delete for notification
                const leadToDelete = leads.find(l => l.id === id);
                if (leadToDelete) {
                     await sendLineNotification('delete_lead', {
                        leadName: leadToDelete.name,
                        program: leadToDelete.program,
                        phone: leadToDelete.phone,
                        salesName: leadToDelete.profiles?.full_name,
                        receivedDate: leadToDelete.received_date,
                        address: leadToDelete.address,
                        notes: leadToDelete.notes
                     });
                }

                await deleteLead(id);
                setLeads(prev => prev.filter(l => l.id !== id));
                addToast('ลบลีดสำเร็จ', 'success');
            } catch (error: any) {
                addToast(`ลบล้มเหลว: ${getErrorMessage(error)}`, 'error');
            }
        }
    }
    
    const handleExportLead = (format: 'csv' | 'pdf') => {
        if (!editingLead) return;
        addToast(`กำลัง Export ข้อมูลเป็น ${format.toUpperCase()}...`, 'info');
        try {
            if (format === 'csv') {
                exportToCSV([editingLead]);
            } else {
                exportToPDF([editingLead]);
            }
            addToast('Export ข้อมูลสำเร็จ!', 'success');
        } catch (error: any) {
            addToast(`Export ข้อมูลล้มเหลว: ${getErrorMessage(error)}`, 'error');
            console.error(error);
        }
    };

    const handleExportExcel = () => {
        if (leads.length === 0) {
            addToast('ไม่มีข้อมูลสำหรับ Export', 'warning');
            return;
        }
        addToast('กำลังดาวน์โหลดไฟล์ Excel...', 'info');
        try {
            exportToCSV(leads);
            addToast('ดาวน์โหลดสำเร็จ', 'success');
        } catch (error: any) {
            addToast(`เกิดข้อผิดพลาด: ${getErrorMessage(error)}`, 'error');
        }
    };

    const handleCreateAppointments = async (serviceDate: string) => {
        if (!schedulingLead) return;
        try {
            addToast('กำลังสร้างนัดหมาย...', 'info');
            await createFollowUpAppointments(schedulingLead.id, user.id, serviceDate, schedulingLead.name);
            addToast('สร้าง 5 นัดหมายติดตามผลเรียบร้อยแล้ว!', 'success');
            handleCloseAppointmentModal();
        } catch (error: any) {
            addToast(`เกิดข้อผิดพลาด: ${getErrorMessage(error)}`, 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">
                    {user.role === 'admin' ? 'จัดการลีดทั้งหมด' : 'ลีดของฉัน'}
                </h1>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="secondary">
                        <FileDownloadIcon className="w-5 h-5 mr-1" /> Export Excel
                    </Button>
                    {user.role === 'admin' && (
                        <Button onClick={() => handleOpenModal()}>
                            <PlusIcon className="w-5 h-5 mr-1" /> เพิ่มลีดใหม่
                        </Button>
                    )}
                </div>
            </div>
            {isLoading && leads.length === 0 ? <Spinner /> : (
                leads.length > 0 ? (
                    <Card className="overflow-hidden p-0 border-0 shadow-lg ring-1 ring-slate-200 sm:rounded-2xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">วันที่จอง</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อลูกค้า</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">เบอร์โทร</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">โปรแกรม</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">สถานะ</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ผู้ดูแล</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-sky-50/60 transition-colors duration-150 odd:bg-white even:bg-slate-50/80">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(lead.received_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-800">{lead.name}</div>
                                                {lead.address && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]" title={lead.address}>{lead.address}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                                {lead.phone}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {lead.program || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColors[lead.status]}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {lead.profiles?.full_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-center space-x-2">
                                                    {user.role === 'after_care' && (
                                                        <button 
                                                            onClick={() => handleOpenAppointmentModal(lead)} 
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100 transition-colors"
                                                            title="ตั้งนัดหมาย"
                                                        >
                                                            <CalendarIcon className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleOpenModal(lead)} 
                                                        className="text-slate-600 hover:text-slate-900 bg-slate-100 p-2 rounded-lg hover:bg-slate-200 transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <EditIcon className="w-4 h-4"/>
                                                    </button>
                                                    {user.role === 'admin' && (
                                                        <button 
                                                            onClick={() => handleDeleteLead(lead.id)} 
                                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <TrashIcon className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <Card className="text-center py-16">
                         <h3 className="text-xl font-semibold text-slate-700">ยังไม่มีข้อมูลลีด</h3>
                        {user.role === 'admin' && <p className="text-slate-500 mt-2">เริ่มต้นด้วยการเพิ่มลีดใหม่เข้ามาในระบบ</p>}
                        {user.role === 'sales' && <p className="text-slate-500 mt-2">ยังไม่มีลีดที่ถูกมอบหมายให้คุณ</p>}
                    </Card>
                )
            )}
             <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                title={editingLead ? 'แก้ไขข้อมูลลีด' : 'เพิ่มลีดใหม่'}
                footer={
                    editingLead && (
                        <div className="flex justify-end space-x-2">
                            <Button onClick={() => handleExportLead('csv')} variant="secondary" className="text-sm">
                                <FileDownloadIcon className="mr-2 h-4 w-4"/>
                                Export CSV
                            </Button>
                            <Button onClick={() => handleExportLead('pdf')} variant="secondary" className="text-sm">
                                <FileDownloadIcon className="mr-2 h-4 w-4"/>
                                Export PDF
                            </Button>
                        </div>
                    )
                }
            >
                {editingLead && (
                    <div className="border-b border-slate-200 mb-4">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>แก้ไขข้อมูล</button>
                            <button onClick={() => setActiveTab('activity')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>ประวัติการติดตาม</button>
                        </nav>
                    </div>
                )}
                
                {activeTab === 'details' ? (
                     <LeadForm lead={editingLead} onSave={handleSaveLead} onCancel={handleCloseModal} />
                ) : (
                    <ActivityTimeline activities={activities} />
                )}
            </Modal>
            {schedulingLead && (
                <AppointmentModal 
                    isOpen={isAppointmentModalOpen}
                    onClose={handleCloseAppointmentModal}
                    leadName={schedulingLead.name}
                    onSubmit={handleCreateAppointments}
                />
            )}
        </div>
    );
};

// --- Sales Team Page ---
export const SalesTeamPage: React.FC = () => {
    const [team, setTeam] = useState<SalespersonWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { addToast } = useToast();

    const fetchTeamPerformance = useCallback(async () => {
        try {
            setTeam(await getSalesTeamPerformance());
        } catch (error: any) {
            addToast(getErrorMessage(error), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);
    
    useEffect(() => {
        setIsLoading(true);
        fetchTeamPerformance();
    }, [fetchTeamPerformance]);

    useEffect(() => {
        const profilesChannel = supabase
            .channel('public-profiles-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    addToast('ข้อมูลทีมขายมีการอัปเดต...', 'info');
                    fetchTeamPerformance();
                }
            )
            .subscribe();
        
        const leadsChannel = supabase
            .channel('public-leads-changes-for-team-kpi')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                () => {
                    addToast('ข้อมูลลีดมีการอัปเดต กำลังคำนวณ KPI ใหม่...', 'info');
                    fetchTeamPerformance();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profilesChannel);
            supabase.removeChannel(leadsChannel);
        };
    }, [fetchTeamPerformance, addToast]);


    const handleOpenEditModal = (salesperson: Salesperson) => {
        setEditingSalesperson(salesperson);
        setIsEditModalOpen(true);
    };
    
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSalesperson(null);
    };
    
    const handleOpenPasswordModal = (userId: string) => {
        setSelectedUserId(userId);
        setIsEditModalOpen(false); // Close the edit modal first
        setIsPasswordModalOpen(true);
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setSelectedUserId(null);
    };

    const handleSavePassword = async (password: string) => {
        if (!selectedUserId) return;
        try {
            await updateUserPassword(selectedUserId, password);
            addToast('เปลี่ยนรหัสผ่านสำเร็จ', 'success');
            handleClosePasswordModal();
        } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            if (errorMessage.includes('column "password" of relation "users" does not exist') ||
                errorMessage.includes('relation "users" does not exist')) {
                
                addToast('ฟังก์ชันเปลี่ยนรหัสผ่านในฐานข้อมูลล้าสมัย', 'error');
                addToast('ระบบต้องการการอัปเดตฐานข้อมูล กรุณาทำตามขั้นตอนในเมนู "ตั้งค่า" > "ทดสอบการตั้งค่า"', 'warning');
                console.error('Legacy Database Function Error:', errorMessage);
            } else {
                addToast(`เกิดข้อผิดพลาด: ${errorMessage}`, 'error');
            }
        }
    };

    const handleSaveSalesperson = async (salespersonData: SalespersonUpdate, id?: string) => {
        if (!id) return;
        try {
            await updateSalesperson(id, salespersonData);
            addToast('อัปเดตข้อมูลสำเร็จ', 'success');
            handleCloseEditModal();
        } catch (error: any) {
             addToast(`บันทึกล้มเหลว: ${getErrorMessage(error)}`, 'error');
        }
    };

    const handleAddUser = async (userData: { fullName: string, email: string, password: string, role: Role }) => {
        try {
            await adminCreateUser(userData);
            addToast('สร้างผู้ใช้ใหม่สำเร็จ', 'success');
            setIsAddUserModalOpen(false);
        } catch (error: any) {
            const errorMsg = getErrorMessage(error);
            if (errorMsg.includes('Could not find the function public.admin_create_user') || errorMsg.includes('404')) {
                addToast('ไม่พบฟังก์ชันสร้างผู้ใช้ในฐานข้อมูล', 'error');
                addToast('กรุณาไปที่เมนู "ตั้งค่า" > "ทดสอบการตั้งค่า" เพื่อติดตั้งฟังก์ชันนี้', 'warning');
            } else if (errorMsg.includes('provider_id')) {
                addToast('ฟังก์ชันฐานข้อมูลล้าสมัย กรุณาอัปเดตผ่านเมนูตั้งค่า', 'error');
                addToast('ไปที่ ตั้งค่า > ทดสอบการตั้งค่า > ข้อ 11 เพื่อรับคำสั่ง SQL แก้ไข', 'warning');
            } else {
                addToast(`สร้างผู้ใช้ล้มเหลว: ${errorMsg}`, 'error');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์พนักงานคนนี้?')) {
            try {
                await deleteSalesperson(id);
                addToast('ลบโปรไฟล์พนักงานขายแล้ว', 'success');
            } catch (error: any) {
                addToast(`ลบล้มเหลว: ${getErrorMessage(error)}`, 'error');
            }
        }
    };
    
    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">ประสิทธิภาพทีมขาย (KPIs)</h1>
                <Button onClick={() => setIsAddUserModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-1" /> เพิ่มผู้ใช้งาน
                </Button>
            </div>
            {team.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {team.map(s => (
                        <div key={s.id} className="relative group">
                             <SalespersonPerformanceCard salesperson={s} />
                             <div className="absolute top-6 right-6 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button onClick={() => handleOpenEditModal(s)} variant="secondary" className="p-2.5 !rounded-full shadow-md"><EditIcon /></Button>
                                <Button onClick={() => handleDelete(s.id)} variant="danger" className="p-2.5 !rounded-full shadow-md"><TrashIcon /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <h3 className="text-xl font-semibold text-slate-700">ยังไม่มีทีมขาย</h3>
                    <p className="text-slate-500 mt-2">เริ่มต้นด้วยการเพิ่มผู้ใช้งานใหม่เข้ามาในระบบ</p>
                </Card>
            )}

            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title='แก้ไขข้อมูลพนักงาน'>
                <SalespersonForm 
                    salesperson={editingSalesperson} 
                    onSave={handleSaveSalesperson} 
                    onCancel={handleCloseEditModal}
                    onChangePassword={handleOpenPasswordModal} 
                />
            </Modal>
             <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="เพิ่มผู้ใช้งานใหม่" size="md">
                <AddUserForm onSave={handleAddUser} onCancel={() => setIsAddUserModalOpen(false)} />
            </Modal>
             <Modal isOpen={isPasswordModalOpen} onClose={handleClosePasswordModal} title="เปลี่ยนรหัสผ่าน" size="md">
                <ChangePasswordForm onSave={handleSavePassword} onCancel={handleClosePasswordModal} />
            </Modal>
        </div>
    );
};

// --- Calendar Page ---
export const CalendarPage: React.FC<{ user: User }> = ({ user }) => {
    const [events, setEvents] = useState<any[]>([]); // Using 'any' to accommodate mixed types (appointments, bookings, birthdays)
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getCalendarEvents(user.role === 'admin' ? 'admin' : 'sales', user.id).then(data => {
            setEvents(data);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, [user.id, user.role, currentDate]);

    const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const calendarDays = useMemo(() => {
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const days = [];
        let day = new Date(startDate);
        while(days.length < 42) {
            days.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        return days;
    }, [startOfMonth]);
   
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        })
    }

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setIsEventDetailsOpen(true);
    };
    
    return (
        <div className="space-y-4">
             <h1 className="text-3xl font-bold text-slate-800">ปฏิทินนัดหมาย</h1>
             <Card>
                <div className="flex justify-between items-center mb-4">
                    <Button onClick={() => changeMonth(-1)} variant="secondary" className="!rounded-full !p-2 h-10 w-10">&lt;</Button>
                    <h2 className="text-xl font-semibold text-slate-700">{currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric'})}</h2>
                    <Button onClick={() => changeMonth(1)} variant="secondary" className="!rounded-full !p-2 h-10 w-10">&gt;</Button>
                </div>
                 {isLoading ? <Spinner/> : (
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {daysOfWeek.map(d => <div key={d} className="font-bold text-sm p-2 text-slate-500">{d}</div>)}
                        {calendarDays.map((d, i) => {
                            const isToday = new Date().toDateString() === d.toDateString();
                            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                            const dailyEvents = events.filter(e => new Date(e.start_time).toDateString() === d.toDateString());
                            return (
                                <div key={i} className={`h-28 md:h-36 border border-slate-200 rounded-lg p-2 text-left flex flex-col ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}`}>
                                    <span className={`text-sm font-bold self-start ${isToday ? 'bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center h-7 w-7' : ''} ${isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {d.getDate()}
                                    </span>
                                    <div className="text-xs mt-1 space-y-1 overflow-y-auto flex-grow custom-scrollbar">
                                        {dailyEvents.map(event => {
                                            // Determine style based on event type
                                            // Updated: Appointment (Default)=Violet, Booking=Emerald, Birthday=Sky (Light Blue)
                                            let bgClass = "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200"; // Default (Appointment)
                                            
                                            if (event.type === 'booking') {
                                                bgClass = "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"; // Booking - Green/Emerald
                                            } else if (event.type === 'birthday') {
                                                bgClass = "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200"; // Birthday - Light Blue (Requested)
                                            }

                                            return (
                                                <div 
                                                    key={event.id} 
                                                    className={`${bgClass} p-1 rounded mb-1 shadow-sm border cursor-pointer transition-colors duration-150`}
                                                    onClick={() => handleEventClick(event)}
                                                >
                                                    <div className="font-bold truncate">{event.title}</div>
                                                    {event.leads && event.type !== 'booking' && event.type !== 'birthday' && (
                                                        <div className="truncate text-[10px] flex items-center opacity-80">
                                                            <UsersIcon className="w-3 h-3 mr-1 inline" />
                                                            {event.leads.name}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 )}
             </Card>

             <Modal
                isOpen={isEventDetailsOpen}
                onClose={() => setIsEventDetailsOpen(false)}
                title={
                    selectedEvent?.type === 'birthday' ? 'รายละเอียดวันเกิด' :
                    selectedEvent?.type === 'booking' ? 'รายละเอียดการจอง' : 'รายละเอียดนัดหมาย'
                }
                size="md"
             >
                {selectedEvent && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${
                            selectedEvent.type === 'birthday' ? 'bg-sky-50 border-sky-100' : // Birthday -> Sky
                            selectedEvent.type === 'booking' ? 'bg-emerald-50 border-emerald-100' : // Booking -> Emerald
                            'bg-violet-50 border-violet-100' // Default -> Violet
                        }`}>
                            <div className="flex items-start">
                                <div className={`p-2 rounded-full mr-4 ${
                                    selectedEvent.type === 'birthday' ? 'bg-sky-200 text-sky-700' :
                                    selectedEvent.type === 'booking' ? 'bg-emerald-200 text-emerald-700' :
                                    'bg-violet-200 text-violet-700'
                                }`}>
                                    {selectedEvent.type === 'birthday' ? <CakeIcon className="w-6 h-6"/> :
                                     selectedEvent.type === 'booking' ? <CheckCircleIcon className="w-6 h-6"/> :
                                     <CalendarIcon className="w-6 h-6"/>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{selectedEvent.title}</h3>
                                    <p className="text-sm text-slate-500">
                                        {new Date(selectedEvent.start_time).toLocaleDateString('th-TH', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                        {selectedEvent.type !== 'birthday' && selectedEvent.type !== 'booking' && (
                                            <>
                                                <br/>
                                                <span className="flex items-center mt-1">
                                                    <ClockIcon className="w-4 h-4 mr-1"/>
                                                    {new Date(selectedEvent.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(selectedEvent.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-600 mb-3 border-b border-slate-200 pb-2">ข้อมูลเพิ่มเติม</h4>
                            <div className="space-y-3 text-sm">
                                {selectedEvent.leads?.name && (
                                    <div className="flex">
                                        <span className="text-slate-500 w-24 flex-shrink-0">ชื่อลูกค้า:</span>
                                        <span className="font-medium text-slate-800">{selectedEvent.leads.name}</span>
                                    </div>
                                )}
                                
                                {selectedEvent.type === 'booking' && (
                                    <>
                                        <div className="flex">
                                            <span className="text-slate-500 w-24 flex-shrink-0">วันที่จอง:</span>
                                            <span className="font-medium text-slate-800">
                                                {new Date(selectedEvent.start_time).toLocaleDateString('th-TH')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                             <Button onClick={() => setIsEventDetailsOpen(false)} variant="secondary">ปิด</Button>
                        </div>
                    </div>
                )}
             </Modal>
        </div>
    );
};

// --- Settings Page ---
const ProgramManagement: React.FC = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [newProgramName, setNewProgramName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const fetchPrograms = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPrograms();
            setPrograms(data);
        } catch (error: any) {
            addToast(`เกิดข้อผิดพลาดในการโหลดโปรแกรม: ${getErrorMessage(error)}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    const handleAddProgram = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProgramName.trim()) {
            addToast('กรุณากรอกชื่อโปรแกรม', 'warning');
            return;
        }
        try {
            await createProgram(newProgramName.trim());
            addToast('เพิ่มโปรแกรมสำเร็จ', 'success');
            setNewProgramName('');
            fetchPrograms(); // Refresh list
        } catch (error: any) {
            addToast(`เพิ่มโปรแกรมล้มเหลว: ${getErrorMessage(error)}`, 'error');
        }
    };

    const handleDeleteProgram = async (id: number) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรแกรมนี้?')) {
            try {
                await deleteProgram(id);
                addToast('ลบโปรแกรมสำเร็จ', 'success');
                fetchPrograms(); // Refresh list
            } catch (error: any) {
                addToast(`ลบโปรแกรมล้มเหลว: ${getErrorMessage(error)}`, 'error');
            }
        }
    };

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">จัดการโปรแกรมที่น่าสนใจ</h2>
            <form onSubmit={handleAddProgram} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    placeholder="ชื่อโปรแกรมใหม่"
                    className="flex-grow p-2 border rounded-lg"
                />
                <Button type="submit" variant="primary">
                    <PlusIcon className="w-5 h-5 mr-1" /> เพิ่ม
                </Button>
            </form>
            {isLoading ? (
                <Spinner />
            ) : (
                <div className="space-y-2">
                    {programs.length > 0 ? programs.map((program) => (
                        <div key={program.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-700">{program.name}</span>
                            <button onClick={() => handleDeleteProgram(program.id)} className="text-red-400 hover:text-red-600">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )) : (
                        <p className="text-slate-500 text-center py-4">ยังไม่มีโปรแกรม</p>
                    )}
                </div>
            )}
        </Card>
    );
};

export const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าระบบ</h1>
            <ProgramManagement />
            <ConnectionTest/>
            <SystemTriggers/>
        </div>
    );
};

const SystemTriggers: React.FC = () => {
    const { addToast } = useToast();
    const auth = useContext(AuthContext); // Need to access user for some fetch calls
    
    const runCheck = async (checkName: string) => {
        addToast(`กำลังรัน ${checkName}...`, 'info');
        
        try {
            if (checkName === "Check Birthdays") {
                 const { today, thisMonth } = await getBirthdays();
                 if (today.length > 0 || thisMonth.length > 0) {
                     await sendLineNotification('birthday_report', { 
                         birthdaysToday: today, 
                         birthdaysMonth: thisMonth 
                     });
                     addToast(`ส่งรายงานวันเกิดเรียบร้อย (วันนี้ ${today.length}, เดือนนี้ ${thisMonth.length})`, 'success');
                 } else {
                     addToast('ไม่พบข้อมูลวันเกิดในช่วงนี้', 'info');
                 }
            } 
            else if (checkName === "Check Idle Leads") {
                const leads = await getLeads('admin'); // Fetch all leads
                const now = new Date();
                const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
                
                // Filter: Status is New or Uncalled AND Created more than 10 mins ago
                const idleLeads = leads.filter(l => 
                    (l.status === 'ใหม่' || l.status === 'ยังไม่ได้โทร') && 
                    new Date(l.created_at) < tenMinutesAgo
                );

                if (idleLeads.length > 0) {
                    await sendLineNotification('idle_leads', { leadsList: idleLeads });
                    addToast(`ส่งแจ้งเตือน Lead ค้าง ${idleLeads.length} รายการ`, 'success');
                } else {
                    addToast('ไม่พบ Lead ที่ค้างเกิน 10 นาที', 'success');
                }
            }
            else if (checkName === "Reassign Idle Leads") {
                const leads = await getLeads('admin');
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                 // Filter: Status is New or Uncalled AND Created more than 24 hours ago
                const overdueLeads = leads.filter(l => 
                    (l.status === 'ใหม่' || l.status === 'ยังไม่ได้โทร') && 
                    new Date(l.created_at) < oneDayAgo
                );

                if (overdueLeads.length > 0) {
                     // In a real scenario, we would update the 'assigned_to' field here.
                     // For now, we report them as "Processed for Reassignment"
                    await sendLineNotification('reassign_leads', { leadsList: overdueLeads });
                    addToast(`แจ้งเตือนการโอนย้าย Lead ${overdueLeads.length} รายการ`, 'success');
                } else {
                     addToast('ไม่พบ Lead ที่ค้างเกิน 24 ชั่วโมง', 'success');
                }
            }
            else if (checkName === "Check Follow-ups") {
                // Assuming admin checks for everyone, or current user check for themselves.
                // Let's use 'admin' mode to check for ALL followups if the user is admin.
                const userRole = auth?.user?.role || 'sales';
                const userId = auth?.user?.id || '';
                
                const events = await getCalendarEvents(userRole === 'admin' ? 'admin' : 'sales', userId);
                const todayStr = new Date().toDateString();
                
                const followUpsToday = events.filter(e => 
                    new Date(e.start_time).toDateString() === todayStr
                );

                if (followUpsToday.length > 0) {
                    await sendLineNotification('followup_reminder', { followUps: followUpsToday });
                    addToast(`แจ้งเตือนนัดหมายวันนี้ ${followUpsToday.length} รายการ`, 'success');
                } else {
                    addToast('ไม่มีนัดหมายติดตามผลสำหรับวันนี้', 'info');
                }
            }
            else if (checkName === "Test LINE") {
                await sendLineNotification('test', {
                    leadName: 'คุณสมชาย ทดสอบ',
                    program: 'โปรแกรมยอดนิยม A',
                    phone: '099-999-9999',
                    status: 'ทดสอบ',
                    salesName: 'Admin System',
                    receivedDate: new Date().toISOString(),
                    address: '123/45 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110',
                    notes: 'ลูกค้าสนใจโปรโมชั่นพิเศษ และสะดวกให้ติดต่อกลับช่วงบ่าย'
                });
                addToast('ส่งข้อความทดสอบสำเร็จ', 'success');
            }
        } catch (e: any) {
             addToast(`เกิดข้อผิดพลาด: ${getErrorMessage(e)}`, 'error');
             console.error(e);
        }
    };
    
    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">System Triggers (จำลองงานอัตโนมัติ)</h2>
            <div className="space-y-4">
                <TriggerItem title="แจ้งเตือน Lead ค้าง (> 10 นาที)" description="ค้นหา Lead ที่ยังไม่ได้โทรและค้างเกิน 10 นาที" onRun={() => runCheck("Check Idle Leads")}/>
                <TriggerItem title="เด้งงาน Lead ค้าง (> 24 ชม.)" description="ย้าย Lead ที่ยังไม่ได้โทรและค้างเกิน 24 ชั่วโมงให้เซลล์คนถัดไป" onRun={() => runCheck("Reassign Idle Leads")}/>
                <TriggerItem title="เตือน Follow-Up (วันนี้)" description="ค้นหา Lead ที่มีนัดหมายติดตามผลในวันนี้" onRun={() => runCheck("Check Follow-ups")}/>
                <TriggerItem title="Check Today's Birthdays" description="จำลองการตรวจสอบวันเกิดลูกค้าประจำวัน และส่ง LINE Notify" onRun={() => runCheck("Check Birthdays")}/>
                <TriggerItem title="Test LINE Notification" description="ส่งข้อความทดสอบไปยัง LINE Group เพื่อตรวจสอบความสวยงาม" onRun={() => runCheck("Test LINE")}/>
            </div>
        </Card>
    );
};

const TriggerItem: React.FC<{title: string, description: string, onRun: () => void}> = ({title, description, onRun}) => (
    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Button onClick={onRun} variant="secondary">Run Check</Button>
    </div>
);
