'use client';

import { useLayoutEffect, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Menu, LogOut, Plus, School, UserPlus, FileText } from 'lucide-react';
import Link from 'next/link';

import QuickCreateDrawer from '@/components/QuickCreateDrawer';
import { DrawerContext, ExamPrefill } from './DrawerContext';
import { HeaderStats } from '@/components/super-admin/HeaderStats';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentSchoolName, setCurrentSchoolName] = useState<string | null>(null);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'school' | 'user' | 'exam' | 'template'>('school');
  const [examPrefill, setExamPrefill] = useState<ExamPrefill | undefined>(undefined);

  const openDrawer = (formType: 'school' | 'user' | 'exam' | 'template', prefill?: ExamPrefill) => {
    setActiveForm(formType);
    if ((formType === 'exam' || formType === 'template') && prefill) setExamPrefill(prefill);
    setIsDrawerOpen(true);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  useEffect(() => {
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const schoolsIndex = segments.indexOf('schools');
    const schoolId = schoolsIndex !== -1 && schoolsIndex < segments.length - 1 ? segments[schoolsIndex + 1] : null;

    if (!schoolId) {
      setCurrentSchoolName(null);
      return;
    }

    const fetchSchoolName = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('schools')
        .select('name')
        .eq('id', schoolId)
        .single();
      if (data?.name) {
        setCurrentSchoolName(data.name);
      }
    };

    fetchSchoolName();
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/super-admin') return 'Dashboard';
    if (pathname?.startsWith('/schools')) return 'Schools';
    if (pathname?.startsWith('/exams')) return 'Exams';
    if (pathname === '/users') return 'Users';
    if (pathname?.startsWith('/plans')) return 'Plans';
    if (pathname?.startsWith('/subscriptions')) return 'Transactions';
    if (pathname?.startsWith('/notification')) return 'Notifications';
    return 'Command Center';
  };

  const getBreadcrumbs = () => {
    const segments = pathname?.split('/').filter(Boolean) ?? [];
    const crumbs = [];

    if (segments[0] === 'super-admin' || segments[0] === '') {
      crumbs.push({ label: 'Dashboard', href: '/' });
    }

    if (segments.includes('schools')) {
      crumbs.push({ label: 'Schools', href: '/schools' });
    }

    if (segments.includes('users')) {
      crumbs.push({ label: 'Users', href: '/users' });
    }

    if (segments.includes('exams')) {
      crumbs.push({ label: 'Exams', href: '/exams' });
    }

    if (segments.includes('plans')) {
      crumbs.push({ label: 'Plans', href: '/plans' });
    }

    if (segments.includes('subscriptions')) {
      crumbs.push({ label: 'Transactions', href: '/subscriptions' });
    }

    if (segments.includes('notification')) {
      crumbs.push({ label: 'Notifications', href: '/notification/notification_page' });
    }

    const lastSegment = segments[segments.length - 1];
    const isSchoolDetail = segments.includes('schools') && segments.indexOf('schools') < segments.length - 1;

    if (isSchoolDetail) {
      crumbs.push({ label: currentSchoolName || '', href: null });
    } else if (lastSegment && lastSegment !== 'super-admin' && !['schools', 'users', 'exams', 'plans', 'subscriptions', 'notification', 'notification_page'].includes(lastSegment)) {
      crumbs.push({ label: lastSegment, href: null });
    }

    return crumbs;
  };

  const title = getPageTitle();
  const breadcrumbs = getBreadcrumbs();

  return (
    <DrawerContext.Provider value={{ openDrawer }}>
    <div className="min-h-screen bg-bg">
      <QuickCreateDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setExamPrefill(undefined); }} 
        activeForm={activeForm} 
        setActiveForm={setActiveForm}
        examPrefill={examPrefill}
        onRefresh={() => {
          router.refresh();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('refresh-tables'));
          }
        }}
      />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-[52px]' : 'md:ml-[180px]'}`}>
        <header className="sticky top-0 z-30 h-14 md:h-14 flex items-center border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile hamburger */}
              <button 
                className="md:hidden p-2 rounded-lg bg-surface-hover text-text-muted hover:text-text-main hover:bg-border transition-colors" 
                onClick={() => setMobileSidebarOpen(true)} 
                title="Open menu"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center">
                <div className="flex flex-col">
                  <div className="text-sm md:text-base font-medium text-text-main">
                    {breadcrumbs.length > 0 ? (
                      <nav className="flex items-center gap-1.5 text-sm md:text-base text-text-muted">
                        {breadcrumbs.map((crumb, index) => (
                          <span key={crumb.label} className="flex items-center gap-1.5">
                            {crumb.href ? (
                              <Link href={crumb.href} className="hover:text-accent-primary transition-colors font-semibold">
                                {crumb.label}
                              </Link>
                            ) : (
                              <span className="text-accent-primary font-bold">{crumb.label}</span>
                            )}
                            {index < breadcrumbs.length - 1 && <span>/</span>}
                          </span>
                        ))}
                      </nav>
                    ) : (
                      <span className="font-bold text-accent-primary">{title}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(pathname === '/super-admin' || pathname === '/super-admin/') && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <HeaderStats />
              </div>
            )}

            <div className="flex items-center gap-3 md:gap-6">
              <div className="relative group">
                <button 
                  className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg shadow-[0_2px_6px_rgba(5,150,105,0.2)] hover:shadow-[0_4px_12px_rgba(5,150,105,0.4)] transition-all hover:-translate-y-0.5" 
                  title="Quick Create"
                  onClick={() => openDrawer('school')}
                >
                  <Plus size={18} />
                </button>
                <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all z-50">
                  <div className="bg-surface border border-border rounded-xl shadow-md min-w-[180px] flex flex-col overflow-hidden">
                    <button 
                      onClick={() => openDrawer('school')} 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:pl-5 transition-all text-left w-full cursor-pointer bg-transparent border-none"
                    >
                      <School size={16}/> Add School
                    </button>
                    <button 
                      onClick={() => openDrawer('user')} 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:pl-5 transition-all text-left w-full cursor-pointer bg-transparent border-none"
                    >
                      <UserPlus size={16}/> Add New User
                    </button>
                    <button 
                      onClick={() => openDrawer('exam')} 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:text-accent-primary hover:bg-surface-hover hover:pl-5 transition-all text-left w-full cursor-pointer bg-transparent border-none"
                    >
                      <FileText size={16}/> Create Exam
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button
                  id="header-admin-menu-trigger"
                  className="w-9 h-9 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center font-bold text-sm border border-accent-primary/15 hover:bg-accent-primary/20 transition-colors"
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  title="Admin menu"
                >
                  SA
                </button>
                <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all z-50">
                  <div id="header-admin-menu" className="w-48 rounded-xl border border-border bg-surface shadow-xl p-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] text-text-main font-semibold truncate block w-full">Super Admin</span>
                    </div>
                    <button
                      className="mt-3 flex items-center gap-2 px-2.5 py-2 w-full bg-transparent border-none rounded-lg text-text-muted text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 animate-fade-in relative z-10">
          <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-3 pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
    </DrawerContext.Provider>
  );
}
