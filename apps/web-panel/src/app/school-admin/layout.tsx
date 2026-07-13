'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import Link from 'next/link';
import { LayoutDashboard, FileText, Users, GraduationCap, LogOut, Menu, AlertCircle, User, MessageSquare, BookOpen, ChevronLeft, ChevronRight, Layers, Moon, Sun, Check } from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Exams',
    href: '/exams',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Teachers',
    href: '/teachers',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Students',
    href: '/students',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    label: 'Results',
    href: '/results',
    icon: <FileText className="w-5 h-5" />,
  }
];

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [breadcrumbNames, setBreadcrumbNames] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = (event: any) => {
    const newDark = !isDark;

    const updateTheme = () => {
      if (newDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDark(true);
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDark(false);
      }
    };

    if (!(document as any).startViewTransition) {
      updateTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(updateTheme);

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  useEffect(() => {
    const fetchBreadcrumbName = async () => {
      const segments = pathname?.split('/').filter(Boolean) || [];
      const lastSegment = segments[segments.length - 1];
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
      
      if (isUUID && !breadcrumbNames[lastSegment]) {
         const type = segments[segments.length - 2];
         const supabase = createClient();
         
         if (type === 'exams') {
            const { data } = await supabase.from('exams').select('title').eq('id', lastSegment).single();
            if (data?.title) setBreadcrumbNames(prev => ({...prev, [lastSegment]: data.title}));
         } else if (type === 'teachers') {
            const { data } = await supabase.from('teachers').select('full_name').eq('id', lastSegment).single();
            if (data?.full_name) setBreadcrumbNames(prev => ({...prev, [lastSegment]: data.full_name}));
         } else if (type === 'students') {
            const { data } = await supabase.from('students').select('full_name').eq('id', lastSegment).single();
            if (data?.full_name) setBreadcrumbNames(prev => ({...prev, [lastSegment]: data.full_name}));
         }
      }
    };
    fetchBreadcrumbName();

    const handleBreadcrumbUpdate = (e: any) => {
      const { id, title } = e.detail;
      setBreadcrumbNames(prev => ({...prev, [id]: title}));
    };
    window.addEventListener('breadcrumb-update', handleBreadcrumbUpdate);

    const handleSaveStatusUpdate = (e: any) => {
      const { status } = e.detail;
      setSaveStatus(status);
      if (status === 'saved') {
        setTimeout(() => {
          setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 3000);
      }
    };
    window.addEventListener('save-status-update', handleSaveStatusUpdate);

    return () => {
      window.removeEventListener('breadcrumb-update', handleBreadcrumbUpdate);
      window.removeEventListener('save-status-update', handleSaveStatusUpdate);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let currentRole = user.user_metadata?.role;
        let schoolId = user.user_metadata?.school_id || user.user_metadata?.schoolId;

        if (!currentRole || !schoolId) {
          // Check if they are a school admin
          const { data: adminProfile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
          if (adminProfile) {
            currentRole = 'school_admin';
            schoolId = adminProfile.school_id;
          } else {
            // Check if they are a teacher
            const { data: teacherProfile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
            if (teacherProfile) {
              currentRole = 'teacher';
              schoolId = teacherProfile.school_id;
            }
          }
        }
        
        setRole(currentRole || 'school_admin');

        if (schoolId) {
          const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();
          if (school) setSchoolName(school.name);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/school-admin';
    return pathname?.startsWith(href);
  };

  const getBreadcrumbs = () => {
    const segments = pathname?.split('/').filter(Boolean) || [];
    const crumbs = [];

    // The root is always Dashboard
    if (segments[0] === 'school-admin' || segments.length === 0 || (segments.length === 1 && segments[0] !== 'exams' && segments[0] !== 'teachers' && segments[0] !== 'students' && segments[0] !== 'results')) {
      crumbs.push({ label: 'Dashboard', href: '/' });
    } else {
      crumbs.push({ label: 'Dashboard', href: '/' });
    }

    if (segments.includes('exams')) {
      crumbs.push({ label: 'Exams', href: '/exams' });
    } else if (segments.includes('teachers')) {
      crumbs.push({ label: 'Teachers', href: '/teachers' });
    } else if (segments.includes('students')) {
      crumbs.push({ label: 'Students', href: '/students' });
    } else if (segments.includes('results')) {
      crumbs.push({ label: 'Results', href: '/results' });
    }

    const lastSegment = segments[segments.length - 1];
    
    // Add additional segments if it's a detail page
    if (lastSegment && !['exams', 'teachers', 'students', 'results', 'school-admin'].includes(lastSegment)) {
      if (lastSegment === 'new') {
         crumbs.push({ label: 'New', href: null });
      } else {
         const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
         if (isUUID && !breadcrumbNames[lastSegment]) {
           crumbs.push({ label: 'Loading...', href: null });
         } else {
           crumbs.push({ label: breadcrumbNames[lastSegment] || lastSegment, href: null });
         }
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg">
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 h-[100dvh] bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-48 translate-x-0' : 'w-48 -translate-x-full md:translate-x-0 md:w-16'}`}>
        
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute -right-3 top-5 w-6 h-6 bg-sidebar-bg rounded-full items-center justify-center text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors border border-sidebar-border z-50 shadow-sm cursor-pointer"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface flex items-center justify-center flex-shrink-0 rounded-lg shadow-sm">
              <img src="/logo.png" alt="Growtez Logo" className="w-7 h-7 object-contain" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-sidebar-text to-sidebar-text-muted font-extrabold text-lg tracking-wide leading-tight truncate drop-shadow-sm" title="ParikshaOS">
                  ParikshaOS
                </h1>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {!role ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-3 py-3 rounded-xl bg-sidebar-hover animate-pulse h-11 w-full" />
              ))}
            </div>
          ) : (
            navItems.filter(item => {
              if (role === 'teacher') {
                return ['Dashboard', 'Exams', 'Results'].includes(item.label);
              }
              return true;
            }).map((item) => {
            const activeClass = "bg-accent-primary/15 text-sidebar-text rounded-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border-accent-primary font-semibold";
            const inactiveClass = "text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text rounded-lg border-transparent";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center px-2.5 py-2 text-[13px] font-medium rounded-lg mb-1 border transition-colors group ${
                  isActive(item.href) ? activeClass : inactiveClass
                }`}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <div className={`flex items-center justify-center shrink-0 grow-0 w-[20px] h-[20px] transition-transform duration-200 ${isActive(item.href) ? 'text-accent-secondary' : 'text-sidebar-text-muted group-hover:text-sidebar-text group-hover:scale-110'}`}>
                  <div className="scale-90 flex">{item.icon}</div>
                </div>
                <div className={`ml-2.5 h-full flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${!sidebarOpen ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}>
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          }))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center px-2.5 py-2 text-[13px] font-medium rounded-lg mb-1 border border-transparent text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors group"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="flex items-center justify-center shrink-0 grow-0 w-[20px] h-[20px] transition-transform duration-200 group-hover:scale-110">
              <div className="scale-90 flex">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</div>
            </div>
            <div className={`ml-2.5 h-full flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${!sidebarOpen ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}>
              <span className="truncate">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
          <button
            onClick={() => setShowSignoutConfirm(true)}
            className="w-full flex items-center px-2.5 py-2 text-[13px] font-medium rounded-lg border border-transparent text-sidebar-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors group"
          >
            <div className="flex items-center justify-center shrink-0 grow-0 w-[20px] h-[20px] transition-transform duration-200 group-hover:scale-110">
              <div className="scale-90 flex"><LogOut className="w-5 h-5" /></div>
            </div>
            <div className={`ml-2.5 h-full flex items-center overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${!sidebarOpen ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}>
              <span className="truncate">Sign out</span>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-text-muted hover:text-accent-primary hover:bg-surface-hover rounded-lg p-2 transition-colors md:hidden shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center text-sm md:text-base font-medium text-text-main overflow-hidden min-w-0 w-full">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={index} className={`items-center min-w-0 ${isLast ? 'flex flex-1' : 'hidden md:inline-flex shrink-0'}`}>
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-accent-primary text-text-muted transition-colors font-semibold truncate max-w-xs xl:max-w-md">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-accent-primary font-bold truncate">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && <span className="text-border mx-2">/</span>}
                  </span>
                );
              })}
            </div>
            {saveStatus !== 'idle' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ml-2 shrink-0 ${
                saveStatus === 'saving' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                saveStatus === 'saved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {saveStatus === 'saving' && <span className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />}
                {saveStatus === 'saved' && <Check size={10} />}
                {saveStatus === 'saving' ? 'Saving...' :
                 saveStatus === 'saved' ? 'Saved' :
                 'Error'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 ml-auto shrink-0">
            {schoolName && (
              <span className="text-base font-bold text-text-main hidden sm:block truncate max-w-[50vw]" title={schoolName}>
                {schoolName}
              </span>
            )}
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => role !== 'teacher' && setProfileDropdownOpen(!profileDropdownOpen)}
                className={`w-9 h-9 bg-gradient-to-br from-accent-primary to-accent-primary/70 rounded-full flex items-center justify-center shadow-sm transition-shadow ${role !== 'teacher' ? 'cursor-pointer hover:shadow-md' : ''}`}
              >
                <User className="text-white w-5 h-5" />
              </div>
              
              {profileDropdownOpen && role !== 'teacher' && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-accent-primary transition-colors">
                      <User className="w-4 h-4 mr-3 text-text-muted" />
                      Profile & Notifications
                    </Link>
                    <Link href="/feedback" onClick={() => setProfileDropdownOpen(false)} className="flex items-center px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-accent-primary transition-colors">
                      <MessageSquare className="w-4 h-4 mr-3 text-text-muted" />
                      Feedback
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Sign Out</h3>
              <p className="text-text-muted text-sm font-medium mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSignoutConfirm(false)}
                  className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-red-500/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
