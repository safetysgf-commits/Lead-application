
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from './context.ts';
import { User, Lead, LeadActivity, LeadStatus, LeadSource, Salesperson } from './types.ts';
import { 
    getLeads, getSalesTeam, getCalendarEvents, getDashboardStats, createLead, updateLead, deleteLead,
    getLeadActivities, createLeadActivity, sendLineNotification,
    exportToCSV, createFollowUpAppointments,
    adminCreateUser, updateUserPassword, deleteSalesperson, getSalesTeamPerformance, getBirthdays,
    SQL_CREATE_DEFAULT_ADMIN,
    SQL_ADMIN_CREATE_USER, isUserOnline, updateSalesperson,
    SQL_FIX_ROLE_CONSTRAINT
} from './services.ts';
import {
    Card, StatCard, Button, Modal, Spinner, LeadForm, ActivityTimeline, 
    FunnelChart, SalesPerformanceChart,
    PlusIcon, EditIcon, TrashIcon, PhoneIcon, CalendarIcon, CheckCircleIcon, UsersIcon, FileDownloadIcon, InfoCircleIcon, XCircleIcon,
    SalespersonForm, AddUserForm, ChangePasswordForm, ConnectionTest, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon, UserForm
} from './components.tsx';
import { useToast } from './hooks/useToast.tsx';

// --- Helper ---
const getErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error occurred';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    // Supabase / Postgrest error
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    // Fallback
    try {
        return JSON.stringify(error);
    } catch {
        return 'An unknown error occurred';
    }
};

// --- Auth ---
export const LoginPage: React.FC = () => {
    const auth = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const [showTest, setShowTest] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (auth?.login) {
            setIsLoading(true);
            try {
                await auth.login(email, password);
            } catch (error: any) {
                const msg = getErrorMessage(error);
                console.error("Login error:", error);
                
                // Detect schema error and guide user to fix
                if (msg.includes("Database error querying schema") || msg.includes("relation") || msg.includes("profiles")) {
                    addToast("ไม่พบฐานข้อมูล! กรุณารัน Script '0. One-Click Setup' ในหน้าต่างที่เด้งขึ้นมา", 'error');
                    setShowTest(true);
                } else if (msg.includes("Invalid login credentials")) {
                    addToast("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (หากเพิ่งเริ่มระบบ ให้รัน Script Setup)", 'error');
                    setShowTest(true);
                } else {
                    addToast(msg, 'error');
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] p-4 font-sans">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Lead CRM</h1>
                    <p className="text-slate-400 mt-2">ลงชื่อเข้าใช้เพื่อเริ่มต้น</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">อีเมล</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4DA6FF] focus:border-transparent outline-none transition-all"
                            placeholder="user@example.com"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">รหัสผ่าน</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4DA6FF] focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <Button type="submit" className="w-full py-3 text-lg shadow-lg shadow-blue-200" disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'เข้าสู่ระบบ'}
                    </Button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                    <button onClick={() => setShowTest(true)} className="text-xs text-slate-400 hover:text-[#4DA6FF]">
                        Admin Default Setup (Run Script)
                    </button>
                </div>
            </div>
            
            <Modal isOpen={showTest} onClose={() => setShowTest(false)} title="System Setup & Fix">
                <ConnectionTest />
            </Modal>
        </div>
    );
};

// --- Dashboard ---
export const Dashboard: React.FC<{ user: User }> = ({ user }) => {
    const [stats, setStats] = useState<any>(null);
    const [todaysTasks, setTodaysTasks] = useState<Lead[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [birthdays, setBirthdays] = useState<{today: any[], thisMonth: any[]} | null>(null);
    
    useEffect(() => {
        const fetch = async () => {
            // Calculate date range for the selected month for Reports/Graphs
            const [year, month] = selectedMonth.split('-').map(Number);
            const start = new Date(year, month - 1, 1).toISOString();
            const end = new Date(year, month, 0, 23, 59, 59).toISOString();
            
            const s = await getDashboardStats(user.role === 'admin' ? 'admin' : 'sales', user.role === 'admin' ? undefined : user.id, { start, end });
            setStats(s);

            const b = await getBirthdays(user.role === 'admin' ? undefined : user.id);
            setBirthdays(b);

            // Fetch "To-Do Today" (New Leads or Follow-ups for today)
            const allLeads = await getLeads(user.role === 'admin' ? 'admin' : 'sales', user.id);
            const todayStr = new Date().toDateString();
            const tasks = allLeads.filter(l => 
                (l.status === LeadStatus.New && new Date(l.created_at).toDateString() === todayStr) || 
                (l.status === LeadStatus.FollowUp) 
            ).slice(0, 5);
            setTodaysTasks(tasks);
        };
        fetch();
    }, [user, selectedMonth]);

    if (!stats) return <Spinner />;

    const funnelData = [
        { name: 'Lead ทั้งหมด', value: stats.totalLeads, fill: '#94a3b8' }, // Slate
        { name: 'ส่งต่อ Sell', value: stats.sellCount, fill: '#60a5fa' }, // Blue
        { name: 'ปิดการขาย (CRM)', value: stats.crmCount, fill: '#34d399' } // Emerald
    ];

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-slate-800">ภาพรวมระบบ (Dashboard)</h1>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-600">เดือน:</label>
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg text-sm"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Lead ทั้งหมด" value={stats.totalLeads} subtext="สะสมทั้งหมด" icon={<UsersIcon className="text-slate-500"/>} colorClass="bg-white border-slate-100" />
                <StatCard title="Lead ใหม่วันนี้" value={stats.newLeads} icon={<UsersIcon className="text-blue-500"/>} colorClass="bg-blue-50 border-blue-100" />
                <StatCard title="งาน Sell คงค้าง" value={stats.sellCount} subtext="ยังไม่ปิดการขาย" icon={<PhoneIcon className="text-orange-500"/>} colorClass="bg-orange-50 border-orange-100" />
                <StatCard title="ลูกค้า (CRM)" value={stats.crmCount} subtext="ปิดการขายสำเร็จ" icon={<CheckCircleIcon className="text-green-500"/>} colorClass="bg-green-50 border-green-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Tasks */}
                    <Card className="p-4">
                        <h3 className="font-bold text-slate-700 mb-4">งานต้องทำวันนี้</h3>
                         {todaysTasks.length > 0 ? (
                            <div className="space-y-3">
                                {todaysTasks.map(task => (
                                    <div key={task.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-slate-800">{task.name}</p>
                                            <p className="text-xs text-slate-500">{task.program || 'ไม่ระบุ'} • {task.status}</p>
                                        </div>
                                        <Button variant="secondary" className="px-3 py-1 text-xs">ดูรายละเอียด</Button>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-slate-400 text-sm text-center py-4">ไม่มีงานเร่งด่วนสำหรับวันนี้</p>}
                    </Card>

                    {/* Breakdown by Salesperson */}
                    <Card className="p-4" noPadding>
                        <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-700">สรุปรายบุคคล (ทั้งหมด)</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs">
                                    <tr>
                                        <th className="p-3">พนักงาน</th>
                                        <th className="p-3 text-center">Lead ทั้งหมด</th>
                                        <th className="p-3 text-center">ค้าง (Backlog)</th>
                                        <th className="p-3 text-center">สำเร็จ (Won)</th>
                                        <th className="p-3 text-right">ยอดขาย (เดือนนี้)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.leadsByPerson?.map((p: any, i: number) => (
                                        <tr key={i} className="text-sm">
                                            <td className="p-3 font-medium">{p.name}</td>
                                            <td className="p-3 text-center">{p.total}</td>
                                            <td className="p-3 text-center text-orange-500">{p.backlog}</td>
                                            <td className="p-3 text-center text-green-500">{p.won}</td>
                                            <td className="p-3 text-right">฿{p.value.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <FunnelChart data={funnelData} />
                    
                    {/* Birthday Widget */}
                    <Card className="p-4">
                         <h3 className="font-bold text-slate-700 mb-4 flex items-center"><span className="text-xl mr-2">🎂</span> วันเกิดลูกค้า</h3>
                         <div className="space-y-4">
                             <div>
                                 <p className="text-xs font-bold text-pink-500 mb-2 uppercase tracking-wide">วันนี้ ({birthdays?.today.length || 0})</p>
                                 {birthdays?.today.length ? (
                                     <ul className="space-y-2">
                                         {birthdays.today.map((l:any) => (
                                             <li key={l.id} className="text-sm flex justify-between">
                                                 <span>{l.name}</span>
                                                 <span className="text-slate-400 text-xs">{l.phone}</span>
                                             </li>
                                         ))}
                                     </ul>
                                 ) : <p className="text-xs text-slate-400">ไม่มีวันเกิดวันนี้</p>}
                             </div>
                             <div className="pt-2 border-t border-slate-100">
                                 <p className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wide">เดือนนี้ ({birthdays?.thisMonth.length || 0})</p>
                                  {birthdays?.thisMonth.length ? (
                                     <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                         <ul className="space-y-2">
                                             {birthdays.thisMonth.map((l:any) => (
                                                 <li key={l.id} className="text-sm flex justify-between">
                                                     <span>{l.name}</span>
                                                     <span className="text-slate-400 text-xs">{new Date(l.birthday).getDate()}</span>
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                 ) : <p className="text-xs text-slate-400">ไม่มีวันเกิดเดือนนี้</p>}
                             </div>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- Lead Management ---
export const LeadsPage: React.FC<{ user: User, setNotificationCount: (n:number)=>void }> = ({ user, setNotificationCount }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const { addToast } = useToast();

    const fetchLeads = useCallback(async () => {
        const data = await getLeads(user.role === 'admin' ? 'admin' : 'sales', user.id);
        setLeads(data);
    }, [user]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const filteredLeads = leads.filter(l => filterStatus === 'All' || l.status === filterStatus);

    const handleSave = async (data: any, id?: number) => {
        try {
            if (id) await updateLead(id, data);
            else {
                const newLead = await createLead(data);
                sendLineNotification('new_lead', { leadName: newLead.name, phone: newLead.phone });
            }
            addToast('บันทึกสำเร็จ', 'success');
            setIsModalOpen(false);
            fetchLeads();
        } catch (e) { addToast(getErrorMessage(e), 'error'); }
    }

    const handleDelete = async (id: number) => {
        if(!confirm('ยืนยันการลบ Lead นี้?')) return;
        try {
            const leadToDelete = leads.find(l => l.id === id);
            if(leadToDelete) {
                // Send notification before deleting because we need the data
                sendLineNotification('delete_lead', { leadName: leadToDelete.name, phone: leadToDelete.phone });
            }
            await deleteLead(id);
            addToast('ลบข้อมูลสำเร็จ', 'success');
            fetchLeads();
        } catch (e) { addToast(getErrorMessage(e), 'error'); }
    }

    const handleExportExcel = () => {
        exportToCSV(filteredLeads, 'leads_export.csv');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-2xl font-bold text-slate-800">จัดการ Lead</h1>
                <div className="flex gap-2">
                     <Button onClick={handleExportExcel} variant="secondary">
                        <FileDownloadIcon className="mr-1 w-5 h-5"/> Export Excel
                    </Button>
                    <Button onClick={() => { setEditingLead(null); setIsModalOpen(true); }}>
                        <PlusIcon className="mr-1 w-5 h-5"/> เพิ่ม Lead
                    </Button>
                </div>
            </div>

            <Card className="p-4" noPadding>
                <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
                    {['All', ...Object.values(LeadStatus)].map(s => (
                        <button 
                            key={s} 
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-[#4DA6FF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">ชื่อลูกค้า</th>
                                <th className="p-4 font-semibold">ช่องทาง</th>
                                <th className="p-4 font-semibold">สถานะ</th>
                                <th className="p-4 font-semibold">ผู้รับผิดชอบ</th>
                                <th className="p-4 font-semibold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors text-sm text-slate-700">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{lead.name}</p>
                                        <p className="text-xs text-slate-500">{lead.phone}</p>
                                    </td>
                                    <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{lead.source || '-'}</span></td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs text-white ${lead.status === 'สำเร็จ' ? 'bg-green-500' : lead.status === 'ยกเลิก' ? 'bg-red-400' : 'bg-blue-400'}`}>{lead.status}</span></td>
                                    <td className="p-4 text-slate-500">{lead.profiles?.full_name || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} className="text-slate-400 hover:text-[#4DA6FF]">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(lead.id)} className="text-slate-400 hover:text-red-500">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLead ? 'แก้ไข Lead' : 'เพิ่ม Lead ใหม่'}>
                <LeadForm lead={editingLead} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

// --- Sell Panel ---
export const SellPage: React.FC<{ user: User }> = ({ user }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [logNote, setLogNote] = useState('');
    const [logStatus, setLogStatus] = useState<LeadStatus>(LeadStatus.Contacted);
    const { addToast } = useToast();
    const [activities, setActivities] = useState<LeadActivity[]>([]);

    // Fetch leads needing contact (New, Uncalled, FollowUp)
    const fetchWork = useCallback(async () => {
        const all = await getLeads(user.role === 'admin' ? 'admin' : 'sales', user.id);
        setLeads(all.filter(l => [LeadStatus.New, LeadStatus.Uncalled, LeadStatus.FollowUp].includes(l.status)));
    }, [user]);

    useEffect(() => { fetchWork(); }, [fetchWork]);
    
    useEffect(() => {
        if(selectedLead) {
            getLeadActivities(selectedLead.id).then(setActivities);
        }
    }, [selectedLead]);

    const handleLogCall = async () => {
        if (!selectedLead) return;
        try {
            await createLeadActivity(selectedLead.id, `ติดต่อลูกค้า: ${logStatus} - ${logNote}`);
            const updated = await updateLead(selectedLead.id, { status: logStatus }); // Update status based on outcome
            
            // Notify if status changed or important
            sendLineNotification('update_status', { 
                leadName: selectedLead.name, 
                phone: selectedLead.phone, 
                status: logStatus, 
                notes: logNote 
            });

            addToast('บันทึกผลการติดต่อสำเร็จ', 'success');
            setSelectedLead(null);
            fetchWork();
        } catch (e) { addToast(getErrorMessage(e), 'error'); }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">ระบบขาย (Sell Panel)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map(lead => (
                    <Card key={lead.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800">{lead.name}</h3>
                                <p className="text-sm text-slate-500">{lead.program}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded bg-blue-100 text-blue-700`}>{lead.status}</span>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1 mb-4">
                            <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2"/> {lead.phone}</p>
                            <p className="flex items-center"><UsersIcon className="w-4 h-4 mr-2"/> {lead.source || 'Unknown Source'}</p>
                            {lead.notes && <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-2 rounded">Note: {lead.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                             <a href={`tel:${lead.phone}`} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-center text-sm hover:bg-green-600 transition-colors">
                                📞 โทร
                            </a>
                            <button onClick={() => setSelectedLead(lead)} className="flex-1 bg-[#4DA6FF] text-white py-2 rounded-xl text-sm hover:bg-sky-600 transition-colors">
                                บันทึกผล
                            </button>
                        </div>
                    </Card>
                ))}
                {leads.length === 0 && <p className="col-span-3 text-center text-slate-400 py-10">เยี่ยมมาก! ไม่มีงานค้างติดตามวันนี้</p>}
            </div>

            {/* Log Call Modal */}
            <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={`บันทึกผล: ${selectedLead?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">ผลการติดต่อ</label>
                        <select 
                            value={logStatus} 
                            onChange={(e) => setLogStatus(e.target.value as LeadStatus)}
                            className="w-full p-2.5 border rounded-xl"
                        >
                            <option value={LeadStatus.Contacted}>ติดต่อได้ (สนใจ)</option>
                            <option value={LeadStatus.Uncalled}>ไม่รับสาย (โทรใหม่)</option>
                            <option value={LeadStatus.FollowUp}>ขอนัดคุย / ติดตามต่อ</option>
                            <option value={LeadStatus.Won}>ปิดการขาย (สำเร็จ)</option>
                            <option value={LeadStatus.Lost}>ไม่สนใจ / ยกเลิก</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">บันทึกเพิ่มเติม</label>
                        <textarea 
                            value={logNote} 
                            onChange={(e) => setLogNote(e.target.value)} 
                            className="w-full p-2.5 border rounded-xl h-24"
                            placeholder="รายละเอียดการพูดคุย..."
                        />
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                         <h4 className="text-sm font-bold text-slate-700 mb-3">ประวัติการติดตาม (Timeline)</h4>
                         <div className="max-h-40 overflow-y-auto custom-scrollbar">
                             <ActivityTimeline activities={activities} />
                         </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button onClick={() => setSelectedLead(null)} variant="secondary">ยกเลิก</Button>
                    <Button onClick={handleLogCall}>บันทึกข้อมูล</Button>
                </div>
            </Modal>
        </div>
    );
};

// --- CRM Panel ---
export const CRMPage: React.FC<{ user: User }> = ({ user }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const { addToast } = useToast();

    const fetchWonLeads = useCallback(async () => {
        const all = await getLeads(user.role === 'admin' ? 'admin' : 'sales', user.id);
        setLeads(all.filter(l => l.status === LeadStatus.Won));
    }, [user]);

    useEffect(() => { fetchWonLeads(); }, [fetchWonLeads]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">ดูแลหลังการขาย (CRM)</h1>
            <Card className="p-0" noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="p-4">ลูกค้า</th>
                                <th className="p-4">โปรแกรม</th>
                                <th className="p-4">วันที่ซื้อ</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leads.map(lead => (
                                <tr key={lead.id} className="text-sm hover:bg-slate-50">
                                    <td className="p-4 font-medium">{lead.name}<br/><span className="text-xs text-slate-400">{lead.phone}</span></td>
                                    <td className="p-4">{lead.program}</td>
                                    <td className="p-4 text-slate-500">{new Date(lead.last_update_date || lead.created_at).toLocaleDateString('th-TH')}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => setSelectedLead(lead)}>
                                            ติดตามผล
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีลูกค้าในรายการ CRM</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="นัดหมาย / ติดตามผล CRM">
                 <div className="space-y-4 text-center">
                    <p>สร้างนัดหมายติดตามผลอัตโนมัติสำหรับคุณ {selectedLead?.name}?</p>
                    <div className="flex justify-center gap-2 pt-4">
                        <Button onClick={() => setSelectedLead(null)} variant="secondary">ยกเลิก</Button>
                        <Button onClick={async () => {
                            if (selectedLead) {
                                await createFollowUpAppointments(selectedLead.id, user.id, new Date().toISOString(), selectedLead.name);
                                addToast('สร้างนัดหมายติดตามผลเรียบร้อย', 'success');
                                setSelectedLead(null);
                            }
                        }}>ยืนยันสร้างนัดหมาย (1วัน/1เดือน/3เดือน)</Button>
                    </div>
                 </div>
            </Modal>
        </div>
    );
};

// --- Sales Team ---
export const SalesTeamPage: React.FC = () => {
    const [team, setTeam] = useState<Salesperson[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Salesperson | null>(null);
    const [viewingKPIUser, setViewingKPIUser] = useState<Salesperson | null>(null);
    const [kpiStats, setKpiStats] = useState<any>(null);
    const { addToast } = useToast();
    
    // New state for fix logic
    const [showRoleFixModal, setShowRoleFixModal] = useState(false);

    const fetchTeam = useCallback(async () => {
        const data = await getSalesTeam();
        setTeam(data);
    }, []);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    // Create User
    const handleCreateUser = async (data: any) => {
        try {
            await adminCreateUser(data);
            addToast('สร้างผู้ใช้สำเร็จ', 'success');
            setIsAddModalOpen(false);
            fetchTeam();
        } catch (e: any) { 
            const msg = getErrorMessage(e);
            
            // Handle specific role constraint violation
            if (msg.includes('valid_role') || msg.includes('violates check constraint')) {
                setShowRoleFixModal(true);
            } else if (msg.includes('provider_id')) {
                // Should be handled by adminCreateUser function check if possible, or show fix modal too
                addToast("Error: Database Trigger/Constraint Issue. See settings.", 'error');
            } else {
                addToast(msg, 'error');
            }
        }
    }

    // Edit User
    const handleUpdateUser = async (data: any) => {
        if (!editingUser) return;
        try {
            // Update profile info (Name, Role)
            await updateSalesperson(editingUser.id, {
                full_name: data.fullName,
                role: data.role
            });
            
            // Password change is handled inside the form via callback if triggered
            addToast('แก้ไขข้อมูลสำเร็จ', 'success');
            setEditingUser(null);
            fetchTeam();
        } catch (e) { addToast(getErrorMessage(e), 'error'); }
    }

    const handleDelete = async (id: string) => {
        if(!confirm('ลบผู้ใช้นี้?')) return;
        try {
            await deleteSalesperson(id);
            addToast('ลบผู้ใช้สำเร็จ', 'success');
            fetchTeam();
        } catch(e) { addToast(getErrorMessage(e), 'error'); }
    }

    // KPI Logic
    const handleViewKPI = async (user: Salesperson) => {
        setViewingKPIUser(user);
        setKpiStats(null); // Reset prev stats
        try {
            // Re-use getDashboardStats but forced for a specific user ID as 'sales' role view
            const stats = await getDashboardStats('sales', user.id);
            setKpiStats(stats);
        } catch (e) {
            addToast('ไม่สามารถดึงข้อมูล KPI ได้', 'error');
            setViewingKPIUser(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">ทีมงาน (Users)</h1>
                <Button onClick={() => setIsAddModalOpen(true)}><PlusIcon className="mr-1 w-5 h-5"/> เพิ่มผู้ใช้</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map(member => {
                    const isOnline = isUserOnline(member);
                    return (
                        <Card key={member.id} className="p-4 relative group">
                            <div className="flex items-center">
                                <div className="relative">
                                    <img src={member.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${member.full_name}`} className="w-12 h-12 rounded-full border border-slate-100" />
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-[#cddc39]' : 'bg-[#e51c23]'}`}></span>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="font-bold text-slate-800">{member.full_name}</h3>
                                    <p className="text-xs text-slate-500 uppercase">{member.role}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {isOnline ? <span className="text-[#cddc39] font-bold">Online</span> : <span className="text-[#e51c23] font-bold">Offline</span>} 
                                        {member.last_active && ` (${new Date(member.last_active).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})})`}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end gap-2">
                                <button 
                                    onClick={() => handleViewKPI(member)} 
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="ดู KPI"
                                >
                                    <ChartBarIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setEditingUser(member)} 
                                    className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="แก้ไขข้อมูล"
                                >
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(member.id)} 
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="ลบผู้ใช้"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Add User Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="เพิ่มผู้ใช้งานใหม่">
                <UserForm onSave={handleCreateUser} onCancel={() => setIsAddModalOpen(false)} />
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="แก้ไขข้อมูลผู้ใช้">
                {editingUser && (
                    <UserForm 
                        initialData={{
                            fullName: editingUser.full_name || '',
                            email: editingUser.email || '',
                            role: editingUser.role,
                            id: editingUser.id
                        }}
                        isEdit={true}
                        onSave={handleUpdateUser} 
                        onCancel={() => setEditingUser(null)} 
                        onResetPassword={(newPass) => updateUserPassword(editingUser.id, newPass)}
                    />
                )}
            </Modal>

            {/* Individual KPI Modal */}
            <Modal isOpen={!!viewingKPIUser} onClose={() => setViewingKPIUser(null)} title={`KPI: ${viewingKPIUser?.full_name}`} size="xl">
                {kpiStats ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Lead ทั้งหมด" value={kpiStats.totalLeads} icon={<UsersIcon className="text-slate-500"/>} colorClass="bg-slate-50" />
                            <StatCard title="รอติดตาม" value={kpiStats.uncalledLeads} icon={<PhoneIcon className="text-orange-500"/>} colorClass="bg-orange-50" />
                            <StatCard title="ยอดขาย (เดือนนี้)" value={`฿${kpiStats.monthlySales.toLocaleString()}`} icon={<CheckCircleIcon className="text-green-500"/>} colorClass="bg-green-50" />
                            <StatCard title="Conversion Rate" value={`${kpiStats.conversionRate}%`} icon={<ChartBarIcon className="text-blue-500"/>} colorClass="bg-blue-50" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FunnelChart data={[
                                { name: 'Lead ทั้งหมด', value: kpiStats.totalLeads, fill: '#94a3b8' },
                                { name: 'รอดำเนินการ', value: kpiStats.uncalledLeads, fill: '#fb923c' },
                                { name: 'ปิดการขายสำเร็จ', value: (kpiStats.totalLeads * kpiStats.conversionRate / 100), fill: '#34d399' }
                            ]} />
                            <Card className="p-4" noPadding>
                                <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-700">ประสิทธิภาพ</h3></div>
                                <div className="p-6 text-center">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-blue-100 bg-white">
                                        <span className="text-2xl font-bold text-blue-600">{kpiStats.conversionRate}%</span>
                                    </div>
                                    <p className="mt-4 text-slate-500 text-sm">อัตราการปิดการขายสำเร็จ</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 text-center"><Spinner /></div>
                )}
            </Modal>

            {/* Role Constraint Fix Modal */}
            <Modal isOpen={showRoleFixModal} onClose={() => setShowRoleFixModal(false)} title="🛠️ แก้ไขปัญหา Role Constraint">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        เกิดข้อผิดพลาดในการสร้างผู้ใช้เนื่องจากข้อกำหนดในฐานข้อมูลไม่ตรงกับระบบ (Constraint Violation: valid_role).
                    </p>
                    <p className="text-sm text-slate-600">
                        กรุณาคัดลอก SQL Code ด้านล่าง ไปรันใน <strong>Supabase SQL Editor</strong> เพื่อแก้ไข
                    </p>
                    <div className="relative">
                        <pre className="bg-slate-800 text-green-400 p-4 rounded-xl text-xs overflow-x-auto">
                            {SQL_FIX_ROLE_CONSTRAINT}
                        </pre>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(SQL_FIX_ROLE_CONSTRAINT);
                                addToast('คัดลอก SQL แล้ว', 'success');
                            }}
                            className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-xs"
                        >
                            Copy
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => setShowRoleFixModal(false)}>ปิด</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Calendar ---
export const CalendarPage: React.FC<{ user: User }> = ({ user }) => {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        getCalendarEvents(user.role === 'admin' ? 'admin' : 'sales', user.id).then(setEvents);
    }, [user]);

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    const renderCalendarDays = () => {
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const days = [];

        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`pad-${i}`} className="bg-slate-50/50 min-h-[100px] border border-slate-100/50"></div>);
        }

        // Days of current month
        for (let day = 1; day <= totalDays; day++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = events.filter(e => {
                const eDate = new Date(e.start_time);
                return eDate.getDate() === day && eDate.getMonth() === currentDate.getMonth() && eDate.getFullYear() === currentDate.getFullYear();
            });

            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

            days.push(
                <div key={day} className={`bg-white min-h-[100px] border border-slate-100 p-1 relative hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30 ring-2 ring-inset ring-blue-200' : ''}`}>
                    <div className={`text-right text-xs font-semibold mb-1 p-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        <span className={isToday ? "bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center ml-auto" : ""}>{day}</span>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayEvents.map((event, idx) => {
                            const isBirthday = event.type === 'birthday';
                            const isBooking = event.type === 'booking';
                            
                            let bgClass = "bg-purple-100 text-purple-700 border-l-2 border-purple-500";
                            if (isBirthday) bgClass = "bg-sky-100 text-sky-700 border-l-2 border-sky-400"; // Birthday = Light Blue/Sky
                            if (isBooking) bgClass = "bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500"; // Booking = Green

                            return (
                                <div 
                                    key={event.id || idx} 
                                    onClick={() => setSelectedEvent(event)}
                                    className={`text-[10px] p-1 rounded cursor-pointer truncate shadow-sm hover:opacity-80 ${bgClass}`}
                                    title={event.title}
                                >
                                    {isBirthday ? '🎂 ' : ''}{event.title}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">ปฏิทินนัดหมาย</h1>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-sky-300 mr-2"></span> วันเกิดลูกค้า</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> วันที่จอง (Sell)</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span> นัดหมายติดตาม (CRM)</div>
                </div>
            </div>

            <Card className="p-0 overflow-hidden" noPadding>
                {/* Header Navigation */}
                <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeftIcon className="w-5 h-5 text-slate-500"/>
                    </button>
                    <h2 className="text-lg font-bold text-slate-700">
                        {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronRightIcon className="w-5 h-5 text-slate-500"/>
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
                        <div key={i} className={`py-3 text-center text-xs font-bold ${i===0||i===6 ? 'text-red-400':'text-slate-500'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 bg-slate-100 gap-px border-b border-slate-100">
                    {renderCalendarDays()}
                </div>
            </Card>

            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="รายละเอียด">
                {selectedEvent && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-xl mb-4 ${
                            selectedEvent.type === 'birthday' ? 'bg-sky-50 text-sky-800 border border-sky-100' :
                            selectedEvent.type === 'booking' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            'bg-purple-50 text-purple-800 border border-purple-100'
                        }`}>
                             <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                             <p className="text-sm opacity-80">{selectedEvent.type === 'birthday' ? 'วันเกิดลูกค้า' : selectedEvent.type === 'booking' ? 'วันที่ลงจองสินค้า' : 'นัดหมายติดตามผล'}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm text-slate-600">
                            <p className="flex justify-between border-b border-slate-100 pb-2">
                                <span>เวลา:</span> 
                                <span className="font-medium text-slate-800">{new Date(selectedEvent.start_time).toLocaleString('th-TH')}</span>
                            </p>
                            <p className="flex justify-between border-b border-slate-100 pb-2">
                                <span>ลูกค้า:</span> 
                                <span className="font-medium text-slate-800">{selectedEvent.leads?.name || 'ไม่ระบุ'}</span>
                            </p>
                            {selectedEvent.leads?.full_name && (
                                <p className="flex justify-between border-b border-slate-100 pb-2">
                                    <span>ผู้รับผิดชอบ:</span> 
                                    <span className="font-medium text-slate-800">{selectedEvent.leads.full_name}</span>
                                </p>
                            )}
                        </div>
                        
                        <div className="flex justify-end pt-4">
                            <Button onClick={() => setSelectedEvent(null)} variant="secondary">ปิด</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// --- Settings ---
export const SettingsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ (Settings)</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-slate-700 mb-4">สถานะการเชื่อมต่อ (System Status)</h3>
                    <ConnectionTest />
                </Card>
                <Card>
                    <h3 className="font-bold text-slate-700 mb-4">System Triggers (Simulation)</h3>
                    <SystemTriggers />
                </Card>
            </div>
        </div>
    );
};

export const SystemTriggers: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const runTrigger = async (name: string, action: () => Promise<void>) => {
        setLoading(true);
        try {
            await action();
            addToast(`Trigger '${name}' สำเร็จ`, 'success');
        } catch (e) {
            addToast(`Trigger '${name}' ล้มเหลว: ${getErrorMessage(e)}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
             <Button variant="secondary" className="w-full justify-start text-left" onClick={() => runTrigger('Test Notification', async () => sendLineNotification('test', { status: 'OK' }))}>
                🔔 Test LINE Notification
            </Button>
            <Button variant="secondary" className="w-full justify-start text-left" onClick={() => runTrigger('Check Birthdays', async () => {
                 const { today, thisMonth } = await getBirthdays();
                 sendLineNotification('birthday_report', { birthdaysToday: today, birthdaysMonth: thisMonth });
            })}>
                🎂 Run Check: Today's Birthdays
            </Button>
            <Button variant="secondary" className="w-full justify-start text-left" onClick={() => runTrigger('Update Status', async () => {
                 // Mock logic
                 await new Promise(r => setTimeout(r, 1000));
            })}>
                ⚡ Force Refresh System Status
            </Button>
        </div>
    );
};
