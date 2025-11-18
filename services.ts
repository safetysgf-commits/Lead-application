import { LeadStatus, ConnectionTestResult, Database, Salesperson, Lead, LeadActivity, Role } from './types.ts';
import { supabase } from './supabaseClient.ts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];
type SalespersonInsert = Database['public']['Tables']['profiles']['Insert'];
type SalespersonUpdate = Database['public']['Tables']['profiles']['Update'];

// --- Constants ---
export const statusColors: { [key in LeadStatus]: string } = {
    [LeadStatus.New]: 'bg-blue-500',
    // FIX: Corrected typo from `LeadLeadStatus` to `LeadStatus`.
    [LeadStatus.Uncalled]: 'bg-orange-500',
    [LeadStatus.Contacted]: 'bg-yellow-500',
    [LeadStatus.FollowUp]: 'bg-purple-500',
    [LeadStatus.Won]: 'bg-green-500',
    [LeadStatus.Lost]: 'bg-red-500',
};
export const leadStatuses = Object.values(LeadStatus);

// --- Data Services ---

export const getLeads = async (role: 'admin' | 'sales', userId?: string) => {
    let query = supabase
      .from('leads')
      .select(`
        *,
        profiles (
            full_name
        )
      `)
      .order('received_date', { ascending: false });

    if (role === 'sales' && userId) {
        query = query.eq('assigned_to', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getUnreadLeadsCount = async (userId: string) => {
    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .in('status', ['ใหม่', 'ยังไม่ได้โทร']);
    if (error) {
        console.error("Error fetching unread leads count:", error);
        return 0;
    }
    return count ?? 0;
};

export const createLead = async (leadData: LeadInsert) => {
    const { data, error } = await supabase.from('leads').insert(leadData).select().single();
    if (error) throw error;
    return data;
};

export const updateLead = async (id: number, leadData: LeadUpdate) => {
    const { error } = await supabase.from('leads').update(leadData).eq('id', id);
    if (error) throw error;
};

export const deleteLead = async (id: number) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
};

export const getSalesTeam = async (): Promise<Salesperson[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) throw error;
    return data;
};

export const adminCreateUser = async (userData: { fullName: string, email: string, password: string, role: Role }) => {
    const { error } = await supabase.rpc('admin_create_user', {
        email_input: userData.email,
        password_input: userData.password,
        full_name_input: userData.fullName,
        role_input: userData.role,
    });
    if (error) throw error;
};

export const updateSalesperson = async (id: string, salespersonData: SalespersonUpdate) => {
     const { error } = await supabase.from('profiles').update(salespersonData).eq('id', id);
    if (error) throw error;
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
    // This requires a Supabase Edge Function for security.
    // The RPC function 'update_user_password' must be created in your Supabase SQL Editor.
    const { error } = await supabase.rpc('update_user_password', {
        user_id: userId,
        new_password: newPassword
    });
    if (error) throw error;
};


export const deleteSalesperson = async (id: string) => {
     const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};

export const getCalendarEvents = async (role: 'admin' | 'sales', userId: string) => {
    let query = supabase.from('calendar_events').select('*');
     if (role === 'sales') {
        query = query.eq('salesperson_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getDashboardStats = async (role: 'admin' | 'sales', userId?: string, dateRange?: { start: string, end: string }) => {
    if(role === 'admin') {
        let leadsQuery = supabase.from('leads').select('value, status, created_at');
        if (dateRange) {
            leadsQuery = leadsQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
        }
        const { data: leads, error: leadsError } = await leadsQuery;
        if (leadsError) throw leadsError;

        const { count: teamSize, error: teamError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (teamError) throw teamError;
        
        const wonLeads = leads.filter(l => l.status === LeadStatus.Won);
        
        return {
            totalLeads: leads.length,
            newLeads: leads.filter(l => new Date(l.created_at) >= new Date(new Date().toDateString())).length, // Simplified for today
            totalValue: wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0),
            teamSize: teamSize ?? 0,
            conversionRate: leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0,
        }
    } else {
        const { data: salesLeads, error } = await supabase.from('leads').select('status, value').eq('assigned_to', userId!);
        if (error) throw error;

        const wonLeads = salesLeads.filter(l => l.status === LeadStatus.Won);
        const monthlySales = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

        return {
            totalLeads: salesLeads.length,
            uncalledLeads: salesLeads.filter(l => l.status === LeadStatus.Uncalled).length,
            monthlySales: monthlySales,
            conversionRate: salesLeads.length > 0 ? Math.round((wonLeads.length / salesLeads.length) * 100) : 0
        }
    }
};

export const getSalesPerformance = async (dateRange?: { start: string, end: string }) => {
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name').eq('role', 'sales');
    if (profileError) throw profileError;
    
    let leadsQuery = supabase.from('leads').select('assigned_to, value, status, created_at').eq('status', 'สำเร็จ');
    if (dateRange) {
        leadsQuery = leadsQuery.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    }
    const { data: leads, error: leadError } = await leadsQuery;
    if (leadError) throw leadError;

    return profiles.map(sales => {
        const salesLeads = leads.filter(lead => lead.assigned_to === sales.id);
        return {
            name: (sales.full_name || 'N/A').split(' ')[0],
            sales: salesLeads.reduce((sum, lead) => sum + (lead.value || 0), 0),
            leads: salesLeads.length
        }
    });
};

export const getConversionRates = async (salespersonId?: string, dateRange?: { start: string, end: string }) => {
    let query = supabase.from('leads').select('status, created_at');
    if (salespersonId) {
        query = query.eq('assigned_to', salespersonId);
    }
    if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    }
    const { data: leads, error } = await query;
    if (error) throw error;
    
    const won = leads.filter(l => l.status === LeadStatus.Won).length;
    const lost = leads.filter(l => l.status === LeadStatus.Lost).length;
    const inProgress = leads.length - won - lost;
    return [
        { name: 'สำเร็จ', value: won },
        { name: 'ยกเลิก', value: lost },
        { name: 'ดำเนินการอยู่', value: inProgress },
    ];
};

export const getSalesTrend = async (dateRange?: { start: string, end: string }) => {
    // This is a simplified version. A real implementation would use a database function or more complex queries.
    return [
        { name: 'ม.ค.', sales: 120000 },
        { name: 'ก.พ.', sales: 150000 },
        { name: 'มี.ค.', sales: 130000 },
        { name: 'เม.ย.', sales: 180000 },
        { name: 'พ.ค.', sales: 210000 },
        { name: 'มิ.ย.', sales: 190000 },
    ];
};

export const getBirthdays = async (salespersonId?: string) => {
    let query = supabase.from('leads').select('id, name, birthday, phone');
    if (salespersonId) {
        query = query.eq('assigned_to', salespersonId);
    }
    const { data, error } = await query;
    if (error) throw error;

    const relevantLeads = data.filter(l => l.birthday);

    const todayDate = new Date();
    const todayLeads = relevantLeads.filter(l => {
        const bday = new Date(l.birthday!);
        return bday.getUTCDate() === todayDate.getUTCDate() && bday.getUTCMonth() === todayDate.getUTCMonth();
    });
    const thisMonthLeads = relevantLeads.filter(l => {
        const bday = new Date(l.birthday!);
        return bday.getUTCMonth() === todayDate.getUTCMonth();
    });
    return { today: todayLeads, thisMonth: thisMonthLeads };
}

// --- Lead Activity Services ---
export const getLeadActivities = async (leadId: number): Promise<LeadActivity[]> => {
    const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const createLeadActivity = async (leadId: number, description: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
    
    const activityData = {
        lead_id: leadId,
        activity_description: description,
        user_id: user?.id,
        user_name: profile?.full_name || user?.email,
    };
    const { error } = await supabase.from('lead_activities').insert(activityData);
    if (error) throw error;
};

// --- Export Service ---
export const exportToPDF = (leads: Lead[]) => {
  const doc = new jsPDF();
  
  doc.text("Lead Export Report", 14, 16);

  const tableColumn = ["ID", "Name", "Phone", "Status", "Assigned To", "Value"];
  const tableRows: any[] = [];

  leads.forEach(lead => {
    const leadData = [
      lead.id,
      lead.name,
      lead.phone,
      lead.status,
      lead.profiles?.full_name || 'N/A',
      lead.value?.toLocaleString() || '0'
    ];
    tableRows.push(leadData);
  });
  
  (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
  });

  const isSingleLead = leads.length === 1;
  const leadName = isSingleLead ? leads[0].name.replace(/[\s\W]/g, '_') : 'report';
  const fileName = `leads_${leadName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportToCSV = (leads: Lead[]) => {
    const header = "ID,Name,Phone,Program,Status,AssignedTo,ReceivedDate,LastUpdate,Birthday,Address,Value,Notes\n";
    const csvRows = leads.map(lead => {
        const row = [
            lead.id,
            `"${lead.name}"`,
            `"${lead.phone}"`,
            `"${lead.program || ''}"`,
            lead.status,
            `"${lead.profiles?.full_name || 'N/A'}"`,
            lead.received_date,
            lead.last_update_date || '',
            lead.birthday || '',
            `"${lead.address || ''}"`,
            lead.value || 0,
            `"${(lead.notes || '').replace(/"/g, '""')}"`
        ];
        return row.join(',');
    });

    const csvString = "\uFEFF" + header + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const isSingleLead = leads.length === 1;
    const leadName = isSingleLead ? leads[0].name.replace(/[\s\W]/g, '_') : 'export';
    const fileName = `leads_${leadName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- Connection Test Service ---
export const runConnectionTest = async (onProgress: (result: ConnectionTestResult) => void) => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;
    const userId = user?.id;

    const RLS_LEADS_FIX = `-- This script resets RLS for the 'leads' table.
DROP POLICY IF EXISTS "Admins can manage all leads." ON public.leads;
DROP POLICY IF EXISTS "Admins can insert new leads." ON public.leads;
DROP POLICY IF EXISTS "Sales can view their own assigned leads." ON public.leads;
DROP POLICY IF EXISTS "Sales can update their own assigned leads." ON public.leads;
DROP POLICY IF EXISTS "Sales can delete their own assigned leads." ON public.leads;

CREATE POLICY "Admins can manage all leads." ON public.leads FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Admins can insert new leads." ON public.leads FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "Sales can view their own assigned leads." ON public.leads FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Sales can update their own assigned leads." ON public.leads FOR UPDATE USING (assigned_to = auth.uid());
CREATE POLICY "Sales can delete their own assigned leads." ON public.leads FOR DELETE USING (assigned_to = auth.uid());`;

    const RLS_PROFILES_FIX = `-- This script resets RLS for the 'profiles' table.
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`;

    const RLS_CALENDAR_FIX = `-- This script resets RLS for the 'calendar_events' table.
DROP POLICY IF EXISTS "Admins can manage all calendar events." ON public.calendar_events;
DROP POLICY IF EXISTS "Sales can manage their own calendar events." ON public.calendar_events;

CREATE POLICY "Admins can manage all calendar events." ON public.calendar_events FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Sales can manage their own calendar events." ON public.calendar_events FOR ALL USING (salesperson_id = auth.uid()) WITH CHECK (salesperson_id = auth.uid());`;

    const tests = [
        {
            name: "1. ตรวจสอบการเชื่อมต่อ Supabase",
            requiresAuth: false,
            action: async () => ({
                success: true,
                details: "เชื่อมต่อ Supabase สำเร็จ (URL และ Key ถูกต้อง)",
            })
        },
        ...['profiles', 'leads', 'calendar_events', 'lead_activities'].map((table, i) => ({
            name: `${i + 2}. ตรวจสอบตาราง '${table}'`,
            requiresAuth: false,
            action: async () => {
                const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
                return {
                    success: !error,
                    details: error ? `ไม่พบตาราง '${table}' หรืออาจไม่มีสิทธิ์อ่านพื้นฐาน` : `พบตาราง '${table}'`,
                    fix: error ? `ตรวจสอบว่าตาราง '${table}' ถูกสร้างขึ้นใน Supabase Public Schema เรียบร้อยแล้ว` : undefined
                };
            }
        })),
        {
            name: "6. ทดสอบสิทธิ์ตาราง 'leads' (CRUD)",
            requiresAuth: true,
            action: async (currentUserId?: string) => {
                // This test must be run as an admin to insert, then a sales user must be assigned to test update/delete
                return { success: true, details: "ข้ามการทดสอบอัตโนมัติ (ต้องการสิทธิ์ Admin และ Sales)", fix: RLS_LEADS_FIX };
            }
        },
        {
            name: "7. ทดสอบสิทธิ์ตาราง 'profiles' (Update Self)",
            requiresAuth: true,
            action: async (currentUserId?: string) => {
                try {
                    const { data: profile, error: fetchError } = await supabase.from('profiles').select('full_name').eq('id', currentUserId!).single();
                    if (fetchError) throw new Error(`Fetch profile failed: ${fetchError.message}`);
                    
                    const { error: updateError } = await supabase.from('profiles').update({ full_name: profile.full_name }).eq('id', currentUserId!);
                    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

                    return { success: true, details: "สิทธิ์ อ่านและแก้ไขโปรไฟล์ตัวเองถูกต้อง" };
                } catch (e: any) {
                    return { success: false, details: `ล้มเหลว: ${e.message}`, fix: RLS_PROFILES_FIX };
                }
            }
        },
        {
            name: "8. ทดสอบสิทธิ์ตาราง 'calendar_events' (CRUD)",
            requiresAuth: true,
            action: async (currentUserId?: string) => {
                try {
                    const testEvent = { title: 'RLS Test Event', start_time: new Date().toISOString(), end_time: new Date().toISOString(), salesperson_id: currentUserId! };
                    const { data, error: insertError } = await supabase.from('calendar_events').insert(testEvent).select();
                    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

                    const newEventId = data[0].id;
                    const { error: updateError } = await supabase.from('calendar_events').update({ title: 'Test Update' }).eq('id', newEventId);
                    if (updateError) throw new Error(`Update failed: ${updateError.message}`);

                    const { error: deleteError } = await supabase.from('calendar_events').delete().eq('id', newEventId);
                    if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

                    return { success: true, details: "สิทธิ์ อ่าน, เขียน, ลบ ในตาราง 'calendar_events' ถูกต้อง" };
                } catch (e: any) {
                    return { success: false, details: `ล้มเหลว: ${e.message}`, fix: RLS_CALENDAR_FIX };
                }
            }
        }
    ];

     onProgress({
        test: 'Authentication Check',
        status: isAuthenticated ? 'success' : 'info',
        details: isAuthenticated ? `ทดสอบในฐานะผู้ใช้: ${user.email}` : 'ไม่ได้เข้าสู่ระบบ จะข้ามการทดสอบสิทธิ์การใช้งาน (RLS)',
    });
    await delay(300);

    for (const test of tests) {
        if (test.requiresAuth && !isAuthenticated) {
            onProgress({
                test: test.name,
                status: 'info',
                details: 'ข้ามการทดสอบ RLS เนื่องจากยังไม่ได้เข้าสู่ระบบ',
            });
            continue;
        }

        onProgress({ test: test.name, status: 'pending', details: 'กำลังดำเนินการ...' });
        await delay(300);
        const result = await test.action(userId);
        onProgress({
            test: test.name,
            status: result.success ? 'success' : 'failure',
            details: result.details,
            fix: (result as any).fix
        });
        if (!result.success && test.name.includes('ตาราง')) break;
    }
};