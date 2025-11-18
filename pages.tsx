import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { AuthContext } from './App';
import { User, Lead, Salesperson, CalendarEvent, Database, Role, LeadActivity } from './types.ts';
import { 
    getLeads, getSalesTeam, getCalendarEvents, getDashboardStats, getSalesPerformance, getConversionRates,
    createLead, updateLead, deleteLead, updateSalesperson, deleteSalesperson,
    statusColors, getBirthdays, getSalesTrend, exportToPDF, exportToCSV,
    getLeadActivities, createLeadActivity, updateUserPassword, adminCreateUser
} from './services.ts';
import {
    Card, StatCard, Button, Modal, Spinner, LeadForm, SalespersonForm, ChangePasswordForm, AddUserForm,
    SalesPerformanceChart, ConversionRatePieChart, SalesTrendChart, ConnectionTest, ActivityTimeline,
    PlusIcon, EditIcon, TrashIcon, CakeIcon, PhoneIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, InfoCircleIcon,
    UsersIcon, TeamIcon, FileDownloadIcon,
    // FIX: Imported CalendarIcon to resolve usage error.
    CalendarIcon
} from './components.tsx';
import { useToast } from './hooks/useToast.tsx';
import { supabase } from './supabaseClient.ts';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type SalespersonInsert = Database['public']['Tables']['profiles']['Insert'];
type SalespersonUpdate = Database['public']['Tables']['profiles']['Update'];


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
                if (error.message.includes('Email not confirmed')) {
                    setLoginError('Email not confirmed');
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
                    <strong>หมายเหตุ:</strong> กรุณาใช้บัญชีผู้ใช้ (อีเมล/รหัสผ่าน) ที่มีอยู่จริงใน Supabase Project ของคุณ
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
            addToast(`Export ข้อมูลล้มเหลว: ${error.message}`, 'error');
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="ลีดทั้งหมด" value={stats.totalLeads.toLocaleString()} icon={<UsersIcon className="w-6 h-6"/>} />
                <StatCard title="ลีดใหม่" value={stats.newLeads.toLocaleString()} icon={<PlusIcon className="w-6 h-6"/>} />
                <StatCard title="ยอดขาย" value={`฿${stats.totalValue.toLocaleString()}`} icon={<span className="text-2xl font-bold">฿</span>} />
                <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={<CheckCircleIcon className="w-6 h-6"/>} />
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
            setStats(await getDashboardStats('sales', user.id));
            setConversionData(await getConversionRates(user.id));
        }
        fetchData();
    }, [user.id]);

    if (!stats) return <Spinner />;
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">แดชบอร์ดฝ่ายขาย</h1>
                <p className="text-slate-500">ภาพรวมข้อมูลการขายของคุณ</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h3 className="font-bold mb-4 text-slate-700 flex items-center"><CakeIcon className="mr-2 text-orange-400"/>รายงานวันเกิด</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <StatCard title="เกิดวันนี้" value={birthdays.today.length.toString()} icon={<CakeIcon className="w-6 h-6"/>} />
                <StatCard title="เกิดเดือนนี้" value={birthdays.thisMonth.length.toString()} icon={<CalendarIcon className="w-6 h-6"/>} />
            </div>
            <div>
                <h4 className="font-semibold text-sky-700">รายชื่อลูกค้าที่เกิดวันนี้</h4>
                {birthdays.today.length > 0 ? (
                    <ul className="text-sm text-slate-600 space-y-2 mt-2">
                        {birthdays.today.map(lead => (
                            <li key={lead.id} className="p-2 bg-sky-50 rounded-lg">{lead.name} - {lead.phone}</li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-slate-500 mt-2">ไม่มีวันเกิดวันนี้</p>}
            </div>
        </Card>
    )
}

// --- Leads Page ---
const LeadCard: React.FC<{lead: Lead, onEdit: (lead: Lead) => void, onDelete: (id: number) => void}> = ({lead, onEdit, onDelete}) => {
    const [isRecent, setIsRecent] = useState(false);
    const auth = useContext(AuthContext);

    useEffect(() => {
        if (lead.last_update_date) {
            const now = new Date();
            const lastUpdate = new Date(lead.last_update_date);
            const diffInSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

            if (diffInSeconds >= 0 && diffInSeconds < 5) {
                setIsRecent(true);
                const timer = setTimeout(() => setIsRecent(false), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [lead.last_update_date]);

    return (
        <Card className={`relative overflow-hidden flex flex-col space-y-3 ${isRecent ? 'flash-update' : ''}`}>
             <div className={`absolute top-0 left-0 bottom-0 w-2 ${statusColors[lead.status]}`}></div>
             <div className="pl-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{lead.name}</h3>
                        <p className="text-sm text-slate-600">{lead.program}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${statusColors[lead.status]}`}>
                        {lead.status}
                    </span>
                </div>
                <div className="text-sm text-slate-500 space-y-1.5 mt-2">
                    <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-slate-400" /> {lead.phone}</p>
                    {lead.birthday && <p className="flex items-center"><CakeIcon className="w-4 h-4 mr-2 text-slate-400" /> {new Date(lead.birthday).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                    {lead.address && <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2 text-slate-400" /> {lead.address}</p>}
                </div>
                <div className="text-xs text-slate-400 pt-3 mt-3 border-t">
                    <p>ได้รับ: {new Date(lead.received_date).toLocaleString('th-TH')}</p>
                    <p>ผู้ดูแล: {lead.profiles?.full_name || 'N/A'}</p>
                </div>
                <div className="flex justify-end items-center space-x-2 mt-3">
                    {auth?.user?.role === 'admin' && (
                         <Button onClick={() => onDelete(lead.id)} variant="danger" className="p-2 h-9 w-9 !rounded-full">
                            <TrashIcon className="w-4 h-4"/>
                        </Button>
                    )}
                    <Button onClick={() => onEdit(lead)} variant="secondary" className="px-3 py-2 text-sm font-bold">
                        <EditIcon className="w-4 h-4 mr-1.5"/> แก้ไข / อัปเดต
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export const LeadsPage: React.FC<{ user: User, setNotificationCount: (count: number) => void }> = ({ user, setNotificationCount }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<LeadActivity[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const { addToast } = useToast();

    const fetchLeads = useCallback(async () => {
        try {
            const data = await getLeads(user.role, user.id);
            setLeads(data);
            if(user.role === 'sales') {
                const unreadCount = data.filter(l => l.status === 'ใหม่' || l.status === 'ยังไม่ได้โทร').length;
                setNotificationCount(unreadCount);
            }
        } catch (error: any) {
            addToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
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
                        addToast('รายการลีดมีการอัปเดต...', 'info');
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

    const handleSaveLead = async (leadData: LeadInsert, id?: number) => {
        try {
            if (id && editingLead) {
                // Check for changes to create activity log
                const changes: string[] = [];
                if (editingLead.status !== leadData.status) {
                    changes.push(`เปลี่ยนสถานะเป็น "${leadData.status}"`);
                }
                if (editingLead.assigned_to !== leadData.assigned_to) {
                     const team = await getSalesTeam();
                     const newAssignee = team.find(s => s.id === leadData.assigned_to);
                     changes.push(`มอบหมายงานให้ "${newAssignee?.full_name || 'N/A'}"`);
                }
                if (changes.length > 0) {
                     await createLeadActivity(id, changes.join(', '));
                }
                await updateLead(id, leadData as LeadUpdate);
                addToast('อัปเดตข้อมูลลีดสำเร็จ', 'success');
            } else {
                const newLead = await createLead(leadData);
                 if (newLead) {
                    await createLeadActivity(newLead.id, 'สร้างลีดใหม่');
                }
                addToast('เพิ่มลีดใหม่สำเร็จ', 'success');
            }
            handleCloseModal();
        } catch (error: any) {
             addToast(`บันทึกข้อมูลล้มเหลว: ${error.message}`, 'error');
        }
    };

    const handleDeleteLead = async (id: number) => {
         if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบลีดนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            try {
                await deleteLead(id);
                addToast('ลบลีดสำเร็จ', 'success');
            } catch (error: any) {
                addToast(`ลบล้มเหลว: ${error.message}`, 'error');
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
            addToast(`Export ข้อมูลล้มเหลว: ${error.message}`, 'error');
            console.error(error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">
                    {user.role === 'admin' ? 'จัดการลีดทั้งหมด' : 'ลีดของฉัน'}
                </h1>
                {user.role === 'admin' && (
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="w-5 h-5 mr-1" /> เพิ่มลีดใหม่
                    </Button>
                )}
            </div>
            {isLoading && leads.length === 0 ? <Spinner /> : (
                leads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {leads.map(lead => <LeadCard key={lead.id} lead={lead} onEdit={handleOpenModal} onDelete={handleDeleteLead}/>)}
                    </div>
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
        </div>
    );
};

// --- Sales Team Page ---
export const SalesTeamPage: React.FC = () => {
    const [team, setTeam] = useState<Salesperson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { addToast } = useToast();

    const fetchTeam = useCallback(async () => {
        try {
            setTeam(await getSalesTeam());
        } catch (error: any) {
            addToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);
    
    useEffect(() => {
        setIsLoading(true);
        fetchTeam();
    }, [fetchTeam]);

    useEffect(() => {
        const channel = supabase
            .channel('public-profiles-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    addToast('ข้อมูลทีมขายมีการอัปเดต...', 'info');
                    fetchTeam();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTeam, addToast]);


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
            addToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
        }
    };

    const handleSaveSalesperson = async (salespersonData: SalespersonUpdate, id?: string) => {
        if (!id) return;
        try {
            await updateSalesperson(id, salespersonData);
            addToast('อัปเดตข้อมูลสำเร็จ', 'success');
            handleCloseEditModal();
        } catch (error: any) {
             addToast(`บันทึกล้มเหลว: ${error.message}`, 'error');
        }
    };

    const handleAddUser = async (userData: { fullName: string, email: string, password: string, role: Role }) => {
        try {
            await adminCreateUser(userData);
            addToast('สร้างผู้ใช้ใหม่สำเร็จ', 'success');
            setIsAddUserModalOpen(false);
        } catch (error: any) {
            addToast(`สร้างผู้ใช้ล้มเหลว: ${error.message}`, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์พนักงานคนนี้?')) {
            try {
                await deleteSalesperson(id);
                addToast('ลบโปรไฟล์พนักงานขายแล้ว', 'success');
            } catch (error: any) {
                addToast(`ลบล้มเหลว: ${error.message}`, 'error');
            }
        }
    };
    
    if (isLoading) return <Spinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">จัดการทีมขาย</h1>
                <Button onClick={() => setIsAddUserModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-1" /> เพิ่มผู้ใช้งาน
                </Button>
            </div>
            <Card>
                <div className="divide-y divide-slate-100">
                    {team.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                                <img src={s.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${s.full_name}`} alt={s.full_name || ''} className="w-12 h-12 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-slate-800">{s.full_name}</p>
                                    <p className="text-sm text-slate-500">{s.email}</p>
                                    <p className={`text-xs font-medium uppercase tracking-wider ${s.role === 'admin' ? 'text-sky-600' : 'text-orange-500'}`}>{s.role}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Button onClick={() => handleOpenEditModal(s)} variant="secondary" className="p-2.5 !rounded-lg"><EditIcon /></Button>
                                <Button onClick={() => handleDelete(s.id)} variant="danger" className="p-2.5 !rounded-lg"><TrashIcon /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
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
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getCalendarEvents(user.role, user.id).then(data => {
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
                                    <div className="text-xs mt-1 space-y-1 overflow-y-auto flex-grow">
                                        {dailyEvents.map(event => (
                                            <div key={event.id} className="bg-sky-100 text-sky-800 p-1 rounded font-medium truncate">
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 )}
             </Card>
        </div>
    );
};

// --- Settings Page ---
export const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าระบบ</h1>
            <ConnectionTest/>
            <SystemTriggers/>
        </div>
    );
};

const SystemTriggers: React.FC = () => {
    const { addToast } = useToast();
    const runCheck = (checkName: string) => {
        addToast(`กำลังรัน ${checkName}...`, 'info');
        setTimeout(() => {
             addToast(`${checkName} เสร็จสิ้น!`, 'success');
        }, 2000);
    };
    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">System Triggers (จำลองงานอัตโนมัติ)</h2>
            <div className="space-y-4">
                <TriggerItem title="แจ้งเตือน Lead ค้าง (> 10 นาที)" description="ค้นหา Lead ที่ยังไม่ได้โทรและค้างเกิน 10 นาที" onRun={() => runCheck("Check Idle Leads")}/>
                <TriggerItem title="เด้งงาน Lead ค้าง (> 24 ชม.)" description="ย้าย Lead ที่ยังไม่ได้โทรและค้างเกิน 24 ชั่วโมงให้เซลล์คนถัดไป" onRun={() => runCheck("Reassign Idle Leads")}/>
                <TriggerItem title="เตือน Follow-Up (วันนี้)" description="ค้นหา Lead ที่มีนัดหมายติดตามผลในวันนี้" onRun={() => runCheck("Check Follow-ups")}/>
                <TriggerItem title="Check Today's Birthdays" description="จำลองการตรวจสอบวันเกิดลูกค้าประจำวัน" onRun={() => runCheck("Check Birthdays")}/>
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