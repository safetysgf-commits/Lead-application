
import React, { useState, useMemo, useEffect } from 'react';
import { LoginPage, Dashboard, LeadsPage, SellPage, CRMPage, SalesTeamPage, CalendarPage, SettingsPage } from './pages.tsx';
import { User, Role, Page } from './types.ts';
import { supabase } from './supabaseClient.ts';
import { Header, BottomNav } from './components.tsx';
import { ToastProvider, useToast } from './hooks/useToast.tsx';
import { Spinner } from './components.tsx';
import { getUnreadLeadsCount, updateUserStatus } from './services.ts';
import { AuthContext } from './context.ts';

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    
    const { addToast } = useToast();

    // Heartbeat: Update "Online" status every 4 minutes while user is active
    useEffect(() => {
        if (!user) return;
        
        const heartbeat = async () => {
            try {
                await updateUserStatus(user.id, 'online');
            } catch (err) {
                console.error("Heartbeat failed", err);
            }
        };

        heartbeat(); // Run immediately on mount/login
        const intervalId = setInterval(heartbeat, 4 * 60 * 1000); // Run every 4 mins

        return () => clearInterval(intervalId);
    }, [user?.id]); // Only re-run if user changes

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
                        avatar: profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.full_name || session.user.email}`,
                        status: profile.status as 'online' | 'offline' | undefined
                    };
                    setUser(fullUser);
                    setCurrentPage('dashboard');

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
            addToast(error.message, 'error');
            throw error;
        }
        addToast('เข้าสู่ระบบสำเร็จ', 'success');
    };

    const logout = async () => {
        if (user) {
            try { await updateUserStatus(user.id, 'offline'); } catch(e) {}
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
           addToast(error.message, 'error');
           throw error;
        }
        setUser(null);
        setNotificationCount(0);
        addToast('ออกจากระบบแล้ว', 'info');
    };
    
    const authContextValue = useMemo(() => ({ user, login, logout }), [user]);
    
    const renderPage = () => {
        if (!user) return null;
        switch (currentPage) {
            case 'dashboard': return <Dashboard user={user} />;
            case 'leads': return <LeadsPage user={user} setNotificationCount={setNotificationCount} />;
            case 'sell': return <SellPage user={user} />;
            case 'crm': return <CRMPage user={user} />;
            case 'team': return user.role === 'admin' ? <SalesTeamPage /> : null;
            case 'calendar': return <CalendarPage user={user} />;
            case 'settings': return user.role === 'admin' ? <SettingsPage /> : null;
            default: return <Dashboard user={user} />;
        }
    };
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]"><Spinner /></div>
    }

    if (!user) {
        return (
            <AuthContext.Provider value={authContextValue}>
                <LoginPage />
            </AuthContext.Provider>
        );
    }
    
    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="min-h-screen bg-[#F7FAFC] text-slate-800 font-sans">
                <Header user={user} onLogout={logout} notificationCount={notificationCount} />
                <main className="pb-24 pt-20 px-4 md:px-6 max-w-7xl mx-auto">
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