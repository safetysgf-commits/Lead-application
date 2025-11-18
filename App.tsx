import React, { useState, useMemo, useEffect } from 'react';
import { LoginPage, AdminDashboard, SalesDashboard, LeadsPage, SalesTeamPage, CalendarPage, SettingsPage, RegistrationPage } from './pages.tsx';
import { User, Role, Page } from './types.ts';
import { supabase } from './supabaseClient.ts';
import { Header, BottomNav } from './components.tsx';
import { ToastProvider, useToast } from './hooks/useToast.tsx';
import { Spinner } from './components.tsx';
import { getUnreadLeadsCount } from './services.ts';

// --- Contexts ---
export const AuthContext = React.createContext<{
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
} | null>(null);

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('admin-dashboard');
    const [loading, setLoading] = useState(true);
    const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
    const [postRegistrationEmail, setPostRegistrationEmail] = useState<string | null>(null);
    const [notificationCount, setNotificationCount] = useState(0);
    
    const { addToast } = useToast();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    const fullUser: User = {
                        id: session.user.id,
                        email: session.user.email || '',
                        name: profile.full_name || 'No Name',
                        role: profile.role as Role,
                        avatar: profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.full_name || session.user.email}`
                    };
                    setUser(fullUser);
                    setCurrentPage(fullUser.role === 'admin' ? 'admin-dashboard' : 'sales-dashboard');

                    if (fullUser.role === 'sales') {
                        const count = await getUnreadLeadsCount(fullUser.id);
                        setNotificationCount(count);
                    }

                } else {
                    await supabase.auth.signOut();
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
             if (!session) {
                setUser(null);
            } else {
                 checkUser();
             }
        });
        return () => subscription.unsubscribe();
    }, []);


    const login = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            if (!error.message.includes('Email not confirmed')) {
                addToast(error.message, 'error');
            }
            throw error;
        }
        addToast('เข้าสู่ระบบสำเร็จ', 'success');
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
           addToast(error.message, 'error');
           throw error;
        }
        setUser(null);
        setNotificationCount(0);
        addToast('ออกจากระบบแล้ว', 'info');
    };

    const register = async (fullName: string, email: string, pass: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                data: {
                    full_name: fullName,
                    role: 'sales'
                }
            }
        });
        if (error) {
            addToast(error.message, 'error');
            throw error;
        }
        addToast('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี', 'success');
        setPostRegistrationEmail(email);
        setAuthPage('login');
    };

    const resendConfirmation = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        if (error) {
            addToast(error.message, 'error');
            throw error;
        }
        addToast('ส่งอีเมลยืนยันอีกครั้งแล้ว โปรดตรวจสอบกล่องจดหมาย', 'success');
    };
    
    const authContextValue = useMemo(() => ({ user, login, logout, register, resendConfirmation }), [user]);
    
    const renderPage = () => {
        if (!user) return null; // Should be handled by the main return
        switch (currentPage) {
            case 'admin-dashboard': return <AdminDashboard />;
            case 'sales-dashboard': return <SalesDashboard user={user} />;
            case 'leads': return <LeadsPage user={user} setNotificationCount={setNotificationCount} />;
            case 'team': return user.role === 'admin' ? <SalesTeamPage /> : null;
            case 'calendar': return <CalendarPage user={user} />;
            case 'settings': return user.role === 'admin' ? <SettingsPage /> : null;
            default: return user.role === 'admin' ? <AdminDashboard /> : <SalesDashboard user={user}/>;
        }
    };
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
    }

    if (!user) {
        return (
            <AuthContext.Provider value={authContextValue}>
                {authPage === 'login' ? (
                    <LoginPage 
                        onSwitchPage={() => setAuthPage('register')}
                        postRegistrationEmail={postRegistrationEmail}
                        clearPostRegistrationEmail={() => setPostRegistrationEmail(null)} 
                    />
                ) : (
                    <RegistrationPage onSwitchPage={() => setAuthPage('login')} />
                )}
            </AuthContext.Provider>
        );
    }
    
    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="min-h-screen bg-slate-100 text-slate-800">
                <Header user={user} onLogout={logout} notificationCount={notificationCount} />
                <main className="pb-24 pt-20 px-4 md:px-6">
                    {renderPage()}
                </main>
                <BottomNav user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
        </AuthContext.Provider>
    );
};

const App: React.FC = () => {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;